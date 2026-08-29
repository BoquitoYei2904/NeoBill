import { Eye, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


import type { Licitation } from '../../type/licitations'

interface LicitationsTableProps {
  Licitations: Licitation[]
}

export default function LicitationsTable({
  Licitations,
}: LicitationsTableProps) {
  const navigate = useNavigate()

  const handleNew = () => {
    navigate('/Licitations/nueva')
  }

  const handleDetail = (id: string) => {
    navigate(`/Licitations/${id}`)
  }

  return (
    <>
    {/* Header */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">       
            <div className="flex items-center justify-between border-b border-slate-100 p-3">
                <div>
                </div>

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
                Nueva
                </button>
            </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)] my-2">
        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
            <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Licitación
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Detalle
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Fecha
                </th>

                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Fecha límite
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Presupuesto
                </th>

                

                <th className="w-12 px-4 py-3" />
                </tr>
            </thead>

            <tbody>
                {Licitations.map((licitacion) => (
                <tr
                    key={licitacion.id}
                    onClick={() => handleDetail(licitacion.id)}
                    className="
                    cursor-pointer
                    border-b border-slate-100
                    transition
                    hover:bg-slate-50
                    even:bg-slate-50/40
                    ">
                    <td className="px-5 py-3.5">
                    <div>
                        <p className="text-[11px] font-semibold text-[#17233b]">
                        {licitacion.cliente}
                        </p>

                        <p className="mt-0.5 text-[9px] text-slate-400">
                        {licitacion.codigo}
                        </p>
                    </div>
                    </td>

                    <td className="px-4 py-3.5 text-[10px] text-slate-600">
                    {licitacion.descripcion}
                    </td>

                    <td className="px-4 py-3.5">
                    <StatusBadge status={licitacion.status} />
                    </td>

                    <td className="px-4 py-3.5 text-[10px] text-slate-600">
                    {licitacion.fecha}
                    </td>

                    <td className="px-4 py-3.5 text-[10px] text-slate-600">
                    {licitacion.fechaLimite}
                    </td>

                    <td className="px-4 py-3.5 text-right text-[10px] font-medium text-slate-700">
                    {formatCurrency(licitacion.presupuesto)}
                    </td>

                    

                    <td className="px-4 py-3.5">
                    <button
                        onClick={(event) => {
                        event.stopPropagation()
                        handleDetail(licitacion.id)
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
            {Licitations.length} Licitaciones
            </span>

            <span className="text-[9px] text-slate-400">
            Mostrando todas
            </span>
        </div>
        </section>
    </>
    
  )
}

// to set the status badge color based on the status of the licitation
function StatusBadge({
  status,
}: {
  status: Licitation['status']
}) {
  const styles: Record<Licitation['status'], string> = {
    Borrador:
      'bg-slate-100 text-blue-500',
    Activa:
      'bg-emerald-50 text-emerald-600',
    Adjudicada:
      'bg-blue-50 text-yellow-600',
    Perdida:
      'bg-slate-100 text-red-500',
    'Por cobrar':
      'bg-amber-100 text-orange-600',
    Cobrada:
      'bg-green-100 text-grey-600',
  }

  return (
    <span
      className={`
        inline-flex rounded-full
        px-2 py-1
        text-[8px] font-semibold
        ${styles[status]}
      `}
    >
      {status}
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'PAB', // changed to balboas
    maximumFractionDigits: 0,
  }).format(value)
}