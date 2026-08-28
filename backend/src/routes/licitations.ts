import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { licitations, licitationItems, products } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import { recalcLicitationTotals } from "../lib/licitationTotals.js";
import {
  LicitationSchema,
  CreateLicitationSchema,
  UpdateLicitationSchema,
  LicitationItemSchema,
  CreateLicitationItemSchema,
  UpdateLicitationItemSchema,
  IdParamSchema,
  LicitationItemParamsSchema,
} from "../schemas/licitationsSchema.js";

export const licitationsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

licitationsRoute.use("*", requireAuth);

// GET /licitations
licitationsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Licitations"],
    summary: "List licitations",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of licitations, recent first",
        content: { "application/json": { schema: z.array(LicitationSchema) } },
      },
    },
  }),
  async (c) => c.json(await db.select().from(licitations).orderBy(licitations.id))
);
// GET /licitations/:id + items related to it
licitationsRoute.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    tags: ["Licitations"],
    summary: "Get a licitation with its line items",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: "Licitation with items",
        content: {
          "application/json": {
            schema: LicitationSchema.extend({ items: z.array(LicitationItemSchema) }),
          },
        },
      },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const [licitation] = await db.select().from(licitations).where(eq(licitations.id, id));
    if (!licitation) return c.json({ message: "Licitation not found" }, 404);
    const items = await db
      .select()
      .from(licitationItems)
      .where(eq(licitationItems.licitationId, id));
    return c.json({ ...licitation, items }, 200);
  }
);

// POST /licitations 
licitationsRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Licitations"],
    summary: "Create a licitation (starts empty — add line items separately)",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreateLicitationSchema } } } },
    responses: {
      201: {
        description: "Created licitation",
        content: { "application/json": { schema: LicitationSchema } },
      },
      409: { description: "Referenced client does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(licitations)
          .values({
            reference: body.reference,
            date: new Date(body.date),
            limit_date: new Date(body.limit_date),
            clientId: body.clientId,
              
            document: body.document,
            base: "0.00",
            discount: "0.00",
            taxes: "0.00",
            total: "0.00",
            createdBy: userId,
          })
          .returning();
        await logAudit(tx, {
          tableName: "licitations",
          recordId: created.id,
          action: "insert",
          oldData: null,
          userId,
        });
        return created;
      })
    );
    if (result instanceof Response) return result;
    return c.json(result, 201);
  }
);

