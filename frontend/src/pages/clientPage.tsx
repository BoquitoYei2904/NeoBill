import { useEffect, useState } from 'react'
import { ArrowLeft, Edit } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import type { ClientDetail } from '../type/clients'
import { ClientsApi } from '../services/clientsApi'
import { getConfigApi } from '../services/configsApi'
import ClientModal from '../components/clients/ClientsModal'

export default function ClientDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [info, setInfo] = useState<ClientDetail>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await (await ClientsApi().list()).find(
        (item) => item.id == id
      )

      if (!data) {
        setInfo(undefined)
        return
      }

      const clientTypes = await getConfigApi('clientTypes').list()

      const typeData = clientTypes
        .filter((item) => item.status === true)
        .find((item) => item.id === data.typeId)

      const filtered: ClientDetail = {
        id: data.id,
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        typeId: data.typeId,
        type: typeData?.name ?? '—',
        status: data.status ? 'Activo' : 'Inactivo',
      }

      setInfo(filtered)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load data'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleBack = () => {
    navigate('/Clients')
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

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-white p-8">
        <p className="text-sm text-red-500">
          {error}
        </p>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">
          Cliente no encontrado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">

      {/* Header */}
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
                Información del cliente
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

      {/* Información general */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <SectionHeader
          title="Información general"
          description="Datos principales del cliente"
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">

          <DetailField
            label="Nombre"
            value={info.name}
          />

          <DetailField
            label="Empresa"
            value={info.company}
          />

          <DetailField
            label="Tipo"
            value={info.type}
          />

          <DetailField
            label="Estado"
            value={info.status}
          />

        </div>
      </section>

      {/* Contacto */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <SectionHeader
          title="Información de contacto"
          description="Datos de contacto del cliente"
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">

          <DetailField
            label="Correo electrónico"
            value={info.email}
          />

          <DetailField
            label="Teléfono"
            value={info.phone}
          />

        </div>
      </section>

      {/* Notas */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <SectionHeader
          title="Notas"
          description="Información adicional del cliente"
        />

        <div className="p-5">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
            <p className="whitespace-pre-wrap text-[10px] leading-5 text-slate-600">
              {info.notes || 'Sin notas'}
            </p>
          </div>
        </div>
      </section>

      {/* Estado */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <SectionHeader
          title="Estado"
          description="Estado actual del cliente"
        />

        <div className="p-5">
          <StatusBadge status={info.status} />
        </div>
      </section>

      {/* Edit modal */}
      <ClientModal
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

function StatusBadge({
  status,
}: {
  status: ClientDetail['status']
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        px-2.5 py-1.5
        text-[8px] font-semibold
        ${
          status === 'Activo'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-red-500'
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 rounded-full
          ${
            status === 'Activo'
              ? 'bg-emerald-500'
              : 'bg-red-400'
          }
        `}
      />

      {status}
    </span>
  )
}