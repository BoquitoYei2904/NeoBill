import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { auditLog } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { AuditLogEntrySchema, HistoryQuerySchema } from "../schemas/historySchema.js";

export const historyRoute = new OpenAPIHono<{ Variables: { userId: string } }>();

historyRoute.use("*", requireAuth);

// GET /history?table=[tablename]&recordId=[recordId]
historyRoute.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["History"],
    summary: "List audit log entries for a given table and record ID",
    security: [{ bearerAuth: [] }],
    request: { query: HistoryQuerySchema },
    responses: {
      200: {
        description: "Audit log entries, most recent first",
        content: { "application/json": { schema: z.array(AuditLogEntrySchema) } },
      },
    },
  }),
  async (c) => {
    const { table, recordId } = c.req.valid("query");

    const conditions = [
      table ? eq(auditLog.tableName, table) : undefined,
      recordId !== undefined ? eq(auditLog.recordId, recordId) : undefined,
    ].filter((cond): cond is NonNullable<typeof cond> => cond !== undefined);

    const result = await db
      .select()
      .from(auditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.modifiedAt));

    return c.json(
      result.map((row) => ({ ...row, modifiedAt: row.modifiedAt.toISOString() })),
      200
    );
  }
);
