import { z } from "@hono/zod-openapi";

export const ProductSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    description: z.string().openapi({ example: "Wireless mouse" }),
    code: z.string().openapi({ example: "SKU-1001" }),
    price: z.string().openapi({ example: "19.99" }), // numeric columns come back as strings
    cost: z.string().openapi({ example: "9.50" }),
    notes: z.string().nullable().openapi({ example: "Bulk discount available" }),
    tags: z.array(z.string()).openapi({ example: ["electronics", "accessory"] }),
    taxId: z.number().openapi({ example: 1 }),
    status: z.boolean().openapi({ example: true }),
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Product");

export const CreateProductSchema = z
  .object({
    description: z.string().min(1).openapi({ example: "Wireless mouse" }),
    code: z.string().min(1).openapi({ example: "SKU-1001" }),
    price: z.coerce.number().nonnegative().openapi({ example: 19.99 }),
    cost: z.coerce.number().nonnegative().openapi({ example: 9.5 }),
    notes: z.string().optional().openapi({ example: "Bulk discount available" }),
    tags: z.array(z.string()).optional().openapi({ example: ["electronics", "accessory"] }),
    taxId: z.number().int().positive().openapi({ example: 1 }),
  })
  .openapi("CreateProduct");

export const UpdateProductSchema = CreateProductSchema.partial()
  .extend({ status: z.boolean().optional().openapi({ example: false }) })
  .openapi("UpdateProduct");

export const IdParamSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});
