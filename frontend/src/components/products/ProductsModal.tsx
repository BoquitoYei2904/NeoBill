import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProductDetail, ProductSchema } from '../../type/products'
import { ProductsApi } from '../../services/productsApi'
import { getConfigApi } from '../../services/configsApi'



//global helpers
import { FormField, inputClass } from '../globalComponents'
import type { TaxOption } from '../../type/Configurations'


interface ProductModalProps {
  open: boolean
  id?: number
  onClose: () => void
  onSuccess?: () => void // Callback to refresh data after successful save
}

const emptyProduct: ProductSchema = {
  id: 0,
  description: '',
  code: '',
  price: 0,
  cost: 0,
  notes: "",
  tags: [],
  taxId: 0,
  status: true,
}

export default function ProductModal({
  open,
  id,
  onClose,
  onSuccess,
}: ProductModalProps) {

  const [info, setInfo] = useState<ProductSchema>(emptyProduct)
  const [tax, setTax] = useState<TaxOption[]>([])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)


  // Fetch data on mount and when type changes
  useEffect(() => {
    const fetchData = async () => {
    setError(null)
    try {
      const data = await (await ProductsApi().list()).find((item)=> item.id == id);
      const taxData = (await getConfigApi('taxTypes').list()).filter((item)=> item.status == true)
      setTax(taxData)
      const filtered: ProductSchema = {
        id: data.id,
        description: data.description,
        code: data.code,
        price: data.price,
        cost: data.cost,
        notes: data.notes,
        taxId: data.taxId,
        tags: data.tags,
        status: data.status,
      }
      setInfo(filtered)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    }
  }
    fetchData()
  }, [open, id])
  
  if (!open) return null

  const isEdit = Boolean(id)

  const updateField = <K extends keyof ProductSchema>(
    field: K,
    value: ProductSchema[K]
  ) => {
    setInfo((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleAddTag = () => {
  const newTag = tagInput.trim()

  if (!newTag) return

  if (info.tags.includes(newTag)) {
    setTagInput('')
    return
  }

  updateField('tags', [...info.tags, newTag])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      'tags',
      info.tags.filter((tag) => tag !== tagToRemove)
    )
  }

  const handleTagKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    try {
      const api = ProductsApi();
      const packaged = {
        description: info.description,
        code: info.code,
        price: info.price,
        cost: info.cost,
        notes: info.notes,
        taxId: info.taxId,
        tags: info.tags,
        status: info.status,
      }
      if (!isEdit) {
        await api.create(packaged)
      } else {
        await api.update(String(info.id), packaged)
      }
  
      // Success!
      onSuccess?.()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error al guardar'
      setError(message)
    }
  }

  if (!info) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">
          Producto no encontrado.
        </p>
      </div>
    )
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[#17233b]">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h2>

            <p className="mt-0.5 text-[9px] text-slate-400">
              {isEdit
                ? 'Modifica la información del producto.'
                : 'Ingresa la información del nuevo producto.'}
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
              value={info.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              className={inputClass}
              placeholder="Nombre del producto"
            />
          </FormField>

          <FormField label="Código">
            <input
              value={info.code}
              onChange={(event) =>
                updateField('code', event.target.value)
              }
              className={inputClass}
              placeholder="Código"
            />
          </FormField>

          <FormField label="Precio">
            <input
              type="number"
              min="0"
              step="0.01"
              value={info.price}
              onChange={(event) =>
                updateField(
                  'price',
                  Number(event.target.value)
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Costo">
            <input
              type="number"
              min="0"
              step="0.01"
              value={info.cost}
              onChange={(event) =>
                updateField(
                  'cost',
                  Number(event.target.value)
                )
              }
              className={inputClass}
            />
          </FormField>

          <FormField label="Etiquetas">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 focus-within:border-[#0bc99b] focus-within:ring-1 focus-within:ring-[#0bc99b]/20">

              {/* Existing tags */}
              <div className="flex flex-wrap gap-1.5">
                {info.tags.map((tag) => (
                  <span
                    key={tag}
                    className="
                      inline-flex items-center gap-1
                      rounded-full
                      bg-slate-100
                      px-2 py-1
                      text-[9px]
                      font-medium
                      text-slate-600
                    "
                  >
                    {tag}

                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="
                        flex h-3.5 w-3.5
                        items-center justify-center
                        rounded-full
                        text-slate-400
                        hover:bg-slate-200
                        hover:text-slate-600
                      "
                      title="Eliminar etiqueta"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input */}
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Agregar etiqueta..."
                  className="
                    min-w-0 flex-1
                    bg-transparent
                    text-[10px]
                    text-slate-700
                    outline-none
                    placeholder:text-slate-300
                  "
                />

                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="
                    rounded-md
                    bg-slate-100
                    px-2 py-1
                    text-[9px]
                    font-semibold
                    text-slate-500
                    transition
                    hover:bg-slate-200
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Agregar
                </button>
              </div>
            </div>
          </FormField>

          <FormField label="Tipo de impuesto">
            <select
              value={info.taxId}
              onChange={(event) =>
                updateField(
                  'taxId',
                  Number(event.target.value)
                )
              }
              className={inputClass}
            >
              <option value={0}>
                Seleccionar impuesto
              </option>
              {tax.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
              
            </select>
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
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </FormField>

          <div className="col-span-2">
            <FormField label="Notas">
              <textarea
                value={info.notes ?? ''}
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
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>

        </div>
      </div>
    </div>
  )
  
}
