import { z } from "@hono/zod-openapi";

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Payment schemas
export const PaymentSchema = z.object({
  id: z.number().int(),
  amount: z.string(), // numeric from DB comes as string
  payment_method: z.string(),
  date: z.string().datetime(),
  licitationId: z.number().int(),
  clientId: z.number().int(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const CreatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: z.string().min(1, "Payment method is required"),
  date: z.string().datetime().or(z.string()), // Accept ISO string or date
  licitationId: z.number().int().positive("Licitation ID is required"),
  clientId: z.number().int().positive("Client ID is required"),
  notes: z.string().optional().nullable(),
});

export const UpdatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  payment_method: z.string().min(1).optional(),
  date: z.string().datetime().or(z.string()).optional(),
  licitationId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
});

export const PaymentListItemSchema = z.object({
  id: z.number().int(),
  referencia: z.string(), // licitation reference
  cliente: z.string(), // client name
  monto: z.string(),
  metodo: z.string(),
  fecha: z.string().datetime(),
  notas: z.string().optional(),
});