import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, and, gt, asc, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { licitations, licitationItems, products, clients } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import { recalcLicitationTotals } from "../lib/licitationLogic/licitationTotals.js";
import {
  LicitationSchema,
  CreateLicitationSchema,
  UpdateLicitationSchema,
  LicitationItemSchema,
  CreateLicitationItemSchema,
  UpdateLicitationItemSchema,
  BulkLineItemSchema,
  UpdateLicitationWithItemsSchema,
  IdParamSchema,
  LicitationItemParamsSchema,
  LicitationStateSchema,
  UpcomingExpirationsSchema
} from "../schemas/licitationsSchema.js";
import { checkLicitationStatus, onDocument, onStatusShift, InvalidStatusTransitionError } from "../lib/licitationLogic/licitationControl.js";
import { supabaseStorage } from "../lib/supabaseStorage.js";
import { File } from "node:buffer";
import { randomUUID } from "node:crypto";
import { getDocumentSignedUrl, LicitationNotFoundError, NoDocumentError } from "../lib/getDocumentSignedUrl.js";


export const licitationsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

licitationsRoute.use("*", requireAuth);

//helpers
function normalizeNotes(notes: any): string {
  if (notes === null || notes === undefined) return "";
  return String(notes).trim();
}
 
function normalizeDiscountId(discountId: any): number | null {
  if (discountId === null || discountId === undefined) return null;
  const id = Number(discountId);
  return id === 0 ? null : id;
}


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

// GET /licitationsList
licitationsRoute.openapi(
  createRoute({
    method: "get",
    path: "/licitationsList",
    tags: ["Licitations"],
    summary: "Summarized list of licitations",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of licitations",
        content: { "application/json": { schema: z.array(LicitationSchema) } },
      },
      401: { description: "Missing or invalid auth token" },
    },
  }),
  async (c) => {
    const licitationsResult = await db.select().from(licitations).orderBy(licitations.id);
    const ClientResult = await db.select().from(clients).orderBy(clients.id);
    const licitationList = licitationsResult.map((licitation) => ({
      id: licitation.id,
      codigo: licitation.reference,
      descripcion: licitation.notes,
      fecha: licitation.date,
      fechaLimite: licitation.limit_date,
      presupuesto: licitation.total,
      status: licitation.status,
      cliente: ClientResult.find((item) => item.id === Number(licitation.clientId))?.name || "Unknown",
    }));
    return c.json(licitationList);
  }
);

