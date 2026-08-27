import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { products } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  IdParamSchema,
} from "../schemas/productsSchema.js";

export const productsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

productsRoute.use("*", requireAuth);

// GET /products
productsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Products"],
    summary: "List products",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of products",
        content: { "application/json": { schema: z.array(ProductSchema) } },
      },
    },
  }),
  async (c) => c.json(await db.select().from(products).orderBy(products.id))
);

// POST /products
productsRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Products"],
    summary: "Create a product",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreateProductSchema } } } },
    responses: {
      201: {
        description: "Created product",
        content: { "application/json": { schema: ProductSchema } },
      },
      409: { description: "Referenced tax rate does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(products)
          .values({
            description: body.description,
            code: body.code,
            price: String(body.price),
            cost: String(body.cost),
            notes: body.notes,
            tags: body.tags ?? [],
            taxId: body.taxId,
            createdBy: userId,
          })
          .returning();
        await logAudit(tx, {
          tableName: "products",
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

// PATCH /products/:id
productsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Products"],
    summary: "Update a product (including deactivating via status: false)",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateProductSchema } } },
    },
    responses: {
      200: {
        description: "Updated product",
        content: { "application/json": { schema: ProductSchema } },
      },
      404: { description: "Product not found" },
      409: { description: "Referenced tax rate does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(products).where(eq(products.id, id));
        if (!before) return null;

        const [updated] = await tx
          .update(products)
          .set({
            ...(body.description !== undefined && { description: body.description }),
            ...(body.code !== undefined && { code: body.code }),
            ...(body.price !== undefined && { price: String(body.price) }),
            ...(body.cost !== undefined && { cost: String(body.cost) }),
            ...(body.notes !== undefined && { notes: body.notes }),
            ...(body.tags !== undefined && { tags: body.tags }),
            ...(body.taxId !== undefined && { taxId: body.taxId }),
            ...(body.status !== undefined && { status: body.status }),
          })
          .where(eq(products.id, id))
          .returning();
        await logAudit(tx, {
          tableName: "products",
          recordId: id,
          action: "update",
          oldData: before,
          userId,
        });
        return updated;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Product not found" }, 404);
    return c.json(result, 200);
  }
);

// DELETE /products/:id
productsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Products"],
    summary: "Delete a product (blocked if licitation items reference it — deactivate instead)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Product not found" },
      409: { description: "Product is still referenced by licitation items" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(products).where(eq(products.id, id));
        if (!before) return null;

        await tx.delete(products).where(eq(products.id, id));
        await logAudit(tx, {
          tableName: "products",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Product not found" }, 404);
    return c.body(null, 204);
  }
);
