//Models for the frontend application

export type Client = {
  id: number;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
};

export type NewClient = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
};