// GET /licitations/upcoming-expirations
licitationsRoute.openapi(
  createRoute({
    method: "get",
    path: "/upcoming-expirations",
    tags: ["Licitations"],
    summary: "Get the 5 licitations closest to their expiration date",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Upcoming expirations, soonest first",
        content: { "application/json": { schema: UpcomingExpirationsSchema } },
      },
    },
  }),
  async (c) => {
    const now = new Date();

    const rows = await db
      .select({
        id: licitations.id,
        clientName: clients.name,
        total: licitations.total,
        limitDate: licitations.limit_date,
      })
      .from(licitations)
      .innerJoin(clients, eq(licitations.clientId, clients.id))
      .where(and(eq(licitations.status, "activa"), gt(licitations.limit_date, now)))
      .orderBy(asc(licitations.limit_date))
      .limit(5);

    const result = rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      amount: Number(row.total),
      limitDate: row.limitDate.toISOString(),
    }));

    return c.json(result, 200);
  }
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
    return c.json({ ...licitation, lineItems: items }, 200);
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
            notes: body.notes != null ? body.notes : "",
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

        await checkLicitationStatus(tx, id);

        const [before] = await tx.select().from(licitations).where(eq(licitations.id, id));
        if (!before) return null;

        const [updated] = await tx
          .update(licitations)
          .set({
            ...(body.date !== undefined && { date: new Date(body.date) }),
            ...(body.reference !== undefined && { reference: body.reference }),
            ...(body.limit_date !== undefined && { limit_date: new Date(body.limit_date) }),
            ...(body.clientId !== undefined && { clientId: body.clientId }),
            ...(body.notes !== undefined && { notes: normalizeNotes(body.notes) }),
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

        await checkLicitationStatus(tx, id);

        const [before] = await tx.select().from(licitations).where(eq(licitations.id, id));
        if (!before) return null;

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

// POST /licitations/{id}/items
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

        await checkLicitationStatus(tx, licitationId);
        
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

        // Snapshot the product's current price and use provided description
        const [created] = await tx
          .insert(licitationItems)
          .values({
            licitationId,
            productId: body.productId,
            description: body.description,
            quantity: body.quantity,
            price: body.price ?? product.price,
            taxId: body.taxId,
            discountId: body.discountId ?? null,
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
    summary: "Update a line item's description, quantity, price, tax, or discount",
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

        await checkLicitationStatus(tx, licitationId);

        const [before] = await tx
          .select()
          .from(licitationItems)
          .where(eq(licitationItems.id, itemId));
        if (!before || before.licitationId !== licitationId) return null;

        const [updated] = await tx
          .update(licitationItems)
          .set({
            ...(body.description !== undefined && { description: body.description }),
            ...(body.quantity !== undefined && { quantity: body.quantity }),
            ...(body.price !== undefined && { price: body.price }),
            ...(body.taxId !== undefined && { taxId: body.taxId }),
            ...(body.discountId !== undefined && { discountId: normalizeDiscountId(body.discountId) }),
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

// DELETE /licitations/:id/items/:itemId
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

      await checkLicitationStatus(tx, licitationId);

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

// PATCH /licitations/:id/update
licitationsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/update",
    tags: ["Licitations"],
    summary: "Update licitation and all line items in one transaction",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateLicitationWithItemsSchema } } },
    },
    responses: {
      200: {
        description: "Updated licitation with items",
        content: { "application/json": { schema: LicitationSchema.extend({ lineItems: z.array(LicitationItemSchema) }) } },
      },
      404: { description: "Licitation not found" },
      409: { description: "Referenced client or product does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id: licitationId } = c.req.valid("param");
    const body = c.req.valid("json");
 
    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        
        await checkLicitationStatus(tx, licitationId);

        // Verify licitation exists
        const [licitation] = await tx.select().from(licitations).where(eq(licitations.id, licitationId));
        if (!licitation) return null;
 
        // Update licitation metadata if provided
        if (body.reference || body.date || body.limit_date || body.notes) {
          await tx
            .update(licitations)
            .set({
              ...(body.date !== undefined && { date: new Date(body.date) }),
              ...(body.reference !== undefined && { reference: body.reference }),
              ...(body.limit_date !== undefined && { limit_date: new Date(body.limit_date) }),
              ...(body.notes !== undefined && { notes: normalizeNotes(body.notes) }),
            })
            .where(eq(licitations.id, licitationId));
        }
 
        // Handle line items if provided
        if (body.lineItems && body.lineItems.length > 0) {
          // Separate new items (id < 0) from existing (id > 0)
          const newItems = body.lineItems.filter((item) => item.id < 0);
          const existingItems = body.lineItems.filter((item) => item.id > 0);
          const incomingIds = existingItems.map((item) => item.id);
 
          // Find existing items in DB
          const dbItems = await tx
            .select()
            .from(licitationItems)
            .where(eq(licitationItems.licitationId, licitationId));
 
          // Items to delete (in DB but not in incoming list)
          const itemsToDelete = dbItems.filter((item) => !incomingIds.includes(item.id)).map((item) => item.id);
 
          // 1. DELETE removed items
          if (itemsToDelete.length > 0) {
            await tx
              .delete(licitationItems)
              .where(inArray(licitationItems.id, itemsToDelete));
          }
 
          // 2. INSERT new items (negative IDs)
          if (newItems.length > 0) {
            await tx.insert(licitationItems).values(
              newItems.map((item) => ({
                licitationId,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                price: item.price.toFixed(2),
                taxId: item.taxId,
                discountId: normalizeDiscountId(item.discountId) ?? null,
              }))
            );
          }
 
          // 3. UPDATE existing items (positive IDs)
          for (const item of existingItems) {
            await tx
              .update(licitationItems)
              .set({
                description: item.description,
                quantity: item.quantity,
                price: item.price.toFixed(2),
                taxId: item.taxId,
                discountId: normalizeDiscountId(item.discountId) ?? null,
              })
              .where(eq(licitationItems.id, item.id));
          }
 
          // Log changes for audit
          for (const deletedId of itemsToDelete) {
            const deletedItem = dbItems.find((item) => item.id === deletedId);
            await logAudit(tx, {
              tableName: "licitation_items",
              recordId: deletedId,
              action: "delete",
              oldData: deletedItem,
              userId,
            });
          }
 
          for (const item of newItems) {
            await logAudit(tx, {
              tableName: "licitation_items",
              recordId: 0, // Not yet created, will show in response
              action: "insert",
              oldData: null,
              userId,
            });
          }
 
          for (const item of existingItems) {
            const oldItem = dbItems.find((i) => i.id === item.id);
            await logAudit(tx, {
              tableName: "licitation_items",
              recordId: item.id,
              action: "update",
              oldData: oldItem,
              userId,
            });
          }
        }
 
        // Recalculate totals
        await recalcLicitationTotals(tx, licitationId);
 
        // Fetch and return updated licitation with items
        const [updated] = await tx.select().from(licitations).where(eq(licitations.id, licitationId));
        const items = await tx
          .select()
          .from(licitationItems)
          .where(eq(licitationItems.licitationId, licitationId));
 
        return { ...updated, lineItems: items };
      })
    );
 
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Licitation not found" }, 404);
    return c.json(result, 200);
  }
);

