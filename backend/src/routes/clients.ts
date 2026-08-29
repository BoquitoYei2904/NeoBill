import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";
import { typesClient } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import { withDbErrorHandling } from "../lib/dbErrors.js";
import {
  ClientSchema,
  CreateClientSchema,
  UpdateClientSchema,
  IdParamSchema,
  ClientListSchema,
} from "../schemas/clientsSchema.js";

export const clientsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

clientsRoute.use("*", requireAuth);

// GET /clients
clientsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Clients"],
    summary: "List clients",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of clients",
        content: { "application/json": { schema: z.array(ClientSchema) } },
      },
      401: { description: "Missing or invalid auth token" },
    },
  }),
  async (c) => {
    const result = await db.select().from(clients).orderBy(clients.id);
    return c.json(result);
  }
);

// GET /clientList
clientsRoute.openapi(
  createRoute({
    method: "get",
    path: "/clientList",
    tags: ["Clients"],
    summary: "Sumaried list clients",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of clients",
        content: { "application/json": { schema: z.array(ClientListSchema) } },
      },
      401: { description: "Missing or invalid auth token" },
    },
  }),
  async (c) => {
    const clientsResult = await db.select().from(clients).orderBy(clients.id);
    const clientTypesResult = await db.select().from(typesClient).orderBy(typesClient.id);
    const clientList = clientsResult.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      type: clientTypesResult.find((item) => item.id === Number(client.typeId))?.name || "Unknown",
      status: client.status ? "Activo" : "Inactivo",
    }));
    return c.json(clientList);
  }
);

// POST /clients
clientsRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Clients"],
    summary: "Create a client",
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: CreateClientSchema } } },
    },
    responses: {
      201: {
        description: "Created client",
        content: { "application/json": { schema: ClientSchema } },
      },
      401: { description: "Missing or invalid auth token" },
      409: { description: "Referenced type does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(clients)
          .values({ ...body, createdBy: userId })
          .returning();
        await logAudit(tx, {
          tableName: "clients",
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

// PATCH /clients/:id
clientsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Clients"],
    summary: "Update a client (including deactivating via status: false)",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateClientSchema } } },
    },
    responses: {
      200: {
        description: "Updated client",
        content: { "application/json": { schema: ClientSchema } },
      },
      404: { description: "Client not found" },
      401: { description: "Missing or invalid auth token" },
      409: { description: "Referenced type does not exist" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(clients).where(eq(clients.id, id));
        if (!before) return null;

        const [updated] = await tx
          .update(clients)
          .set(body)
          .where(eq(clients.id, id))
          .returning();
        await logAudit(tx, {
          tableName: "clients",
          recordId: id,
          action: "update",
          oldData: before,
          userId,
        });
        return updated;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Client not found" }, 404);
    return c.json(result, 200);
  }
);

// DELETE /clients/:id
clientsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Clients"],
    summary: "Delete a client (blocked if licitations or payments reference it — deactivate instead)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Client not found" },
      401: { description: "Missing or invalid auth token" },
      409: { description: "Client is still referenced by other records" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");

    const result = await withDbErrorHandling(c, () =>
      db.transaction(async (tx) => {
        const [before] = await tx.select().from(clients).where(eq(clients.id, id));
        if (!before) return null;

        await tx.delete(clients).where(eq(clients.id, id));
        await logAudit(tx, {
          tableName: "clients",
          recordId: id,
          action: "delete",
          oldData: before,
          userId,
        });
        return before;
      })
    );
    if (result instanceof Response) return result;
    if (!result) return c.json({ message: "Client not found" }, 404);
    return c.body(null, 204);
  }
);
