import { z } from "@hono/zod-openapi";

export const RequestAccessSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Elena Rostova" }),
    email: z.string().email().openapi({ example: "elena@neobill.com" }),
    password: z.string().min(6).openapi({ example: "a-strong-password" }),
  })
  .openapi("RequestAccess");

export const MeSchema = z
  .object({
    id: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    email: z.string().openapi({ example: "elena@neobill.com" }),
    name: z.string().openapi({ example: "Elena Rostova" }),
    roles: z.enum(["admin", "user"]).openapi({ example: "user" }),
    status: z.enum(["pending", "approved", "rejected"]).openapi({ example: "pending" }),
  })
  .openapi("Me");

export const AccessRequestSchema = MeSchema.omit({}).extend({
  createdAt: z.string().openapi({ example: "2026-08-27T10:00:00.000Z" }),
}).openapi("AccessRequest");

export const IdParamSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
    example: "11111111-1111-1111-1111-111111111111",
  }),
});