// PATCH /licitations/:id
licitationsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Licitations"],
    summary: "Update a licitation's status, dates, notes, or document",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateLicitationSchema } } },
    },
    responses: {
      200: {
        description: "Updated licitation",
        content: { "application/json": { schema: LicitationSchema } },
      },
      404: { description: "Not found" },
      409: { description: "Referenced client does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(licitations).where(eq(licitations.id, id));
        if (!before) return null;

        const [updated] = await tx
          .update(licitations)
          .set({
            ...(body.date !== undefined && { date: new Date(body.date) }),
            ...(body.reference !== undefined && { reference: body.reference }),
            ...(body.limit_date !== undefined && { limit_date: new Date(body.limit_date) }),
            ...(body.clientId !== undefined && { clientId: body.clientId }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.document !== undefined && { document: body.document }),
            ...(body.isDocumentGenerated !== undefined && {
              isDocumentGenerated: body.isDocumentGenerated,
            }),
            ...(body.notes !== undefined && { notes: body.notes }),
          })
          .where(eq(licitations.id, id))
          .returning();
        await logAudit(tx, {
          tableName: "licitations",
          recordId: id,
          action: "update",
          oldData: before,
          userId,
        });
        return updated;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Licitation not found" }, 404);
    return c.json(result, 200);
  }
);
// DELETE /licitations/:id
licitationsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Licitations"],
    summary: "Delete a licitation and its line items",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Not found" },
      409: { description: "Still referenced by payments" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(licitations).where(eq(licitations.id, id));
        if (!before) return null;

        // licitation_items cascade automatically at the DB level; payments
        // reference licitations with `restrict`, so this throws a 409 if any
        // payment still points here — see withDbErrorHandling above.
        await tx.delete(licitations).where(eq(licitations.id, id));
        await logAudit(tx, {
          tableName: "licitations",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Licitation not found" }, 404);
    return c.body(null, 204);
  }
);


// POST — /licitations/{id}/items
licitationsRoute.openapi(
  createRoute({
    method: "post",
    path: "/{id}/items",
    tags: ["Licitations"],
    summary: "Add a product line item to a licitation",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: CreateLicitationItemSchema } } },
    },
    responses: {
      201: {
        description: "Created line item",
        content: { "application/json": { schema: LicitationItemSchema } },
      },
      404: { description: "Licitation or product not found" },
      409: { description: "Referenced tax or discount does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id: licitationId } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [licitation] = await tx
          .select()
          .from(licitations)
          .where(eq(licitations.id, licitationId));
        if (!licitation) return { notFound: "licitation" as const };

        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, body.productId));
        if (!product) return { notFound: "product" as const };

        // Snapshot the product's current price
        const [created] = await tx
          .insert(licitationItems)
          .values({
            licitationId,
            productId: body.productId,
            quantity: body.quantity,
            price: product.price,
            taxId: body.taxId,
            discountId: body.discountId,
          })
          .returning();

        await recalcLicitationTotals(tx, licitationId);
        await logAudit(tx, {
          tableName: "licitation_items",
          recordId: created.id,
          action: "insert",
          oldData: null,
          userId,
        });
        return created;
      })
    );
    if (result instanceof Response) return result;
    if ("notFound" in result) {
      return c.json(
        { message: result.notFound === "licitation" ? "Licitation not found" : "Product not found" },
        404
      );
    }
    return c.json(result, 201);
  }
);

// PATCH /licitations/:id/items/:itemId
licitationsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/items/{itemId}",
    tags: ["Licitations"],
    summary: "Update a line item's quantity, tax, or discount",
    security: [{ bearerAuth: [] }],
    request: {
      params: LicitationItemParamsSchema,
      body: { content: { "application/json": { schema: UpdateLicitationItemSchema } } },
    },
    responses: {
      200: {
        description: "Updated line item",
        content: { "application/json": { schema: LicitationItemSchema } },
      },
      404: { description: "Line item not found" },
      409: { description: "Referenced tax or discount does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id: licitationId, itemId } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx
          .select()
          .from(licitationItems)
          .where(eq(licitationItems.id, itemId));
        if (!before || before.licitationId !== licitationId) return null;

        const [updated] = await tx
          .update(licitationItems)
          .set({
            ...(body.quantity !== undefined && { quantity: body.quantity }),
            ...(body.taxId !== undefined && { taxId: body.taxId }),
            ...(body.discountId !== undefined && { discountId: body.discountId }),
          })
          .where(eq(licitationItems.id, itemId))
          .returning();

        await recalcLicitationTotals(tx, licitationId);
        await logAudit(tx, {
          tableName: "licitation_items",
          recordId: itemId,
          action: "update",
          oldData: before,
          userId,
        });
        return updated;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Line item not found" }, 404);
    return c.json(result, 200);
  }
);

licitationsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}/items/{itemId}",
    tags: ["Licitations"],
    summary: "Remove a line item from a licitation",
    security: [{ bearerAuth: [] }],
    request: { params: LicitationItemParamsSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Line item not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id: licitationId, itemId } = c.req.valid("param");

    const result = await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(licitationItems)
        .where(eq(licitationItems.id, itemId));
      if (!before || before.licitationId !== licitationId) return null;

      await tx.delete(licitationItems).where(eq(licitationItems.id, itemId));
      await recalcLicitationTotals(tx, licitationId);
      await logAudit(tx, {
        tableName: "licitation_items",
        recordId: itemId,
        action: "delete",
        oldData: before,
        userId,
      });
      return before;
    });
    if (!result) return c.json({ message: "Line item not found" }, 404);
    return c.body(null, 204);
  }
);
