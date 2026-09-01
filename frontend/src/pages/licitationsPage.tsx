import { ArrowLeft, SquarePen, FileText, Check, ArrowRight, CircleX} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { LicitationItem } from '../type/licitations'
import { LICITATION_STATUS_DISPLAY } from '../type/licitations'
import { LicitationsApi, LicitationFilesApi } from '../services/licitationsApi'
import { ClientsApi } from '../services/clientsApi'
import { formatCurrency,toDateInputValue } from '../components/globalComponents'
import UploadModal from '../components/Licitations/uploadModal'
import ErrorModal from '../components/errorModal'

export default function LicitationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [record, setRecord] = useState<LicitationItem>()
  const [document, setDocument] = useState<any>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // document modal
  const [documentOpen, setDocumentOpen] = useState(false)


  if(!id) return null

  // Fetch data on mount and when type changes
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await LicitationsApi().detail(Number(id), "view");
      const fileUrl = await LicitationFilesApi().getDocumentUrl(String(id))
      const ClientName = (await ClientsApi().smallList()).find((item)=> item.id == data.clientId);
      if(fileUrl){
        setDocument(fileUrl)
      } else {
        setDocument(null);
      }
      setRecord({
        ...data,
        clientName: ClientName.name,
      })
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


  const handleUpdate = (id: number) => {
    navigate(`/Licitations/update/${id}`)
  }
  const handleUpload = async (file: File) => {
    try {
      await LicitationFilesApi().uploadDocument(
        String(record?.id),
        file
      );

      await fetchData();
      setDocumentOpen(false)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al subir el documento";

      setError(message);
    }
  };
  const handleShift = async (typeTo:string) =>{
    try {
      await LicitationsApi().updateState(
        Number(id),
        String(typeTo)
      );

      navigate(-1)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cambiar el documento";

      setError(message);
    }
  }
 

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

  if (!record) {
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
      <div className="grid grid-cols-3 place-content-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-medium col-span-2 text-slate-400 hover:text-slate-700">
          <ArrowLeft size={14} />
          Volver a licitaciones
        </button>
        <div className='flex flex-row-reverse gap-2 '>
          {record.status == "borrador" || record.status == "activa" ?
          <>
          <button
            onClick={() => setDocumentOpen(true)}
            className="flex items-center gap-2 text-[12px] p-1 rounded-md border border-slate-400 font-medium text-slate-400 hover:text-slate-700 hover:border-slate-700"
            >
            <FileText size={13} />
            Agregar Archivo
          </button>
          <button
            onClick={() => handleUpdate(record.id)}
            className="flex items-center gap-2 text-[12px] p-1 rounded-md border border-sky-500 font-medium text-sky-500 hover:text-sky-700 hover:bg-sky-200 hover:border-sky-700 transition">
            <SquarePen size={13} />
            editar
          </button>
          {record.status == "activa" ?
            <>
            <button
              onClick={() => handleShift("perdida")}
              className="flex items-center gap-2 text-[12px] p-1 rounded-md border border-orange-500 font-medium text-orange-500 hover:text-orange-700 hover:bg-orange-200 hover:border-orange-700 transition"
              >
              <CircleX size={13} />
              Cancelar
            </button>
            <button
              onClick={() => handleShift("finalizada")}
              className="flex items-center gap-2 text-[12px] p-1 rounded-md border border-emerald-500 font-medium text-emerald-500 hover:text-emerald-700 hover:bg-emerald-200 hover:border-emerald-700 transition"
              >
              <Check size={13} />
              Aprobar
            </button>
            </>
          :<></>} 
          </>
          : <></>}
          {record.status == "finalizada" ?
          <button
            onClick={() => handleShift("por_cobrar")}
            className="flex items-center gap-2 text-[12px] p-1 rounded-md border border-sky-500 font-medium text-sky-500 hover:text-sky-700 hover:bg-sky-200 hover:border-sky-700 transition"
            >
            <ArrowRight size={13} />
            Facturar
          </button>
          : <></>}
        </div>
      </div>
      

      {/* informacion */}
      <section className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        
        {/* Información básica */}
        <div className="">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {record.reference}
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#17233b]">
            {record.clientName}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
            {record.notes}
            </p>
        </div>
        {/* fechas */}
        <div className="flex justify-end mt-5 grid gap-4 grid-cols-3">
          <Detail
            label="Fecha"
            value={toDateInputValue(record.date)}
          />

          <Detail
            label="Fecha límite"
            value={toDateInputValue(record.limitDate)}
          />

          <Detail
            label="Estado"
            value={LICITATION_STATUS_DISPLAY[record.status]}
          />
        </div>
        {/* botones */}
        <div></div>
        
      </section>
      {/* Table */}
      <section className="overflow-hidden border border-slate-200 rounded-xl shadow-[0_2px_12px_rgba(20,40,60,0.05)] my-2">
        <div className="overflow-y-auto">
          <div className="rounded-lg overflow-hidden">
            {/* Headers */}
            <div className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_120px] gap-0 bg-slate-50/70 border-b border-slate-100">
              <div className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Codigo
              </div>
              <div className="px-8 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Detalle
              </div>
              <div className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Impuesto
              </div>
              <div className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Descuento
              </div>
              <div className="px-3 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Cantidad
              </div>
              <div className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Precio
              </div>
              <div className="px-6 py-3 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Total
              </div>
            </div>
            {/* Rows */}
            {record.lineItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_120px] gap-0 border-b border-slate-100 hover:bg-slate-50">
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {item.code}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {item.description}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {item.taxId}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {!item.discountId ? "Sin descuento": item.discountId}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {item.quantity}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {formatCurrency(item.price)}
                </div>
                <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Totals Section */}
      <section className="overflow-hidden rounded-xl shadow-[0_2px_12px_rgba(20,40,60,0.05)] my-2">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 overflow-hidden sticky top-0">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                Resumen
              </h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Subtotal</span>
                <span className="text-[11px] font-medium text-slate-900">
                  {formatCurrency(record.base)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Descuento</span>
                <span className="text-[11px] font-medium text-red-600">
                  {formatCurrency(record.discount)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Impuesto</span>
                <span className="text-[11px] font-medium text-slate-900">
                  {formatCurrency(record.taxes)}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 pt-4" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-900">Total</span>
                <span className="text-[14px] font-bold text-[#0bc99b]">
                  {formatCurrency(record.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit modal */}
      <UploadModal
        open={documentOpen}
        documentUrl={document}
        onClose={() => setDocumentOpen(false)}
        onSuccess={(file) => handleUpload(file)}
      />
      {/* error modal */}
      <ErrorModal
        open={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
      />
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

