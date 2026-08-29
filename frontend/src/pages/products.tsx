
import ProductsTable from "../components/products/productsTable";
import { products } from "../data/product";

export default function Products() {
  return (
    <ProductsTable
      products={products}
    />
  )
}