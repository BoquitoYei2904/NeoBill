import { z } from "@hono/zod-openapi";

export const TaxSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "IVA" }),
    status: z.boolean().openapi({ example: true }),    
    percentage: z.string().openapi({ example: "12.00" }), // numeric columns come back as strings
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Tax");

export const CreateTaxSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "IVA" }),
    status: z.boolean().openapi({ example: true }),
    percentage: z.coerce
      .number()
      .min(0)
      .max(100)
      .openapi({ example: 12, description: "Plain number, e.g. 12 for 12%" }),
  })
  .openapi("CreateTax");

export const UpdateTaxSchema = CreateTaxSchema.partial().openapi("UpdateTax");

export const DiscountSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Loyalty discount" }),
    status: z.boolean().openapi({ example: true }),
    percentage: z.string().openapi({ example: "5.00" }),
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Discount");

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Loyalty discount" }),
    status: z.boolean().openapi({ example: true }),
    percentage: z.coerce
      .number()
      .min(0)
      .max(100)
      .openapi({ example: 5, description: "Plain number, e.g. 5 for 5%" }),
  })
  .openapi("CreateDiscount");

export const UpdateDiscountSchema = CreateDiscountSchema.partial().openapi("UpdateDiscount");

export const ClientTypeSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Government" }),
    status: z.boolean().openapi({ example: true }),
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("ClientType");

export const CreateClientTypeSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Government" }),
    status: z.boolean().openapi({ example: true }),
  })
  .openapi("CreateClientType");

export const UpdateClientTypeSchema = CreateClientTypeSchema.partial().openapi(
  "UpdateClientType"
);

export const IdParamSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});
