import { z } from "@hono/zod-openapi";


const ClientSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Jane Cooper" }),
    email: z.string().nullable().openapi({ example: "jane@acme.com" }),
    phone: z.string().nullable().openapi({ example: "+1 555 0100" }),
    company: z.string().nullable().openapi({ example: "Acme Inc." }),
    notes: z.string().nullable().openapi({ example: "Met at conference" }),
    createdAt: z.string().openapi({ example: "2026-08-25T10:00:00.000Z" }),
  })
  .openapi("Client");

const CreateClientSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Jane Cooper" }),
    email: z.string().email().optional().openapi({ example: "jane@acme.com" }),
    phone: z.string().optional().openapi({ example: "+1 555 0100" }),
    company: z.string().optional().openapi({ example: "Acme Inc." }),
    notes: z.string().optional().openapi({ example: "Met at conference" }),
  })
  .openapi("CreateClient");

const UpdateClientSchema = CreateClientSchema.partial().openapi("UpdateClient");

const IdParamSchema = z.object({
  id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});

export { ClientSchema, CreateClientSchema, UpdateClientSchema, IdParamSchema };