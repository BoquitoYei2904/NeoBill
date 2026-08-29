import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { profiles } from "../db/schema.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { requireAuth, requireApproved, requireAdmin } from "../middleware/auth.js";
import {
  RequestAccessSchema,
  MeSchema,
  AccessRequestSchema,
  IdParamSchema,
} from "../schemas/authSchema";

export const authRoute = new OpenAPIHono<{
  Variables: { userId: string; userRole?: "admin" | "user" };
}>();

authRoute.use("/me", requireAuth);
authRoute.use("/requests", requireApproved, requireAdmin);
authRoute.use("/requests/*", requireApproved, requireAdmin);

// ---------------------------------------------------------------------------
// POST /auth/request-access — public, no login required.
// Creates a real (but unapproved) Supabase auth user immediately, so the
// password is handed straight to Supabase's own hashing — we never store it
// ourselves, not even temporarily. Access is withheld via `profiles.status`
// until an admin approves the request; see requireApproved.
// ---------------------------------------------------------------------------
authRoute.openapi(
  createRoute({
    method: "post",
    path: "/request-access",
    tags: ["Auth"],
    summary: "Request an account (does not grant access — an admin must approve it)",
    request: { body: { content: { "application/json": { schema: RequestAccessSchema } } } },
    responses: {
      201: { description: "Request submitted, pending admin approval" },
      409: { description: "An account with this email already exists" },
    },
  }),
  async (c) => {
    const { name, email, password } = c.req.valid("json");

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // admin approval is the real gate, so skip the extra email-confirm loop
    });

    if (error || !data.user) {
      console.error("admin.createUser failed:", error?.message, error);
      const alreadyExists = error?.message?.toLowerCase().includes("already");
      return c.json(
        {
          message: alreadyExists
            ? "An account with this email already exists."
            : "Could not submit request. Try again.",
        },
        alreadyExists ? 409 : 400
      );
    }

    await db.insert(profiles).values({
      id: data.user.id,
      email,
      name,
      roles: "user",
      status: "pending",
    });

    return c.json(
      { message: "Request submitted. An admin will review it before you can sign in." },
      201
    );
  }
);

// ---------------------------------------------------------------------------
// GET /auth/me — any authenticated user, regardless of approval status.
// Lets the frontend show "pending approval" instead of the dashboard.
// ---------------------------------------------------------------------------
authRoute.openapi(
  createRoute({
    method: "get",
    path: "/me",
    tags: ["Auth"],
    summary: "Get your own profile and approval status",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Current user's profile",
        content: { "application/json": { schema: MeSchema } },
      },
      403: { description: "No profile found for this account" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (!profile) return c.json({ message: "No profile found for this account." }, 403);
    return c.json(
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        roles: profile.roles,
        status: profile.status,
      },
      200
    );
  }
);

// ---------------------------------------------------------------------------
// Admin-only: review and decide on access requests
// ---------------------------------------------------------------------------

authRoute.openapi(
  createRoute({
    method: "get",
    path: "/requests",
    tags: ["Auth"],
    summary: "List access requests (admin only)",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        status: z
          .enum(["pending", "approved", "rejected"])
          .optional()
          .openapi({ param: { name: "status", in: "query" }, example: "pending" }),
      }),
    },
    responses: {
      200: {
        description: "Access requests",
        content: { "application/json": { schema: z.array(AccessRequestSchema) } },
      },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const { status } = c.req.valid("query");
    const rows = await db
      .select()
      .from(profiles)
      .where(status ? eq(profiles.status, status) : undefined)
      .orderBy(profiles.createdAt);
    return c.json(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        roles: r.roles,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      200
    );
  }
);

authRoute.openapi(
  createRoute({
    method: "post",
    path: "/requests/{id}/approve",
    tags: ["Auth"],
    summary: "Approve an access request (admin only)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      200: { description: "Approved" },
      404: { description: "Request not found" },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const [updated] = await db
      .update(profiles)
      .set({ status: "approved" })
      .where(eq(profiles.id, id))
      .returning();
    if (!updated) return c.json({ message: "Request not found" }, 404);
    return c.json({ message: "Approved." }, 200);
  }
);

authRoute.openapi(
  createRoute({
    method: "post",
    path: "/requests/{id}/reject",
    tags: ["Auth"],
    summary: "Reject an access request (admin only)",
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      200: { description: "Rejected" },
      404: { description: "Request not found" },
      403: { description: "Admin access required" },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const [updated] = await db
      .update(profiles)
      .set({ status: "rejected" })
      .where(eq(profiles.id, id))
      .returning();
    if (!updated) return c.json({ message: "Request not found" }, 404);
    return c.json({ message: "Rejected." }, 200);
  }
);
