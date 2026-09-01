import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { payments, licitations, clients } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import {
  PaymentSchema,
  CreatePaymentSchema,
  UpdatePaymentSchema,
  PaymentListItemSchema,
  IdParamSchema,
} from "../schemas/paymentsSchema.js";
import { PaymentAmountExceedsLicitationError, syncLicitationPaymentStatus, validatePaymentAmount } from "../lib/licitationLogic/licitationPaymentControl.js";

export const paymentsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

paymentsRoute.use("*", requireAuth);

// GET /payments
paymentsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Payments"],
    summary: "List all payments",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of payments",
        content: { "application/json": { schema: z.array(PaymentSchema) } },
      },
    },
  }),
  async (c) => {
    const paymentsList = await db.select().from(payments).orderBy(payments.id);
    return c.json(paymentsList);
  }
);

// GET /payments/summary (simplified list with client and licitation info)
paymentsRoute.openapi(
  createRoute({
    method: "get",
    path: "/summary",
    tags: ["Payments"],
    summary: "Get summarized payment list with client and licitation info",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of payments with summary info",
        content: { "application/json": { schema: z.array(PaymentListItemSchema) } },
      },
    },
  }),
  async (c) => {
    const paymentsList = await db.select().from(payments).orderBy(payments.id);
    const licitationsList = await db.select().from(licitations);
    const clientsList = await db.select().from(clients);

    const summary = paymentsList.map((payment) => ({
      id: payment.id,
      referencia: licitationsList.find((l) => l.id === payment.licitationId)?.reference || "Unknown",
      cliente: clientsList.find((c) => c.id === payment.clientId)?.name || "Unknown",
      monto: payment.amount,
      metodo: payment.payment_method,
      fecha: payment.date,
      notas: payment.notes,
    }));

    return c.json(summary);
  }
);

// GET /payments/:id
paymentsRoute.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Payments"],
    summary: "Get a single payment",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: "Payment details",
        content: { "application/json": { schema: PaymentSchema } },
      },
      404: { description: "Payment not found" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) return c.json({ message: "Payment not found" }, 404);
    return c.json(payment, 200);
  }
);

// POST /payments
paymentsRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Payments"],
    summary: "Create a new payment",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreatePaymentSchema } } } },
    responses: {
      201: {
        description: "Created payment",
        content: { "application/json": { schema: PaymentSchema } },
      },
      404: { description: "Licitation or client not found" },
      409: { description: "Referenced licitation or client does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    try {
      const result = await withDbErrorHandling(c, () =>
        db.transaction(async (tx) => {
          // Verify licitation exists
          const [licitation] = await tx
            .select()
            .from(licitations)
            .where(eq(licitations.id, body.licitationId));
          if (!licitation) return { notFound: "licitation" as const };

          // Verify client exists
          const [client] = await tx.select().from(clients).where(eq(clients.id, body.clientId));
          if (!client) return { notFound: "client" as const };

          await validatePaymentAmount(tx, body.licitationId, body.amount);

          // Create payment
          const [created] = await tx
            .insert(payments)
            .values({
              amount: body.amount.toFixed(2),
              payment_method: body.payment_method,
              date: new Date(body.date),
              licitationId: body.licitationId,
              clientId: body.clientId,
              notes: body.notes || null,
              createdBy: userId,
            })
            .returning();

          await logAudit(tx, {
            tableName: "payments",
            recordId: created.id,
            action: "insert",
            oldData: null,
            userId,
          });

          await syncLicitationPaymentStatus(tx, body.licitationId);

          return created;
        })
      );

      if (result instanceof Response) return result;
      if ("notFound" in result) {
        return c.json(
          {
            message:
              result.notFound === "licitation"
                ? "Licitation not found"
                : "Client not found",
          },
          404
        );
      }
      return c.json(result, 201);}
      catch (err) {
      if (err instanceof PaymentAmountExceedsLicitationError) {
        return c.json({ message: err.message }, 409);
      }
      throw err;
    }
  }
);

// PATCH /payments/:id
paymentsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Payments"],
    summary: "Update a payment",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdatePaymentSchema } } },
    },
    responses: {
      200: {
        description: "Updated payment",
        content: { "application/json": { schema: PaymentSchema } },
      },
      404: { description: "Payment not found" },
      409: { description: "Referenced licitation or client does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    try {
      const result = await withDbErrorHandling(c, () =>
        db.transaction(async (tx) => {
          const [before] = await tx.select().from(payments).where(eq(payments.id, id));
          if (!before) return null;

          // Verify licitation if being updated
          if (body.licitationId !== undefined) {
            const [licitation] = await tx
              .select()
              .from(licitations)
              .where(eq(licitations.id, body.licitationId));
            if (!licitation) return { notFound: "licitation" as const };
          }

          // Verify client if being updated
          if (body.clientId !== undefined) {
            const [client] = await tx
              .select()
              .from(clients)
              .where(eq(clients.id, body.clientId));
            if (!client) return { notFound: "client" as const };
          }

          const targetLicitationId = body.licitationId ?? before.licitationId;
          const targetAmount = body.amount ?? Number(before.amount);

          await validatePaymentAmount(tx, targetLicitationId, targetAmount, id);

          const [updated] = await tx
            .update(payments)
            .set({
              ...(body.amount !== undefined && { amount: body.amount.toFixed(2) }),
              ...(body.payment_method !== undefined && { payment_method: body.payment_method }),
              ...(body.date !== undefined && { date: new Date(body.date) }),
              ...(body.licitationId !== undefined && { licitationId: body.licitationId }),
              ...(body.clientId !== undefined && { clientId: body.clientId }),
              ...(body.notes !== undefined && { notes: body.notes }),
            })
            .where(eq(payments.id, id))
            .returning();

          await logAudit(tx, {
            tableName: "payments",
            recordId: id,
            action: "update",
            oldData: before,
            userId,
          });

          await syncLicitationPaymentStatus(tx, targetLicitationId);
          if (body.licitationId !== undefined && body.licitationId !== before.licitationId) {
            await syncLicitationPaymentStatus(tx, before.licitationId);
          }

          return updated;
        })
      );

      if (result instanceof Response) return result;
      if (!result) return c.json({ message: "Payment not found" }, 404);
      if ("notFound" in result) {
        return c.json(
          {
            message:
              result.notFound === "licitation"
                ? "Licitation not found"
                : "Client not found",
          },
          404
        );
      }
      return c.json(result, 200);
    }catch (err) {
      if (err instanceof PaymentAmountExceedsLicitationError) {
        return c.json({ message: err.message }, 409);
      }
      throw err;
    }
  }
);

// DELETE /payments/:id
paymentsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Payments"],
    summary: "Delete a payment",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Payment deleted" },
      404: { description: "Payment not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(payments).where(eq(payments.id, id));
        if (!before) return null;

        await tx.delete(payments).where(eq(payments.id, id));

        await logAudit(tx, {
          tableName: "payments",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });

        return before;
      })
    );

    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Payment not found" }, 404);
    return c.body(null, 204);
  }
);