// PATCH /Licitations/:id/setChange
licitationsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}/setChange",
    tags: ["Licitations"],
    summary: "Update a licitation's status",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: LicitationStateSchema } } },
    },
    responses: {
      200: {
        description: "Updated licitation",
        content: { "application/json": { schema: LicitationStateSchema } },
      },
      404: { description: "Not found" },
      409: { description: "Invalid status transition" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    try {
      const result = await withDbErrorHandling(c, () =>
        db.transaction(async (tx) => {

          const [before] = await tx.select().from(licitations).where(eq(licitations.id, id));
          if (!before) return null;

          const updated = await onStatusShift(tx, id, body.status);

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
    } catch (err) {
      if (err instanceof InvalidStatusTransitionError) {
        return c.json({ message: err.message }, 409);
      }
      throw err;
    }
  }
);

// FILES
// POST /licitations/:id/document
licitationsRoute.openapi(
  createRoute({
    method: "post",
    path: "/{id}/document",
    tags: ["Licitations"],
    summary: "Upload or replace a licitation document",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: { description: "Document uploaded/updated" },
      400: { description: "No file provided" },
      404: { description: "Licitation not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        await checkLicitationStatus(tx, id);

        const [licitation] = await tx
          .select()
          .from(licitations)
          .where(eq(licitations.id, id));

        if (!licitation) {
          return c.json({ message: "Licitation not found" }, 404);
        }

        const formData = await c.req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
          return c.json({ message: "No file provided" }, 400);
        }

        const extension = file.name.includes(".")
          ? file.name.substring(file.name.lastIndexOf("."))
          : "";

        const filePath = `licitations/${id}/${randomUUID()}${extension}`;
        const fileBuffer = await file.arrayBuffer();

        const { data, error } = await supabaseStorage.storage
          .from("licitations")
          .upload(filePath, fileBuffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false, // always a fresh path, so this stays false
          });

        if (error) {
          console.error("Supabase Storage upload error:", error);
          return c.json({ message: "Failed to upload document" }, 500);
        }

        const previousDocument = licitation.document;

        const [updated] = await tx
          .update(licitations)
          .set({
            document: data.path,
            isDocumentGenerated: true,
          })
          .where(eq(licitations.id, id))
          .returning();

        await checkLicitationStatus(tx, id);
        await onDocument(tx, id, data.path);

        await logAudit(tx, {
          tableName: "licitations",
          recordId: id,
          action: "update",
          oldData: licitation,
          userId,
        });

        // If this was a replace, clean up the old file now that the row points at the new one
        if (previousDocument && previousDocument !== data.path) {
          const { error: removeError } = await supabaseStorage.storage
            .from("licitations")
            .remove([previousDocument]);

          if (removeError) {
            console.error("Failed to remove old document:", removeError);
          }
        }

        return c.json(
          {
            message: previousDocument
              ? "Document updated successfully"
              : "Document uploaded successfully",
            path: data.path,
            licitation: updated,
          },
          200
        );
      })
    );

    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Licitation not found" }, 404);
    return c.json(result, 200);
  }
);

// GET /licitations/:id/document
licitationsRoute.openapi(
  createRoute({
    method: "get",
    path: "/{id}/document",
    tags: ["Licitations"],
    summary: "Get a signed URL for the licitation document",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
    },
    responses: {
      200: {
        description: "Signed URL generated",
        content: {
          "application/json": {
            schema: z.object({
              url: z.string(),
              expiresIn: z.number(),
            }),
          },
        },
      },
      404: { description: "Licitation or document not found" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    try {
      const result = await getDocumentSignedUrl(id); // no ttl arg — always default
      c.header("Cache-Control", "no-store");
      return c.json(result, 200);
    } catch (err) {
      if (err instanceof LicitationNotFoundError) return c.json({ message: err.message }, 404);
      if (err instanceof NoDocumentError) return c.json({ message: err.message }, 404);
      console.error("getDocumentSignedUrl error:", err);
      return c.json({ message: "Failed to generate document URL" }, 500);
    }
  }
);


