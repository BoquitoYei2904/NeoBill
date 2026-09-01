import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ClientSchema } from '../../type/clients'
import type { ConfigurationItem } from '../../type/Configurations'

import { ClientsApi } from '../../services/clientsApi'
import { getConfigApi } from '../../services/configsApi'

import { FormField, inputClass } from '../globalComponents'

interface ClientModalProps {
  open: boolean
  id?: number
  onClose: () => void
  onSuccess?: () => void
}

const emptyClient: ClientSchema = {
  id: 0,
  typeId: 0,
  name: '',
  identifier: '',
  company: '',
  phone: '',
  email: '',
  notes: '',
  status: true,
}

export default function ClientModal({
  open,
  id,
  onClose,
  onSuccess,
}: ClientModalProps) {

  const [info, setInfo] = useState<ClientSchema>(emptyClient)
  const [types, setTypes] = useState<ConfigurationItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      setError(null)

      try {
        const typeData = (
          await getConfigApi('clientTypes').list()
        ).filter((item) => item.status === true)

        setTypes(typeData)

        // CREATE
        if (id === undefined) {
          setInfo(emptyClient)
          return
        }

        // EDIT
        const data = await (
          await ClientsApi().list()
        ).find((item) => item.id == id)

        if (!data) {
          setError('Cliente no encontrado.')
          return
        }

        const filtered: ClientSchema = {
          id: data.id,
          typeId: data.typeId,
          name: data.name,
          identifier: data.identifier,
          company: data.company ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          notes: data.notes ?? '',
          status: data.status,
        }

        setInfo(filtered)

      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load data'

        setError(message)
      }
    }

    fetchData()
  }, [open, id])

  if (!open) return null

  const isEdit = id !== undefined

  const updateField = <K extends keyof ClientSchema>(
    field: K,
    value: ClientSchema[K]
  ) => {
    setInfo((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      const api = ClientsApi()

      const packaged = {
        typeId: info.typeId,
        name: info.name,
        identifier: info.identifier,
        company: info.company,
        phone: info.phone,
        email: info.email,
        notes: info.notes,
        status: info.status,
      }

      if (!isEdit) {
        await api.create(packaged)
      } else {
        await api.update(String(info.id), packaged)
      }

      onSuccess?.()
      onClose()

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
              {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
              {isEdit
                ? 'Modifica la información del cliente.'
                : 'Ingresa la información del nuevo cliente.'}
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

          <FormField label="Nombre">
            <input
              value={info.name}
              onChange={(event) =>
                updateField(
                  'name',
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Nombre del cliente"
            />
          </FormField>

          <FormField label="Identificación">
            <input
              value={info.identifier}
              onChange={(event) =>
                updateField(
                  'identifier',
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Identificación"
            />
          </FormField>

          <FormField label="Empresa">
            <input
              value={info.company}
              onChange={(event) =>
                updateField(
                  'company',
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Empresa"
            />
          </FormField>

          <FormField label="Tipo">
            <select
              value={info.typeId}
              onChange={(event) =>
                updateField(
                  'typeId',
                  Number(event.target.value)
                )
              }
              className={inputClass}
            >
              <option value={0}>
                Seleccionar tipo
              </option>

              {types.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Correo electrónico">
            <input
              type="email"
              value={info.email}
              onChange={(event) =>
                updateField(
                  'email',
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Correo"
            />
          </FormField>

          <FormField label="Teléfono">
            <input
              value={info.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value
                )
              }
              className={inputClass}
              placeholder="Teléfono"
            />
          </FormField>

          <FormField label="Estado">
            <select
              value={info.status ? 'Activo' : 'Inactivo'}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target.value === 'Activo'
                )
              }
              className={inputClass}
            >
              <option value="Activo">
                Activo
              </option>

              <option value="Inactivo">
                Inactivo
              </option>
            </select>
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

          {/* Error */}
          {error && (
            <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2">
              <p className="text-[9px] text-red-500">
                {error}
              </p>
            </div>
          )}

        </div>

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
            {isEdit
              ? 'Guardar cambios'
              : 'Crear cliente'}
          </button>

        </div>

      </div>
    </div>
  )
}