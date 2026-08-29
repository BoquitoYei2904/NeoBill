
import { Eye, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { ProductList } from '../../type/products'

interface ProductsTableProps {
  products: ProductList[]
}

export default function ProductsTable({
  products,
}: ProductsTableProps) {
  const navigate = useNavigate()

  const handleNew = () => {
    navigate('/Products/nueva')
  }

  const handleDetail = (id: number) => {
    navigate(`/Products/${id}`)
  }

  return (
    <>
      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <div className="flex items-center justify-between border-b border-slate-100 p-3">
          <div />

          <button
            onClick={handleNew}
            className="
              flex items-center gap-1.5
              rounded-lg
              bg-[#0bc99b]
              px-3
              py-2
              text-[10px]
              font-semibold
              text-[#071b2f]
              transition
              hover:bg-[#0ab58c]
            "
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>
      </section>

      {/* Table */}
      <section className="my-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Código
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Producto
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Estado
                </th>

                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => handleDetail(product.id)}
                  className="
                    cursor-pointer
                    border-b border-slate-100
                    transition
                    hover:bg-slate-50
                    even:bg-slate-50/40
                  "
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[11px] font-semibold text-[#17233b]">
                      {product.code}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-[10px] text-slate-600">
                    {product.name}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={product.status} />
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDetail(product.id)
                      }}
                      className="
                        flex h-7 w-7
                        items-center justify-center
                        rounded-md
                        text-slate-400
                        transition
                        hover:bg-blue-50
                        hover:text-blue-500
                      "
                      title="Ver detalle"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[9px] text-slate-400">
            {products.length} Productos
          </span>

          <span className="text-[9px] text-slate-400">
            Mostrando todos
          </span>
        </div>
      </section>
    </>
  )
}

function StatusBadge({
  status,
}: {
  status: ProductList['status']
}) {
  return (
    <span
      className={`
        inline-flex rounded-full
        px-2 py-1
        text-[8px] font-semibold
        ${
          status
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-red-500'
        }
      `}
    >
      {status ? 'Activo' : 'Inactivo'}
    </span>
  )
}

