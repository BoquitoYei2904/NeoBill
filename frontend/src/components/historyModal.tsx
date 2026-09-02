import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HistoryFilesApi } from '../services/licitationsApi'
import { toDateInputValue } from './globalComponents'

interface HistoryModalProps {
  open: boolean
  table: string
  recordId: number
  onClose: () => void
}

export default function HistoryModal({
  open,
  table,
  recordId,
  onClose,
}: HistoryModalProps) {

    const [loading, setLoading] = useState(true)
    const [record, setRecord] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
          const data = await HistoryFilesApi().list(table, Number(recordId));
          if(data){
            setRecord(data)
          } else {
            setRecord(null);
          }
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

    if (!open) return null
    if(!recordId) return null

    if (loading) {
        return <div className="p-4">Cargando...</div>
    }
    if (error) {
        return (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <p className="text-[10px] text-red-500">{error}</p>
        </div>
        )
    }

    return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Search
                size={16}
                className="text-blue-500"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#17233b]">
                Historial de la licitación
              </h2>
            </div>

          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400
              transition hover:bg-slate-100 hover:text-slate-600">
            <X size={15} />
          </button>
        </div>

        {/* Table */}
        <section className="overflow-hidden border border-slate-200 rounded-xl shadow-[0_2px_12px_rgba(20,40,60,0.05)] m-2">
        <div className="overflow-y-auto max-h-[400px]">
            <div className="rounded-lg overflow-hidden">
            {/* Headers */}
            <div className="grid grid-cols-[100px_1fr_120px] gap-0 bg-slate-50/70 border-b border-slate-100">
                <div className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Cambio
                </div>
                <div className="px-8 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Usuario
                </div>
                <div className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Fecha
                </div>
            </div>
            {/* Rows */}
            {record.map((item:any) => (
                <div
                key={item.id}
                className="grid grid-cols-[100px_1fr_120px] gap-0 border-b border-slate-100 hover:bg-slate-50">
                    <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                        {item.previous}
                    </div>
                    <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                        {item.modifiedBy}
                    </div>
                    <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                        {toDateInputValue(item.modifiedAt)}
                    </div>
                </div>
            ))}
            </div>
        </div>
        </section>

      </div>
    </div>
  )
}