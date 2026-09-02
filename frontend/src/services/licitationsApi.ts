import { supabase } from "./supabaseClient";
import type {
  LicitationItem,
  LineItems,
  CreateLicitationPayload,
  UpdateLicitationPayload,
  CreateLineItemPayload,
  UpdateLineItemPayload,
  UpcomingExpirations,
} from "../type/licitations";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Generic request function with auth
async function request<T>(path: string, options?: RequestInit): Promise<T> {

  const isFormData = options?.body instanceof FormData;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not signed in");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${session.access_token}`,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    
    const error = new Error(
      body?.message ?? `Request failed: ${res.status}`
    );

    (error as Error & { status?: number }).status = res.status;

    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Transform numeric string fields to numbers
function transformLicitationResponse(data: any): LicitationItem {
  return {
    ...data,
    limitDate: data.limit_date,
    base: Number(data.base),
    discount: Number(data.discount),
    taxes: Number(data.taxes),
    total: Number(data.total),
  };
}
 
function transformLineItemResponse(data: any): LineItems {
  return {
    ...data,
    price: Number(data.price),
  };
}
function transformLineItemResponseView(data: any): any {
  return {
    ...data,
    price: Number(data.price),
    total: Number(data.price)*Number(data.quantity)
  };
}
 
function transformLineItemsResponse(data: any[]): LineItems[] {
  return data.map(transformLineItemResponse);
}
function transformLineItemsResponseView(data: any[]): any[] {
  return data.map(transformLineItemResponseView);
}

// ============ LICITATIONS ============
export const LicitationsApi = () => ({
  // List all licitations
  list: async () => {
    const data = await request<any[]>("/licitations");
    return data.map(transformLicitationResponse);
  },
  upcomingExpirations: async () => {
    const data = await request<UpcomingExpirations[]>("/licitations/upcoming-expirations");
    return data;
  },

  // Get summarized list
  listSummarized: async () => {
    return request<any[]>("/licitations/licitationsList");
  },

  // Get single licitation with items
  detail: async (id: number, type: string) => {
    const data = await request<any>(`/licitations/${id}`);
    if(type === "update"){
      return {
        ...transformLicitationResponse(data),
        lineItems: transformLineItemsResponse(data.lineItems || []),
      };
    }else {
      return {
        ...transformLicitationResponse(data),
        lineItems: transformLineItemsResponseView(data.lineItems || []),
      };
    } 
  },

  // Create new licitation
  create: (payload: CreateLicitationPayload) =>
    request<LicitationItem>("/licitations", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(transformLicitationResponse),

  // Update licitation with all line items at once (handles create/update/delete)
  updateFull: async (
    id: number,
    payload: UpdateLicitationPayload & { lineItems?: any[] }
  ) => {
    console.log("updateFull payload", payload)
    const data = await request<any>(`/licitations/${id}/update`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return {
      ...transformLicitationResponse(data),
      lineItems: transformLineItemsResponse(data.lineItems || []),
    };
  },

  // Delete licitation
  delete: (id: number) =>
    request<void>(`/licitations/${id}`, { method: "DELETE" }),

  // shift states
  updateState: async (id: number, type: string) => {
    const data = await request<any>(`/licitations/${id}/setChange`, {
      method: "PATCH",
      body: JSON.stringify({status: type}),
    });
    return data;
  },
});

// ============ LICITATION ITEMS ============
export const LicitationItemsApi = () => ({
  // Add line item to licitation
  create: (licitationId: number, payload: CreateLineItemPayload) =>
    request<LineItems>(`/licitations/${licitationId}/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(transformLineItemResponse),

  // Update line item
  update: (licitationId: number, itemId: number, payload: UpdateLineItemPayload) =>
    request<LineItems>(`/licitations/${licitationId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then(transformLineItemResponse),

  // Delete line item
  delete: (licitationId: number, itemId: number) =>
    request<void>(`/licitations/${licitationId}/items/${itemId}`, {
      method: "DELETE",
    }),
});


// ============ LICITATION FILES ============
export const LicitationFilesApi = () => ({
  uploadDocument: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    request<{ message: string; path: string; licitation: unknown }>(`/licitations/${id}/document`, {
      method: "POST",
      body: formData,
    })
  },
  getDocumentUrl: async (id: string) => {
  try {
    return await request<{ url: string; expiresIn: number }>(
      `/licitations/${id}/document`,
      {
        method: "GET",
        cache: "no-store",
      }
    );
  } catch (error) {
    const status = (error as Error & { status?: number }).status;

    if (status === 404) {
      return null;
    }

    throw error;
  }
},
})

// ============ HISTORY FILES ============
export const HistoryFilesApi = () => ({
  list: async (table: string, recordId: number) => {
    const data = await request<any[]>(`/history/logs?table=${table}&recordId=${recordId}`);
    return data;
  },
})