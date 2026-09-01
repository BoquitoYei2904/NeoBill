import { supabase } from "./supabaseClient";
import type {
  Payment,
  PaymentSummary,
  CreatePaymentPayload,
  UpdatePaymentPayload,
} from "../type/payments";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Generic request function with auth
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not signed in");
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    ...options,
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Transform numeric string fields to numbers
function transformPaymentResponse(data: any): Payment {
  return {
    ...data,
    amount: Number(data.amount),
  };
}

function transformPaymentListResponse(data: any[]): Payment[] {
  return data.map(transformPaymentResponse);
}

function transformSummaryResponse(data: any): PaymentSummary {
  return {
    ...data,
    monto: Number(data.monto),
  };
}

function transformSummaryListResponse(data: any[]): PaymentSummary[] {
  return data.map(transformSummaryResponse);
}

// ============ PAYMENTS ============
export const PaymentsApi = () => ({
  // List all payments
  list: async () => {
    const data = await request<any[]>("/payments");
    return transformPaymentListResponse(data);
  },

  // Get summarized list with client and licitation info
  listSummary: async () => {
    const data = await request<any[]>("/payments/summary");
    return transformSummaryListResponse(data);
  },

  // Get single payment
  get: async (id: number) => {
    const data = await request<any>(`/payments/${id}`);
    return transformPaymentResponse(data);
  },

  // Create new payment
  create: (payload: CreatePaymentPayload) =>
    request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        date: new Date(payload.date).toISOString(),
      }),
    }).then(transformPaymentResponse),

  // Update payment
  update: (id: number, payload: UpdatePaymentPayload) =>
    request<Payment>(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...payload,
        ...(payload.date && { date: new Date(payload.date).toISOString() }),
      }),
    }).then(transformPaymentResponse),

  // Delete payment
  delete: (id: number) =>
    request<void>(`/payments/${id}`, { method: "DELETE" }),
});