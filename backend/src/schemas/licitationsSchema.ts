import { z } from "@hono/zod-openapi";

export const LICITATION_STATUSES = [
  "borrador",
  "activa",
  "finalizada",
  "por_cobrar",
  "cobrada",
  "perdida",
] as const;

export const LicitationSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    date: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
    limit_date: z.string().openapi({ example: "2026-09-10T23:59:59.000Z" }),
    base: z.string().openapi({ example: "1000.00" }),
    discount: z.string().openapi({ example: "50.00" }),
    taxes: z.string().openapi({ example: "114.00" }),
    total: z.string().openapi({ example: "1064.00" }),
    status: z.enum(LICITATION_STATUSES).openapi({ example: "borrador" }),
    document: z.string().nullable().openapi({ example: "https://.../bid.pdf" }),
    isDocumentGenerated: z.boolean().openapi({ example: false }),
    notes: z.string().nullable().openapi({ example: "Follow up next week" }),
    clientId: z.number().openapi({ example: 3 }),
    reference: z.string().openapi({ example: "LIC-2023-001" }),
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Licitation");

export const CreateLicitationSchema = z
  .object({
    reference: z.string().openapi({ example: "LIC-2023-001" }),
    date: z.string().datetime().openapi({ example: "2026-08-25T10:00:00.000Z" }),
    limit_date: z.string().datetime().openapi({ example: "2026-09-10T23:59:59.000Z" }),
    clientId: z.number().int().positive().openapi({ example: 3 }),
    notes: z.string().optional().openapi({ example: "Follow up next week" }),
    document: z.string().optional().openapi({ example: "https://.../bid.pdf" }),
  })
  .openapi("CreateLicitation");

export const UpdateLicitationSchema = z
  .object({
    date: z.string().datetime().optional(),
    limit_date: z.string().datetime().optional(),
    clientId: z.number().int().positive().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi("UpdateLicitation");

export const LicitationItemSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    licitationId: z.number().openapi({ example: 1 }),
    productId: z.number().openapi({ example: 5 }),
    description: z.string().openapi({ example: "2" }),
    quantity: z.number().openapi({ example: 2 }),
    price: z.string().openapi({ example: "19.99" }),
    taxId: z.number().openapi({ example: 1 }),
    discountId: z.number().int().nonnegative().nullable().optional(),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("LicitationItem");

export const CreateLicitationItemSchema = z
  .object({
    productId: z.number().int().positive().openapi({ example: 5 }),
    quantity: z.number().int().positive().default(1).openapi({ example: 2 }),
    description: z.string().openapi({ example: "2" }),
    price: z.string().openapi({ example: "19.99" }),
    taxId: z.number().int().positive().openapi({ example: 1 }),
    discountId: z.number().int().nonnegative().nullable().optional(),
  })
  .openapi("CreateLicitationItem");

export const UpdateLicitationItemSchema = z
  .object({
    quantity: z.number().int().positive().optional().openapi({ example: 3 }),
    description: z.string().openapi({ example: "2" }),
    price: z.string().openapi({ example: "19.99" }),
    taxId: z.number().int().positive().optional(),
    discountId: z.number().int().nonnegative().nullable().optional(),
  })
  .openapi("UpdateLicitationItem");

export const IdParamSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});

export const LicitationItemParamsSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
  itemId: z.coerce.number().openapi({ param: { name: "itemId", in: "path" }, example: 1 }),
});


// Line item for bulk update (can have negative ID for new items)
export const BulkLineItemSchema = z.object({
  id: z.number().int(), // Can be negative (new) or positive (existing)
  productId: z.number().int().positive(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  taxId: z.number().int().positive(),
  discountId: z.number().int().nonnegative().nullable().optional(),
});
 
export const UpdateLicitationWithItemsSchema = UpdateLicitationSchema.extend({
  lineItems: z.array(BulkLineItemSchema).optional(),
});

export const LicitationStateSchema = z.object({
  status: z.enum(LICITATION_STATUSES).openapi({ example: "borrador" }),
})

export const UpcomingExpirationsSchema = z.array(
  z.object({
    id: z.number(),
    clientName: z.string(),
    amount: z.number(),
    limitDate: z.string(),
  })
);