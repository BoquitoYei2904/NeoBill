export const LICITATION_STATUSES = [
  "borrador",
  "activa",
  "finalizada", // <-- confirm: does this map to "Adjudicada"?
  "por_cobrar",
  "cobrada",
  "perdida",
] as const;

export type LicitationStatus = (typeof LICITATION_STATUSES)[number];

export type LicitationStatusDisplay =
  | "Borrador"
  | "Activa"
  | "Adjudicada"
  | "Cancelada"
  | "Por cobrar"
  | "Cobrada";

// internal -> display
export const LICITATION_STATUS_DISPLAY: Record<LicitationStatus, LicitationStatusDisplay> = {
  borrador: "Borrador",
  activa: "Activa",
  finalizada: "Adjudicada",
  por_cobrar: "Por cobrar",
  cobrada: "Cobrada",
  perdida: "Cancelada",
};

export interface Licitation {
  id: number
  codigo: string
  cliente: string
  descripcion: string
  fecha: string
  fechaLimite: string
  presupuesto: number
  status: LicitationStatus
}

export type LicitationItem = {
  id: number
  reference: string
  date: string
  limitDate: string
  notes: string 
  clientId: number
  clientName: string
  status: LicitationStatus
  document: string
  isDocumentGenerated: boolean
  lineItems: LineItems[]
  base: number
  discount: number
  taxes: number
  total: number
}
export type LineItems = {
  id: number,
  productId:number,
  code: string,
  description: string,
  quantity: number,
  price: number,
  taxId: number,
  discountId: number
  total: number,
}

//first time insertion
export type LicitationSchema = {
  id: number,
  reference: string,
  date: string,
  limit_date: string,
  clientId: number,
  notes: string,
  document: string
}

export type LicitationLineSchema = {
  id: number,
  productId: number,
  quantity: number,
  description: string,
  price: number,
  taxId: number,
  discountId: number,
}


// Frontend form data (before conversion to API format)
export interface LicitationFormData {
  id: number
  reference: string
  date: string
  limit_date: string
  clientId: number
  notes?: string
  document?: string
  status: string
  base: number
  discount: number
  taxes: number
  total: number
}
 
// Payload for creating/updating licitation
export interface CreateLicitationPayload {
  reference: string
  date: string
  limit_date: string
  clientId: number
  notes?: string
  document?: string
}
 
export interface UpdateLicitationPayload {
  reference?: string
  date?: string
  limit_date?: string
  clientId?: number
  notes?: string
  document?: string
  status?: string
  isDocumentGenerated?: boolean
}
 
// Payload for creating line item
export interface CreateLineItemPayload {
  productId: number
  description: string
  quantity: number
  price?: number
  taxId: number
  discountId?: number
}
 
// Payload for updating line item
export interface UpdateLineItemPayload {
  description?: string
  quantity?: number
  price?: number
  taxId?: number
  discountId?: number
}
