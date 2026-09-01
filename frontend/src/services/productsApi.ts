import { supabase } from "./supabaseClient";
import type { ProductSchema, ProductList } from "../type/products";

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

function transformResponse(data: any[]): ProductList[] {
  return data.map(item => ({
    id: item.id,
    name: item.description,
    code: item.code,
    status: item.status ? "Activo" : "Inactivo",
  }))
}
// ============ products ============
export function ProductsApi(){
    const productsApi = {
    smallList: async () => {
        const data = await request<any[]>("/products")
        return transformResponse(data)
    },
    list: () => request<any[]>("/products"),
    create: (user: Omit<ProductSchema, 'id'>) =>
        request<ProductSchema>("/products", {
        method: "POST",
        body: JSON.stringify(user),
        }),
    update: (id: string, patch: Partial<ProductSchema>) =>
        request<ProductSchema>(`/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        }),
    delete: (id: string) => 
        request<void>(`/products/${id}`, { method: "DELETE" }),
    };
    return productsApi;
}