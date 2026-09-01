import { Pencil, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import ConfigurationModal from '../settings/ConfigurationModal'
import { getConfigApi } from '../../services/configsApi'
import type {
  ConfigurationType,
  ConfigurationItem,
  TaxOption,
  DiscountOption, 
  UserConfigInfo
} from '../../type/Configurations'

type ConfigItem =  | TaxOption | DiscountOption | ConfigurationItem | UserConfigInfo

interface ConfigurationTableProps {
  type: ConfigurationType
}

export default function ConfigurationTable({ type }: ConfigurationTableProps) {

  
  const [items, setItems] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const [selectedItem, setSelectedItem] = useState<ConfigurationItem |  TaxOption | UserConfigInfo>()

  // Fetch data on mount and when type changes
  useEffect(() => {
    fetchData()
  }, [type])
 
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const api = getConfigApi(type)
      const data = await api.list()
      setItems(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedItem(undefined)
    setModalMode('create')
    setModalOpen(true)
  }
  const handleEdit = (item: ConfigItem) => {
    setSelectedItem(item)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Refresh the list after successful create/update
    fetchData()
  }
 
  if (loading && items.length === 0) {
    return <div className="p-4">Cargando...</div>
  }

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
          onClick={handleCreate}
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
            {items.map((item, index) => {
              const user = item as UserConfigInfo
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
                        {user.roles}
                      </td>
                    </>
                  )}

                  {type === 'discountOptions' || type === 'taxTypes' ?(
                    <td className="px-4 py-3.5 text-[10px] font-semibold text-slate-700">
                      {(taxOption.value*100).toFixed(0)+"%"}
                    </td>
                  ): null}

                  {type === 'users' ? (
                  <td className="px-4 py-3.5">
                    <StatusBadgeMultiple status={user.status} />
                  </td>
                  ):(
                  <td className="px-4 py-3.5">
                    <StatusBadge status={taxOption.status} />
                  </td>
                  )}

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
                      onClick={() => handleEdit(item)}
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
          {items.length} registros
        </span>
      </div>

      {/* Modal */}
      <ConfigurationModal
        type={type}
        open={modalOpen}
        mode={modalMode}
        item={selectedItem}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </section>
    
    
  )
}

function StatusBadge({
  status,
}: {
  status?: boolean
}) {

  return (
    <span
      className={`
        inline-flex rounded-full
        px-2 py-1
        text-[8px] font-semibold
        ${
          status === true
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-slate-100 text-slate-500'
        }
      `}
    >
      {status === true ? "Activo": "Inactivo"}
    </span>
  )
}
function StatusBadgeMultiple({
  status,
}: {
  status?: string
}) {

  return (
    <span
      className={`
        inline-flex rounded-full
        px-2 py-1
        text-[8px] font-semibold
        ${
          status === "pending"
            ? 'bg-slate-100 text-slate-500'
            : status === "approved"
            ? 'bg-emerald-50 text-emerald-600'
            : status === "rejected"
            ? 'bg-emerald-50 text-orange-600' 
            : 'bg-emerald-50 text-red-600'
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