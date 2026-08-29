import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { ConfigurationItem, ConfigurationType, TaxOption, UserConfiguration, DiscountOption } from '../../type/Configurations'

interface ConfigurationModalProps {
  type: ConfigurationType
  open: boolean
  mode: 'create' | 'edit'
  item?: ConfigurationItem | UserConfiguration | TaxOption | DiscountOption
  onClose: () => void
  onSubmit: (data: FormData) => void
}

export default function ConfigurationModal({
  type,
  open,
  mode,
  item,
  onClose,
  onSubmit,
}: ConfigurationModalProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [email, setEmail] = useState(item?.email ?? '')
  const [role, setRole] = useState(item?.role ?? '')
  const [value, setValue] = useState(item?.value ?? '')

  const isUser = type === 'users'
  const isTaxOption = type === 'taxTypes'
  const isDiscountOption = type === 'discountOptions'

  useEffect(() => {
    if (!item) {
      setName('')
      setEmail('')
      setRole('')
      setValue('')
      return
    }

    setName(item.name)

    if (isUserItem(item)) {
      setEmail(item.email)
      setRole(item.role)
    } else {
      setEmail('')
      setRole('')
    }

    if (isTaxOptionItem(item)) {
      setValue(item.value)
    } else {
      setValue('')
    }

    if (isDiscountOptionItem(item)) {
      setValue(item.value)
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    onSubmit({
      name,
      email: email || undefined,
      role: role || undefined,
      value: value || undefined,
    })
  }

  function isUserItem(
    item: ConfigurationModalProps['item']
  ): item is UserConfiguration {
    return !!item && 'email' in item && 'role' in item
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
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
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
                value={value}
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