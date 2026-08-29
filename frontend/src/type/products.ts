//Models for the frontend application
export type ProductList = {
    id: number;
    name: string;
    code: string;
    status: string; // 'Activo' or 'Inactivo'
};

export type ProductDetail = {
    id: number;
    name: string;
    code: string;
    price: number;
    cost: number;
    notes: string | null;
    taxType: string; //name not id
    status: string; // 'Activo' or 'Inactivo'
}