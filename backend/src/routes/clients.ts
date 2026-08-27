import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import {
  ClientSchema,
  CreateClientSchema,
  UpdateClientSchema,
  IdParamSchema,
} from "../schemas/clientSchema.js";



export const clientsRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

// All routes below require a valid Supabase auth token.
clientsRoute.use("*", requireAuth);

// GET /clients — only this user's clients
clientsRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Clients"],
    summary: "List your clients",
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
    const userId = c.get("userId");
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(clients.id);
    return c.json(result);
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
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const [created] = await db
      .insert(clients)
      .values({ ...body, userId })
      .returning();
    return c.json(created, 201);
  }
);

// PATCH /clients/:id
clientsRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Clients"],
    summary: "Update a client",
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
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const [updated] = await db
      .update(clients)
      .set(body)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    if (!updated) return c.json({ message: "Client not found" }, 404);
    return c.json(updated, 200);
  }
);

// DELETE /clients/:id
clientsRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Clients"],
    summary: "Delete a client",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: { description: "Client not found" },
      401: { description: "Missing or invalid auth token" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    if (!deleted) return c.json({ message: "Client not found" }, 404);
    return c.body(null, 204);
  }
);