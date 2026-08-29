import { z } from "@hono/zod-openapi";

export const AuditLogEntrySchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    tableName: z.string().openapi({ example: "clients" }),
    recordId: z.number().nullable().openapi({ example: 5 }),
    action: z.string().openapi({ example: "update" }),
    recordUuid: z.string().uuid().nullable().openapi({example: "11111111-1111-1111-1111-111111111111",}),
    oldData: z
      .any()
      .nullable()
      .openapi({ example: { name: "Jane Cooper", status: true } }),
    modifiedBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    modifiedAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("AuditLogEntry");

export const HistoryQuerySchema = z.object({
  table: z
    .string()
    .optional()
    .openapi({
      param: { name: "table", in: "query" },
      example: "clients",
      description: "Filter to changes on a single table",
    }),
  recordId: z.coerce
    .number()
    .optional()
    .openapi({
      param: { name: "recordId", in: "query" },
      example: 5,
      description: "Filter to changes on a single record (requires `table` too)",
    }),
});