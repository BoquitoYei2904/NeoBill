import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { licitaciones } from '../data/licitaciones'

export default function LicitationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const licitation = licitaciones.find(
    (item) => item.id === id
  )

  if (!licitation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">
          Licitación no encontrada.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-medium text-slate-400 hover:text-slate-700">
        <ArrowLeft size={14} />
        Volver a licitaciones
      </button>

      <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        
        {/* Información básica */}
        <div className="">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {licitation.codigo}
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#17233b]">
            {licitation.cliente}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
            {licitation.descripcion}
            </p>
        </div>
        {/* fechas */}
        <div className="flex justify-end mt-5 grid gap-4 grid-cols-4">
          <Detail
            label="Fecha límite"
            value={licitation.fecha}
          />

          <Detail
            label="Fecha límite"
            value={licitation.fechaLimite}
          />

          <Detail
            label="Estado"
            value={licitation.status}
          />
        </div>
        {/* botones */}
        <div></div>
        {/* totales */}
        <div className="flex justify-end mt-5 grid gap-4 grid-cols-4">
          <Detail
            label="Presupuesto"
            value={formatCurrency(licitation.presupuesto)}
          />
        </div>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-[#17233b]">
        {value}
      </p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'PAB', // changed to balboas
    maximumFractionDigits: 0,
  }).format(value)
}