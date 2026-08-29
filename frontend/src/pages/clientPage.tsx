
import { ArrowLeft, Edit, Mail, Phone } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import type { ClientDetail as ClientDetailType } from '../type/clients'
import { clients } from '../data/clients'

export default function ClientDetail() {

    const navigate = useNavigate()
    const { id } = useParams()

    const client = clients.find(
        (item) => item.id === Number(id)
    )

    if (!client) {
        return (
        <div className="rounded-xl border border-slate-200 bg-white p-8">
            <p className="text-sm text-slate-500">
            Cliente no encontrado.
            </p>
        </div>
        )
    }

    const handleBack = () => {
        navigate('/Clients')
    }

    const handleEdit = () => {
        navigate(`/Clients/${client.id}/editar`)
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
                    {client.name}
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

        {/* General information */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Información general"
            description="Datos principales del cliente"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">
            <DetailField
                label="Nombre"
                value={client.name}
                fullWidth
            />

            <DetailField
                label="Empresa"
                value={client.company}
            />

            <DetailField
                label="Tipo"
                value={getClientTypeLabel(client.typeId)}
            />
            </div>
        </section>

        {/* Contact information */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Datos de contacto"
            description="Información para comunicarse con el cliente"
            />

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">
            <DetailField
                label="Email"
                value={client.email}
                icon={<Mail size={13} />}
            />

            <DetailField
                label="Teléfono"
                value={client.phone}
                icon={<Phone size={13} />}
            />
            </div>
        </section>

        {/* Notes */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Notas"
            description="Información adicional"
            />

            <div className="p-5">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <p className="whitespace-pre-wrap text-[10px] leading-5 text-slate-600">
                {client.notes || 'Sin notas'}
                </p>
            </div>
            </div>
        </section>

        {/* Status */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
            <SectionHeader
            title="Estado"
            description="Estado actual del cliente"
            />

            <div className="p-5">
            <StatusBadge status={client.status} />
            </div>
        </section>
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
  icon,
  fullWidth = false,
}: {
  label: string
  value: string | number | null
  icon?: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="flex min-h-[34px] items-center gap-2 border-b border-slate-100 pb-2">
        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}

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
  status: ClientDetailType['status']
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        px-2.5 py-1.5
        text-[8px] font-semibold
        ${
          status
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-red-500'
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 rounded-full
          ${status ? 'bg-emerald-500' : 'bg-red-400'}
        `}
      />

      {status ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function getClientTypeLabel(type: number) {
  const types: Record<number, string> = {
    1: 'Persona',
    2: 'Empresa',
  }

  return types[type] ?? `Tipo ${type}`
}
