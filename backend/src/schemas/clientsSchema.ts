import { z } from "@hono/zod-openapi";

export const ClientSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    typeId: z.number().openapi({ example: 2 }),
    name: z.string().openapi({ example: "Jane Cooper" }),
    identifier: z.string().openapi({ example: "RUC-0001234567" }),
    company: z.string().nullable().openapi({ example: "Acme Inc." }),
    phone: z.string().nullable().openapi({ example: "+1 555 0100" }),
    email: z.string().nullable().openapi({ example: "jane@acme.com" }),
    notes: z.string().nullable().openapi({ example: "Met at conference" }),
    status: z.boolean().openapi({ example: true }),
    createdBy: z.string().openapi({ example: "11111111-1111-1111-1111-111111111111" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Client");

export const CreateClientSchema = z
  .object({
    typeId: z.number().int().positive().openapi({ example: 2 }),
    name: z.string().min(1).openapi({ example: "Jane Cooper" }),
    identifier: z.string().min(1).openapi({ example: "RUC-0001234567" }),
    company: z.string().optional().openapi({ example: "Acme Inc." }),
    phone: z.string().optional().openapi({ example: "+1 555 0100" }),
    email: z.string().email().optional().openapi({ example: "jane@acme.com" }),
    notes: z.string().optional().openapi({ example: "Met at conference" }),
  })
  .openapi("CreateClient");

export const UpdateClientSchema = CreateClientSchema.partial()
  .extend({ status: z.boolean().optional().openapi({ example: false }) })
  .openapi("UpdateClient");

export const IdParamSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});
