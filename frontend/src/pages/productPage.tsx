import { useState, useEffect } from 'react'
import { ArrowLeft, Edit } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import type { ProductDetail } from '../type/products'
import { ProductsApi } from '../services/productsApi'
import { getConfigApi } from '../services/configsApi'
import ProductModal from '../components/products/ProductsModal'




export default function ProductDetail() {

    const navigate = useNavigate()
    const { id } = useParams()

    const [info, setInfo] = useState<ProductDetail>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    //edit modal
    const [editOpen, setEditOpen] = useState(false)

    // Fetch data on mount and when type changes
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await (await ProductsApi().list()).find((item)=> item.id == id);
        const taxData = (await getConfigApi('taxTypes').list()).filter((item)=> item.status == true)
        .find((item) => item.id === data.taxId);
        const filtered:ProductDetail = {
          id: data.id,
          name: data.description,
          code: data.code,
          price: data.price,
          cost: data.cost,
          notes: data.notes,
          taxType: taxData.name,
          tags: data.tags,
          status: data.status ? "Activo" : "Inactivo",
        };

        setInfo(filtered)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchData()
    }, [])


    const handleBack = () => {
        navigate('/Products')
    }

    const handleEdit = () => {
      setEditOpen(true)
    }
    const handleSave = async () => {
      await fetchData()
    }

    if (loading) {
      return <div className="p-4">Cargando...</div>
    }
    if (!info) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <p className="text-sm text-slate-500">
            Producto no encontrado.
          </p>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
                <button
                onClick={handleBack}
                className="
                    flex h-8 w-8 items-center justify-center
                    rounded-lg
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-600
                "
                title="Volver"
                >
                <ArrowLeft size={15} />
                </button>

                <div>
                <h1 className="text-sm font-semibold text-[#17233b]">
                    {info.name}
                </h1>

                <p className="mt-0.5 text-[9px] text-slate-400">
                    Información del producto
                </p>
                </div>
            </div>

            <button
                onClick={handleEdit}
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
                <Edit size={13} />
                Editar
            </button>
            </div>
        </section>

        {/* General information */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Información general"
            description="Datos principales del producto"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">
            <DetailField
                label="Nombre"
                value={info.name}
            />

            <DetailField
                label="Código"
                value={info.code}
            />

            <DetailField
                label="Tipo de impuesto"
                value={info.taxType}
            />

            <DetailField
                label="Estado"
                value={info.status ? 'Activo' : 'Inactivo'}
            />
            </div>
        </section>

        {/* Pricing */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Precios"
            description="Información de precio y costo"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">
            <CurrencyField
                label="Precio"
                value={info.price}
            />

            <CurrencyField
                label="Costo"
                value={info.cost}
            />
            </div>
        </section>
        {/* Tags */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
          <SectionHeader
            title="Etiquetas"
            description="Etiquetas asociadas al producto"
          />

          <div className="p-5">
            {info.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {info.tags.map((tag) => (
                  <span
                    key={tag}
                    className="
                      inline-flex items-center
                      rounded-full
                      bg-slate-100
                      px-2.5 py-1.5
                      text-[9px]
                      font-medium
                      text-slate-600
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">
                Sin etiquetas
              </p>
            )}
          </div>
        </section>

        {/* Notes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Notas"
            description="Información adicional del producto"
            />

            <div className="p-5">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <p className="whitespace-pre-wrap text-[10px] leading-5 text-slate-600">
                {info.notes || 'Sin notas'}
                </p>
            </div>
            </div>
        </section>

        {/* Status */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Estado"
            description="Estado actual del producto"
            />

            <div className="p-5">
            <StatusBadge status={info.status} />
            </div>
        </section>

        <ProductModal
          open={editOpen}
          id={info.id}
          onClose={() => setEditOpen(false)}
          onSuccess={handleSave}
        />
      </div>
    )
    
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-3">
      <h2 className="text-[11px] font-semibold text-[#17233b]">
        {title}
      </h2>

      <p className="mt-0.5 text-[9px] text-slate-400">
        {description}
      </p>
    </div>
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: string | number | null
}) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex min-h-[34px] items-center border-b border-slate-100 pb-2">
        <p className="text-[11px] font-medium text-slate-700">
          {value ?? '—'}
        </p>
      </div>
    </div>
  )
}

function CurrencyField({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex min-h-[34px] items-center border-b border-slate-100 pb-2">
        <p className="text-[13px] font-semibold text-[#17233b]">
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: ProductDetail['status']
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        px-2.5 py-1.5
        text-[8px] font-semibold
        ${
          status === "Activo"
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-red-500'
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 rounded-full
          ${status === "Activo" ? 'bg-emerald-500' : 'bg-red-400'}
        `}
      />

      {status}
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'PAB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
