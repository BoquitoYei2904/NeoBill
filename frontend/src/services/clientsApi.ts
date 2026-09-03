import { supabase } from "./supabaseClient";
import type { ClientSchema } from "../type/clients";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";


async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
 
  if (!session) {
    throw new Error("Not signed in");
  }
 
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options?.headers ?? {}),
    },
  });
 
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ============ Clients ============
export function ClientsApi(){
    const clientsApi = {
    smallList: () => request<any[]>("/clients/clientList"),
    list: () => request<any[]>("/clients"),
    create: (user: Omit<ClientSchema, 'id'>) =>
        request<ClientSchema>("/clients", {
        method: "POST",
        body: JSON.stringify(user),
        }),
    update: (id: string, patch: Partial<ClientSchema>) =>
        request<ClientSchema>(`/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        }),
    delete: (id: string) => 
        request<void>(`/clients/${id}`, { method: "DELETE" }),
    };
    return clientsApi;
}