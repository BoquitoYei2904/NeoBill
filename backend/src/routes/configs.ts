import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { taxes, discounts, typesClient } from "../db/schema.js";
import { requireAdminForWrites, requireApproved } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import {
  TaxSchema,
  CreateTaxSchema,
  UpdateTaxSchema,
  DiscountSchema,
  CreateDiscountSchema,
  UpdateDiscountSchema,
  ClientTypeSchema,
  CreateClientTypeSchema,
  UpdateClientTypeSchema,
  IdParamSchema,
} from "../schemas/configsSchema.js";

export const configsRoute = new OpenAPIHono<{
  Variables: { userId: string; userRole: "admin" | "user" }
}>();

configsRoute.use("*", requireApproved, requireAdminForWrites); //writing locked to admins only

// GET /taxes
configsRoute.openapi(
  createRoute({
    method: "get",
    path: "/taxes",
    tags: ["Configs"],
    summary: "List tax rates",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of tax rates",
        content: { "application/json": { schema: z.array(TaxSchema) } },
      },
    },
  }),
  async (c) => c.json(await db.select().from(taxes).orderBy(taxes.id))
);
// POST /taxes
configsRoute.openapi(
  createRoute({
    method: "post",
    path: "/taxes",
    tags: ["Configs"],
    summary: "Create a tax rate",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreateTaxSchema } } } },
    responses: {
      201: {
        description: "Created tax rate",
        content: { "application/json": { schema: TaxSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(taxes)
        .values({ name: body.name, percentage: String(body.percentage), status: body.status, createdBy: userId })
        .returning();
      await logAudit(tx, {
        tableName: "taxes",
        recordId: row.id,
        action: "insert",
        oldData: null,
        userId,
      });
      return row;
    });
    return c.json(created, 201);
  }
);
// PATCH /taxes/:id
configsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/taxes/{id}",
    tags: ["Configs"],
    summary: "Update a tax rate",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateTaxSchema } } },
    },
    responses: {
      200: {
        description: "Updated tax rate",
        content: { "application/json": { schema: TaxSchema } },
      },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(taxes).where(eq(taxes.id, id));
      if (!before) return null;
      const [updated] = await tx
        .update(taxes)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.percentage !== undefined && { percentage: String(body.percentage) }),
          ...(body.status !== undefined && { status: body.status }),
        })
        .where(eq(taxes.id, id))
        .returning();
      await logAudit(tx, {
        tableName: "taxes",
        recordId: id,
        action: "update",
        oldData: before,
        userId,
      });
      return updated;
    });
    if (!result) return c.json({ message: "Tax rate not found" }, 404);
    return c.json(result, 200);
  }
);
// DELETE /taxes/:id
configsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/taxes/{id}",
    tags: ["Configs"],
    summary: "Delete a tax rate (blocked if products or licitation items use it)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Not found" },
      409: { description: "Still referenced by products or licitation items" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(taxes).where(eq(taxes.id, id));
        if (!before) return null;
        await tx.delete(taxes).where(eq(taxes.id, id));
        await logAudit(tx, {
          tableName: "taxes",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Tax rate not found" }, 404);
    return c.body(null, 204);
  }
);



// GET /discounts
configsRoute.openapi(
  createRoute({
    method: "get",
    path: "/discounts",
    tags: ["Configs"],
    summary: "List discounts",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of discounts",
        content: { "application/json": { schema: z.array(DiscountSchema) } },
      },
    },
  }),
  async (c) => c.json(await db.select().from(discounts).orderBy(discounts.id))
);

// PUT /discounts
configsRoute.openapi(
  createRoute({
    method: "post",
    path: "/discounts",
    tags: ["Configs"],
    summary: "Create a discount",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreateDiscountSchema } } } },
    responses: {
      201: {
        description: "Created discount",
        content: { "application/json": { schema: DiscountSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(discounts)
        .values({ name: body.name, percentage: String(body.percentage), status: body.status, createdBy: userId })
        .returning();
      await logAudit(tx, {
        tableName: "discounts",
        recordId: row.id,
        action: "insert",
        oldData: null,
        userId,
      });
      return row;
    });
    return c.json(created, 201);
  }
);

