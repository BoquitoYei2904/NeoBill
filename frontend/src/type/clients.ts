//Models for the frontend application
export type ClientList = {
  id: number;
  name: string;
  email: string | null;
  type: string; //name not id
  status: string; // 'Activo' or 'Inactivo'
};

export type ClientDetail = {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  typeId: number; //id not name
  type: string; //name not id
  status: string; // 'Activo' or 'Inactivo'
}

export type NewClient = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
};