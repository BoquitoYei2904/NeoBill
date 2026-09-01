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
    tags: string[],
    taxType: string; //name not id
    status: string; // 'Activo' or 'Inactivo'
}
export type ProductSchema = {
    id: number,
    description: string,
    code: string,
    price: number,
    cost: number,
    notes: string,
    tags: string[],
    taxId: number,
    status: boolean
}