//Models for the frontend application
export type ClientList = {
  id: number;
  name: string;
  email: string | null;
  type: string; //name not id
  status: boolean; // 'Activo' or 'Inactivo'
};

export type ClientDetail = { //for clientPage
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

export type ClientSchema = //for inserts into the API
  {
    id: number,
    typeId: number,
    name: string,
    identifier: string,
    company: string,
    phone: string,
    email: string,
    notes: string,
    status: boolean
}