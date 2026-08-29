import { Pencil, Plus } from 'lucide-react'

import type {
  ConfigurationItem,
  TaxOption,
  UserConfiguration,
} from '../../type/Configurations'

interface ConfigurationTableProps {
  type: 'users' | 'clientTypes' | 'taxTypes' | 'discountOptions'
  data: (
    | ConfigurationItem
    | UserConfiguration
    | TaxOption
  )[]
  onCreate: () => void
  onEdit: (item: ConfigurationItem | UserConfiguration | TaxOption) => void
}


export default function ConfigurationTable({
  type,
  data,
  onCreate,
  onEdit,
}: ConfigurationTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(20,40,60,0.05)]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[14px] font-bold text-[#17233b]">
            {getTitle(type)}
          </h2>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {getDescription(type)}
          </p>
        </div>

        <button
          onClick={onCreate}
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
          Nuevo
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Nombre
              </th>

              {type === 'users' && (
                <>
                  <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Correo
                  </th>

                  <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Rol
                  </th>
                </>
              )}


              {type === 'discountOptions' || type === 'taxTypes' ?(
                <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Valor
                </th>
              ): null}

              <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Estado
              </th>

              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => {
              const user = item as UserConfiguration
              const taxOption = item as TaxOption

              return (
                <tr
                  key={item.id}
                  className={`
                    border-b border-slate-100
                    transition
                    hover:bg-slate-50
                    ${index % 2 === 1 ? 'bg-slate-50/40' : ''}
                  `}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[11px] font-semibold text-[#17233b]">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {item.id}
                    </p>
                  </td>

                  {type === 'users' && (
                    <>
                      <td className="px-4 py-3.5 text-[10px] text-slate-600">
                        {user.email}
                      </td>

                      <td className="px-4 py-3.5 text-[10px] text-slate-600">
                        {user.role}
                      </td>
                    </>
                  )}

                  {type === 'discountOptions' || type === 'taxTypes' ?(
                    <td className="px-4 py-3.5 text-[10px] font-semibold text-slate-700">
                      {taxOption.value+"%"}
                    </td>
                  ): null}

                  <td className="px-4 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      className="
                        flex h-7 w-7
                        items-center justify-center
                        rounded-md
                        text-slate-400
                        transition
                        hover:bg-blue-50
                        hover:text-blue-500
                      "
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3">
        <span className="text-[9px] text-slate-400">
          {data.length} registros
        </span>
      </div>
    </section>
  )
}

function StatusBadge({
  status,
}: {
  status?: 'Activo' | 'Inactivo'
}) {
  if (!status) return null

  return (
    <span
      className={`
        inline-flex rounded-full
        px-2 py-1
        text-[8px] font-semibold
        ${
          status === 'Activo'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-slate-500'
        }
      `}
    >
      {status}
    </span>
  )
}

function getTitle(
  type: ConfigurationTableProps['type']
) {
  switch (type) {
    case 'users':
      return 'Usuarios'
    case 'clientTypes':
      return 'Tipos de clientes'
    case 'taxTypes':
      return 'Tipos de impuesto'
    case 'discountOptions':
      return 'Opciones de descuento'
  }
}

function getDescription(
  type: ConfigurationTableProps['type']
) {
  switch (type) {
    case 'users':
      return 'Gestiona los usuarios del sistema'
    case 'clientTypes':
      return 'Configura los tipos de clientes'
    case 'taxTypes':
      return 'Configura los tipos de impuesto'
    case 'discountOptions':
      return 'Configura las opciones disponibles de descuento'
  }
}