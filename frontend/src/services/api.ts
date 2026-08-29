import { supabase } from "./supabaseClient";
import { type Client, type NewClient } from "../type/clients";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";



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

export const api = {
  list: () => request<Client[]>("/clients"),
  create: (client: NewClient) =>
    request<Client>("/clients", { method: "POST", body: JSON.stringify(client) }),
  update: (id: number, patch: Partial<NewClient>) =>
    request<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: number) => request<void>(`/clients/${id}`, { method: "DELETE" }),
};
