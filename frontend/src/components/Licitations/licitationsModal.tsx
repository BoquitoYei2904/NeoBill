import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { LicitationSchema } from '../../type/licitations'
import type { ClientList } from '../../type/clients'

import { ClientsApi } from '../../services/clientsApi'
import { LicitationsApi } from '../../services/licitationsApi'

import { FormField, inputClass } from '../globalComponents'

interface LicitationModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (id: number) => void
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const today = new Date()

const nextMonth = new Date(today)
nextMonth.setMonth(nextMonth.getMonth() + 1)

const emptyClient: Omit<LicitationSchema, 'id'> = {
  reference: "",
  date: formatDateForInput(today),
  limit_date: formatDateForInput(nextMonth),
  clientId: 0,
  notes: "",
  document: ""
}

export default function LicitationModal({
  open,
  onClose,
  onSuccess,
}: LicitationModalProps) {

  const [info, setInfo] = useState<Omit<LicitationSchema, 'id'>>(emptyClient)
  const [clients, setClients] = useState<ClientList[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setError(null)
      try {
        const clients = (await ClientsApi().list()).filter((item) => item.status === true);
        setClients(clients)

        setInfo(emptyClient)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load data'

        setError(message)
      }
    }

    fetchData()
  }, [open])

  if (!open) return null


  const updateField = <K extends keyof LicitationSchema>(
    field: K,
    value: LicitationSchema[K]
  ) => {
    setInfo((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      const api = LicitationsApi()

      const packaged = {
        reference: info.reference,
        date: toISOString(info.date),
        limit_date: toISOString(info.limit_date),
        clientId: info.clientId,
        notes: info.notes,
        document: ""
      }
      console.log("packaged", packaged)
      const result = await api.create(packaged)
      console.log("result", result)
      if (result && result.id) {
        onSuccess?.(result.id)
        onClose()
        }
      else {

      }

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar'

      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">

      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <div>
            <h2 className="text-sm font-semibold text-[#17233b]">
              Nuevo cliente
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
                Ingresa la información del nuevo cliente.   
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-md
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-600
            "
          >
            <X size={15} />
          </button>

        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 p-5">
          <FormField label="Referencia">
              <input
              value={info.reference}
              onChange={(event) =>
                  updateField(
                  'reference',
                  event.target.value
                  )
              }
              className={inputClass}
              placeholder="Referencia"
              />
          </FormField>

          <FormField label="Cliente">
              <select
              value={info.clientId}
              onChange={(event) =>
                  updateField(
                  'clientId',
                  Number(event.target.value)
                  )
              }
              className={inputClass}
              >
              <option value={0}>
                  Seleccionar cliente
              </option>

              {clients.map((client) => (
                  <option
                  key={client.id}
                  value={client.id}
                  >
                  {client.name}
                  </option>
              ))}
              </select>
          </FormField>

          <FormField label="Fecha">
              <input
              type="date"
              value={info.date}
              onChange={(event) =>
                  updateField(
                  'date',
                  event.target.value
                  )
              }
              className={inputClass}
              />
          </FormField>

          <FormField label="Fecha límite">
              <input
              type="date"
              value={info.limit_date}
              onChange={(event) =>
                  updateField(
                  'limit_date',
                  event.target.value
                  )
              }
              className={inputClass}
              />
          </FormField>

          <div className="col-span-2">
              <FormField label="Notas">
              <textarea
                  value={info.notes}
                  onChange={(event) =>
                  updateField(
                      'notes',
                      event.target.value
                  )
                  }
                  className={`${inputClass} min-h-[90px] resize-none`}
                  placeholder="Notas"
              />
              </FormField>
          </div>
        </div>

        

        {/* Error */}
        {error && (
            <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-[9px] text-red-500">
                {error}
            </p>
            </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">

          <button
            onClick={onClose}
            className="
              rounded-lg
              border border-slate-200
              bg-white
              px-4 py-2
              text-[10px]
              font-semibold
              text-slate-500
              transition
              hover:bg-slate-50
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="
              rounded-lg
              bg-[#0bc99b]
              px-4 py-2
              text-[10px]
              font-semibold
              text-[#071b2f]
              transition
              hover:bg-[#0ab58c]
            "
          >
            Crear cliente
          </button>

        </div>
        
      </div>
    </div>
  )
}
function toISOString(date: string) {
  return new Date(`${date}T00:00:00`).toISOString()
}