import { z } from "@hono/zod-openapi";

export const UserSchema = z
  .object({
    id: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    email: z.string().openapi({ example: "elena@neobill.com" }),
    name: z.string().openapi({ example: "Elena Rostova" }),
    roles: z.enum(["admin", "user"]).openapi({ example: "user" }),
    status: z.enum(["pending", "approved", "rejected"]).openapi({ example: "approved" }),
    age: z.number().nullable().openapi({ example: 32 }),
    address: z.string().nullable().openapi({ example: "123 Main St" }),
    phone: z.string().nullable().openapi({ example: "+1 555 0100" }),
    createdAt: z.string().openapi({ example: "2026-08-27T10:00:00.000Z" }),
  })
  .openapi("User");

export const CreateUserSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Elena Rostova" }),
    email: z.string().email().openapi({ example: "elena@neobill.com" }),
    password: z.string().min(6).openapi({ example: "a-strong-password" }),
    roles: z.enum(["admin", "user"]).default("user").openapi({ example: "user" }),
    age: z.number().int().positive().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
  })
  .openapi("CreateUser");

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    roles: z.enum(["admin", "user"]).optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    age: z.number().int().positive().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    // Only set if you want to reset the user's password.
    password: z.string().min(6).optional().openapi({ example: "a-new-password" }),
  })
  .openapi("UpdateUser");

export const IdParamSchema = z.object({
  id: z.string().uuid().openapi({
    param: { name: "id", in: "path" },
    example: "11111111-1111-1111-1111-111111111111",
  }),
});
