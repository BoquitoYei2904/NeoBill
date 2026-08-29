import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireApproved, requireAdmin } from "../middleware/auth.js";
import { logAudit } from "../lib/auditLog.js";
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  IdParamSchema,
} from "../schemas/usersSchema";

export const usersRoute = new OpenAPIHono<{
  Variables: { userId: string; userRole: "admin" | "user" };
}>();

// Every route below is admin-only.
usersRoute.use("*", requireApproved, requireAdmin);

function toResponse(row: typeof profiles.$inferSelect) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roles: row.roles,
    status: row.status,
    age: row.age,
    address: row.address,
    phone: row.phone,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /users
usersRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Users"],
    summary: "List all users (admin only)",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of users",
        content: { "application/json": { schema: z.array(UserSchema) } },
      },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const rows = await db.select().from(profiles).orderBy(profiles.createdAt);
    return c.json(rows.map(toResponse), 200);
  }
);

// POST /users — creates the Supabase auth account AND the profile, approved immediately
usersRoute.openapi(
  createRoute({
    method: "post",
    path: "/",
    tags: ["Users"],
    summary: "Create a user (admin only) — creates both the auth account and profile",
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: CreateUserSchema } } } },
    responses: {
      201: {
        description: "Created user",
        content: { "application/json": { schema: UserSchema } },
      },
      409: { description: "A user with this email already exists" },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const adminId = c.get("userId");
    const { name, email, password, roles, age, address, phone } = c.req.valid("json");

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("admin.createUser failed:", error?.message, error);
      const alreadyExists = error?.message?.toLowerCase().includes("already");
      return c.json(
        {
          message: alreadyExists
            ? "A user with this email already exists."
            : "Could not create user. Try again.",
        },
        alreadyExists ? 409 : 400
      );
    }

    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(profiles)
        .values({
          id: data.user.id,
          email,
          name,
          roles,
          status: "approved",
          age,
          address,
          phone,
        })
        .returning();
      await logAudit(tx, {
        tableName: "profiles",
        recordUuid: row.id,
        action: "insert",
        oldData: null,
        userId: adminId,
      });
      return row;
    });

    return c.json(toResponse(created), 201);
  }
);

// PATCH /users/:id
usersRoute.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    tags: ["Users"],
    summary: "Update a user's profile, role, status, or password (admin only)",
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { content: { "application/json": { schema: UpdateUserSchema } } },
    },
    responses: {
      200: {
        description: "Updated user",
        content: { "application/json": { schema: UserSchema } },
      },
      404: { description: "User not found" },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const adminId = c.get("userId");
    const { id } = c.req.valid("param");
    const { password, ...profileUpdates } = c.req.valid("json");

    const [before] = await db.select().from(profiles).where(eq(profiles.id, id));
    if (!before) return c.json({ message: "User not found" }, 404);

    if (password) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (error) {
        console.error("admin.updateUserById (password) failed:", error.message);
        return c.json({ message: "Could not reset password. Try again." }, 400);
      }
    }

    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(profiles)
        .set(profileUpdates)
        .where(eq(profiles.id, id))
        .returning();
      await logAudit(tx, {
        tableName: "profiles",
        recordUuid: id,
        action: "update",
        oldData: before,
        userId: adminId,
      });
      return row;
    });

    return c.json(toResponse(updated), 200);
  }
);

// DELETE /users/:id
usersRoute.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["Users"],
    summary: "Delete a user (admin only)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      400: { description: "Cannot delete your own account" },
      404: { description: "User not found" },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const adminId = c.get("userId");
    const { id } = c.req.valid("param");

    if (id === adminId) {
      return c.json({ message: "You can't delete your own account." }, 400);
    }

    const [before] = await db.select().from(profiles).where(eq(profiles.id, id));
    if (!before) return c.json({ message: "User not found" }, 404);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error("admin.deleteUser failed:", error.message);
      return c.json({ message: "Could not delete user. Try again." }, 400);
    }

    // profiles.id cascades from auth.users, but delete explicitly in case
    // the row somehow outlived the auth user (defensive, not load-bearing).
    await db.transaction(async (tx) => {
      await tx.delete(profiles).where(eq(profiles.id, id));
      await logAudit(tx, {
        tableName: "profiles",
        recordUuid: id,
        action: "delete",
        oldData: before,
        userId: adminId,
      });
    });

    return c.body(null, 204);
  }
);
