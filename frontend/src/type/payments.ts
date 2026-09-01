// TypeScript types for payments

export interface Payment {
  id: number
  amount: number // Will be converted from string
  payment_method: string
  date: string
  licitationId: number
  clientId: number
  notes?: string | null
  createdBy: string
  createdAt: string
}
export type createPayment = {
  amount: number,
  payment_method: string,
  date: string,
  notes?: string | null,
  licitationId: number
}

export interface PaymentSummary {
  id: number
  referencia: string
  cliente: string
  monto: number
  metodo: string
  fecha: string
  notas?: string
}

export interface CreatePaymentPayload {
  amount: number
  payment_method: string
  date: string
  licitationId: number
  clientId: number
  notes?: string | null
}

export interface UpdatePaymentPayload {
  amount?: number
  payment_method?: string
  date?: string
  licitationId?: number
  clientId?: number
  notes?: string | null
}

// Frontend form data
export interface PaymentFormData {
  id: number | ''
  amount: string
  payment_method: string
  date: string
  licitationId: string
  clientId: string
  notes: string
}