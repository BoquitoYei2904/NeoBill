import { supabase } from "./supabaseClient";
import type { ConfigurationItem, DiscountOption, TaxOption, UserConfigInfo } from "../type/Configurations";

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

function transformResponse(data: any[]): TaxOption[] {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    value: Number(item.percentage) || 0,
    status: item.status,
  }))
}
 
// ============ USERS ============
export const usersApi = {
  list: () => request<any[]>("/users"),
  create: (user: Omit<UserConfigInfo, 'id' | 'status'>) =>
    request<UserConfigInfo>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  update: (id: string, patch: Partial<UserConfigInfo>) =>
    request<UserConfigInfo>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  delete: (id: string) => 
    request<void>(`/users/${id}`, { method: "DELETE" }),
};
 


// ============ TAX TYPES ============
export const taxTypesApi = {
  list: async () => {
    const data = await request<any[]>("/configs/taxes")
    return transformResponse(data)
  },
  create: (tax: Omit<TaxOption, 'id'>) =>
    request<TaxOption>("/configs/taxes", {
      method: "POST",
      body: JSON.stringify(tax),
    }),
  update: (id: string, patch: Partial<TaxOption>) =>
    request<TaxOption>(`/configs/taxes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  delete: (id: string) => 
    request<void>(`/configs/taxes/${id}`, { method: "DELETE" }),
};
 
// ============ DISCOUNT OPTIONS ============
export const discountOptionsApi = {
  list: async () => {
    const data = await request<any[]>("/configs/discounts")
    return transformResponse(data)
  },
  create: (discount: Omit<DiscountOption, 'id'>) =>
    request<DiscountOption>("/configs/discounts", {
      method: "POST",
      body: JSON.stringify(discount),
    }),
  update: (id: string, patch: Partial<DiscountOption>) =>
    request<DiscountOption>(`/configs/discounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  delete: (id: string) => 
    request<void>(`/configs/discounts/${id}`, { method: "DELETE" }),
};
 
// ============ CLIENT TYPES ============
export const clientTypesApi = {
  list: () => request<any[]>("/configs/client-types"),
  create: (clientType: Omit<ConfigurationItem, 'id'>) =>
    request<ConfigurationItem>("/configs/client-types", {
      method: "POST",
      body: JSON.stringify(clientType),
    }),
  update: (id: string, patch: Partial<ConfigurationItem>) =>
    request<ConfigurationItem>(`/configs/client-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  delete: (id: string) => 
    request<void>(`/configs/client-types/${id}`, { method: "DELETE" }),
};
 
// ============ router ============
export function getConfigApi(type: 'users' | 'taxTypes' | 'discountOptions' | 'clientTypes') {
  switch (type) {
    case 'users':
      return usersApi;
    case 'taxTypes':
      return taxTypesApi;
    case 'discountOptions':
      return discountOptionsApi;
    case 'clientTypes':
      return clientTypesApi;
  }
}