// PATCH /discounts/:id
configsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/discounts/{id}",
    tags: ["Configs"],
    summary: "Update a discount",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateDiscountSchema } } },
    },
    responses: {
      200: {
        description: "Updated discount",
        content: { "application/json": { schema: DiscountSchema } },
      },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(discounts).where(eq(discounts.id, id));
      if (!before) return null;
      const [updated] = await tx
        .update(discounts)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.percentage !== undefined && { percentage: String(body.percentage) }),
          ...(body.status !== undefined && { status: body.status }),
        })
        .where(eq(discounts.id, id))
        .returning();
      await logAudit(tx, {
        tableName: "discounts",
        recordId: id,
        action: "update",
        oldData: before,
        userId,
      });
      return updated;
    });
    if (!result) return c.json({ message: "Discount not found" }, 404);
    return c.json(result, 200);
  }
);

// DELETE /discounts/:id
configsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/discounts/{id}",
    tags: ["Configs"],
    summary: "Delete a discount (blocked if licitation items use it)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Not found" },
      409: { description: "Still referenced by licitation items" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(discounts).where(eq(discounts.id, id));
        if (!before) return null;
        await tx.delete(discounts).where(eq(discounts.id, id));
        await logAudit(tx, {
          tableName: "discounts",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Discount not found" }, 404);
    return c.body(null, 204);
  }
);


// GET /client-types
configsRoute.openapi(
  createRoute({
    method: "get",
    path: "/client-types",
    tags: ["Configs"],
    summary: "List client types",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of client types",
        content: { "application/json": { schema: z.array(ClientTypeSchema) } },
      },
    },
  }),
  async (c) => c.json(await db.select().from(typesClient).orderBy(typesClient.id))
);

// PUT /client-types
configsRoute.openapi(
  createRoute({
    method: "post",
    path: "/client-types",
    tags: ["Configs"],
    summary: "Create a client type",
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: CreateClientTypeSchema } } },
    },
    responses: {
      201: {
        description: "Created client type",
        content: { "application/json": { schema: ClientTypeSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(typesClient)
        .values({ name: body.name, status: body.status, createdBy: userId })
        .returning();
      await logAudit(tx, {
        tableName: "types_client",
        recordId: row.id,
        action: "insert",
        oldData: null,
        userId,
      });
      return row;
    });
    return c.json(created, 201);
  }
);

// PATCH /client-types/:id
configsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/client-types/{id}",
    tags: ["Configs"],
    summary: "Update a client type",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateClientTypeSchema } } },
    },
    responses: {
      200: {
        description: "Updated client type",
        content: { "application/json": { schema: ClientTypeSchema } },
      },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(typesClient).where(eq(typesClient.id, id));
      if (!before) return null;
      const [updated] = await tx
        .update(typesClient)
        .set(body)
        .where(eq(typesClient.id, id))
        .returning();
      await logAudit(tx, {
        tableName: "types_client",
        recordId: id,
        action: "update",
        oldData: before,
        userId,
      });
      return updated;
    });
    if (!result) return c.json({ message: "Client type not found" }, 404);
    return c.json(result, 200);
  }
);

// DELETE /client-types/:id
configsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/client-types/{id}",
    tags: ["Configs"],
    summary: "Delete a client type (blocked if clients use it)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Not found" },
      409: { description: "Still referenced by clients" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(typesClient).where(eq(typesClient.id, id));
        if (!before) return null;
        await tx.delete(typesClient).where(eq(typesClient.id, id));
        await logAudit(tx, {
          tableName: "types_client",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Client type not found" }, 404);
    return c.body(null, 204);
  }
);
