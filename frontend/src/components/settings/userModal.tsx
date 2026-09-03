import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getConfigApi } from '../../services/configsApi'

import type { ConfigurationItem, ConfigurationType, TaxOption, DiscountOption, UserConfigInfo } from '../../type/Configurations'

interface ConfigurationModalProps {
  type: ConfigurationType
  open: boolean
  mode: 'create' | 'edit'
  item?: ConfigurationItem | TaxOption | DiscountOption |  UserConfigInfo
  onClose: () => void
  onSuccess?: () => void // Callback to refresh data after successful save
}

export default function ConfigurationModal({
  type,
  open,
  mode,
  item,
  onClose,
  onSuccess,
}: ConfigurationModalProps) {
  const [id, setId] = useState(item?.id ?? '')
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState('')
  const [roles, setroles] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<boolean>(true)
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('') 

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUser = type === 'users'
  const isTaxOption = type === 'taxTypes'
  const isDiscountOption = type === 'discountOptions'

  useEffect(() => {
    if (!item) {
      setId('')
      setName('')
      setEmail('')
      setroles('')
      setValue('')
      setPassword('')
      setAge('')
      setAddress('')
      setPhone('')
      setState('')
      return
    }
    setId(item.id)
    setName(item.name)

    if (isUserItem(item)) {
      setEmail(item.email)
      setroles(item.roles)
    } else {
      setEmail('')
      setroles('')
    }

    if (isTaxOptionItem(item)) {
      setValue(String(item.value))
    } else {
      setValue('')
    }

    if (isDiscountOptionItem(item)) {
      setValue(String(item.value))
    } else {
      setValue('')
    }
  }, [item, type, open])

  if (!open) {
    return null
  }

  const title =
    mode === 'create'
      ? `Nuevo ${getSingularTitle(type)}`
      : `Editar ${getSingularTitle(type)}`


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const api = getConfigApi(type)
      
      // Build the payload based on type
      const payload = buildPayload(type, { id, name, email, roles, value, status, password, age, address, phone, state })
      
      if (mode === 'create') {
        await api.create(payload as any)
      } else {
        await api.update(id, payload as any)
      }
 
      // Success!
      onSuccess?.()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error al guardar'
      setError(message)
    } finally {
      setLoading(false)
    }
  }


  function isUserItem(
    item: ConfigurationModalProps['item']
  ): item is UserConfigInfo {
    return !!item && 'email' in item && 'roles' in item
  }

  function isTaxOptionItem(
    item: ConfigurationModalProps['item']
  ): item is TaxOption {
    return !!item && 'value' in item
  }

  function isDiscountOptionItem(
    item: ConfigurationModalProps['item']
  ): item is DiscountOption {
    return !!item && 'value' in item
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071b2f]/40 px-4 backdrop-blur-[2px]">

      <div className="w-full max-w-[430px] rounded-xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[14px] font-bold text-[#17233b]">
              {title}
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {mode === 'create'
                ? 'Completa la información para crear un nuevo registro.'
                : 'Modifica la información del registro.'}
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
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 px-5 py-5">
          <FormField label="Nombre">
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre"
              className={inputClass}
            />
          </FormField>
          
          {isUser && (
            <>
              <FormField label="Correo electrónico">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Rol">
                <select
                  required
                  value={roles}
                  onChange={(event) => setroles(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar rol</option>
                  <option value="Administrador">
                    Administrador
                  </option>
                  <option value="Líder SysOps">
                    Líder SysOps
                  </option>
                  <option value="Operador">
                    Operador
                  </option>
                </select>
              </FormField>

              
            </>
          )}

          {isTaxOption && (
            <FormField label="Valor">
              <input
                required
                value={(Number(value) * 100).toFixed(0)}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Ej. 7%"
                className={inputClass}
              />
            </FormField>
          )}
          {isDiscountOption && (
            <FormField label="Valor">
              <input
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Ej. 7%"
                className={inputClass}
              />
            </FormField>
          )}

          {mode === 'edit' && (
          <FormField label="Estado">
            <select
              value={status ? 'true' : 'false'}
              onChange={(event) => setStatus(event.target.value === 'true')}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </FormField>
          )}
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-lg
                border border-slate-200
                px-3 py-2
                text-[10px]
                font-medium
                text-slate-500
                transition
                hover:bg-slate-50
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
               
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
            >{mode === 'create' ? 'Crear' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      {children}
    </label>
  )
}

const inputClass = `
  h-9
  w-full
  rounded-lg
  border border-slate-200
  bg-white
  px-3
  text-[11px]
  text-slate-700
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-[#0bc99b]
  focus:ring-2
  focus:ring-[#0bc99b]/10
`

function getSingularTitle(type: ConfigurationType) {
  switch (type) {
    case 'clientTypes':
      return 'tipo de cliente'
    case 'taxTypes':
      return 'tipo de impuesto'
    case 'discountOptions':
      return 'opción de descuento'
    case 'users':
      return 'usuario'
  }
}

function buildPayload(
  type: ConfigurationType,
  data: { id: string; name: string; email: string; 
          roles: string; value: string, status: boolean,
          password: string; age: string; address: string;
          phone: string; state: string;}
) {

  const base = { name: data.name, status: data.status }
 
  if (type === 'users') {
    return { ...base, email: data.email, roles: data.roles }
  } else if (type === 'taxTypes' || type === 'discountOptions') {
    return { ...base, value: Number(data.value) || 0 }
  }
 
  return base
}
