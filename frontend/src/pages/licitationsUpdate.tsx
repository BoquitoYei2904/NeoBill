import { ArrowLeft, Trash2, SaveCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { LicitationItem, LineItems } from '../type/licitations'
import type { ProductSchema } from '../type/products'

import { LicitationsApi } from '../services/licitationsApi'
import { ClientsApi } from '../services/clientsApi'
import { getConfigApi } from '../services/configsApi'

import {
  formatCurrency,
  toDateInputValue,
  FormField,
  inputClass,
} from '../components/globalComponents'

import AddProductsModal from '../components/products/AddProductsModal'
import { useAuth } from '../services/AuthContext'

export default function LicitationUpdate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const [record, setRecord] = useState<LicitationItem>()
  const [lineItems, setLineItems] = useState<LineItems[]>([])

  //fields
  const [taxesOptions, setTaxesOptions] = useState<any[]>([])
  const [discountOptions, setDiscountOptions] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [productTableOpen, setProductTableOpen] = useState(false)

  if(!id) return null

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await LicitationsApi().detail(Number(id!), "update")

      const client = (await ClientsApi().smallList()).find(
        (item) => item.id === data.clientId
      )

      setRecord({
        ...data,
        clientName: client?.name ?? '',
      })
      //get fields
      const taxTypes = (
        await getConfigApi('taxTypes').list()
      ).filter((item) => item.status === true)
      setTaxesOptions(taxTypes)

      const discountTypes = (
        await getConfigApi('discountOptions').list()
      ).filter((item) => item.status === true)
      setDiscountOptions(discountTypes)

      // Editable line items live in their own state.
      setLineItems(data.lineItems ?? [])
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


  const updateField = <K extends keyof LicitationItem>(
    field: K,
    value: LicitationItem[K]
  ) => {
    setRecord((current) => {
      if (!current) return current
      return { ...current, [field]: value }
    })
  }

  const handleAddProduct = (product: ProductSchema) => {
    const newItem: LineItems = {
      id: -Date.now(),
      productId: product.id,
      code: product.code,
      description: product.description,
      quantity: 1,
      price: Number(product.price),
      taxId: product.taxId,
      discountId: 0,
      total: Number(product.price),
    }

    setLineItems((current) => [...current, newItem])
    setProductTableOpen(false)
  }

  const updateLineItem = <K extends keyof LineItems>(
    id: number,
    field: K,
    value: LineItems[K]
  ) => {
    setLineItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
    setRecord((current) => {
    if (!current) return current
      return {
        ...current,
        base,
        taxes,
        discount,
        total,
      }
    })
  }

  const handleRemoveProduct = (id: number) => {
    setLineItems((current) => current.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    
    if (!record) return
      try {
        const packaged = lineItems.map((item) =>({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          taxId: item.taxId,
          discountId: item.discountId
        }))
        await LicitationsApi().updateFull(record.id, {
          reference: record.reference,
          date: record.date, // ISO string format
          limit_date: record.limitDate, // ISO string format
          notes: record.notes,
          lineItems: packaged, // ← Send all items (mix of positive and negative IDs)
        })
        alert('Licitación guardada exitosamente')
        navigate(-1)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar'
        alert(message)
      }

  }

  // Automatic totals
  const base = lineItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  )
  // Automatic tax
  const taxes = lineItems.reduce(
    (sum, item) => sum + (
      Number(item.price) * Number(item.quantity) * 
      (/*discount */
        item.discountId != 0 && item.discountId != null ? (1-Number(discountOptions.find((discount) => discount.id == item.discountId).value)) : 1 )
      )/*taxes */ 
      * 
      (Number(taxesOptions.find((tax) => tax.id == item.taxId).value)),
    0
  )
  const discount = lineItems.reduce(
    (sum, item) => sum + (
      Number(item.price) * Number(item.quantity) * 
      (/*discount */
        item.discountId != 0 && item.discountId != null ? (Number(discountOptions.find((discount) => discount.id == item.discountId).value)) : 0)
      ),
    0
  )

  const total = base - discount + taxes

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
        <p className="text-sm text-slate-500">Licitación no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Navigation */}
      <div className="grid grid-cols-7 gap-2">
        <button onClick={() => navigate(-1)} className="col-span-2 flex items-center gap-2 text-[10px] font-medium text-slate-400 hover:text-slate-700">
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="col-span-2"></div>
        <div></div>
        <button type="button" onClick={() => setProductTableOpen(true)} className="rounded-lg bg-[#0bc99b] px-3 py-2 text-[10px] font-semibold text-[#071b2f] transition hover:bg-[#0ab58c]">
          + Agregar producto
        </button>
        <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-[#0bc99b] px-3 py-2 text-[10px] font-semibold text-[#071b2f] transition hover:bg-[#0ab58c]">
          <SaveCheck size={14} />
          Guardar Cambios
        </button>
      </div>

      {/* Information*/}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className='flex'>
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
              Estado:
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {record.status}
            </p>
          </div>
          
          <h2 className="mt-2 text-xl font-bold text-[#17233b]">
            {record.clientName}
          </h2>

          
          
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <div className='col-span-2'>
            <FormField label="Referencia">
              <input type="text" value={record.reference} 
                onChange={(event) => updateField('reference', event.target.value)} 
                className={inputClass} />
            </FormField>
          </div>
          
          
          <FormField label="Fecha">
            <input type="date" value={toDateInputValue(record.date)} onChange={(event) => updateField('date', event.target.value)} className={inputClass} />
          </FormField>

          <FormField label="Fecha límite">
            <input type="date" value={toDateInputValue(record.limitDate)} onChange={(event) => updateField('limitDate', event.target.value)} className={inputClass} />
          </FormField>

          <div className="col-span-3">
            <FormField label="Nota">
              <input type="text" value={record.notes} 
                onChange={(event) => updateField('notes', event.target.value)} 
                className={inputClass} />
            </FormField>
          </div>
        </div>
      </section>

      {/* Products table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_80px] border-b border-slate-100 bg-slate-50/70">
              <HeaderCell>Código</HeaderCell>
              <HeaderCell>Detalle</HeaderCell>
              <HeaderCell center>Impuesto</HeaderCell>
              <HeaderCell center>Descuento</HeaderCell>
              <HeaderCell center>Cantidad</HeaderCell>
              <HeaderCell center>Precio</HeaderCell>
              <HeaderCell center>Total</HeaderCell>
            </div>

            {/* Rows */}
            {lineItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-[10px] text-slate-400">
                No hay productos agregados.
              </div>
            ) : (
              lineItems.map((item) => {
                const itemTotal = Number(item.price) * Number(item.quantity)
                return (
                  <div key={item.id} className="grid grid-cols-[80px_1fr_100px_100px_80px_100px_80px] border-b border-slate-100 hover:bg-slate-50">
                    {/* Code */}
                    <div className="px-5 py-3 text-[11px] text-slate-900">
                      {item.code}
                    </div>

                    {/* Description */}
                    <div className="px-3 py-1">
                      <textarea
                        name="description"
                        value={item.description}
                        onChange={(event) => updateLineItem(item.id, 'description', event.target.value)}
                        className="h-[35px] w-full rounded-md border border-slate-200 bg-white p-1 text-[11px] text-slate-900 outline-none focus:border-[#0bc99b] focus:ring-1 focus:ring-[#0bc99b]/20"
                      />
                    </div>

                    {/* Tax */}
                    <div className="px-3 py-2">
                      <select
                        value={item.taxId}
                        onChange={(event) => updateLineItem(item.id, 'taxId', Number(event.target.value))}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] text-slate-600 outline-none focus:border-[#0bc99b] focus:ring-1 focus:ring-[#0bc99b]/20"
                      >
                        {taxesOptions.map((tax) => (
                          <option key={tax.id} value={tax.id}>
                            {tax.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Discount */}
                    <div className="px-3 py-2">
                      <select value={item.discountId}
                        onChange={(event) => updateLineItem(item.id, 'discountId', Number(event.target.value))}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] text-slate-600 outline-none focus:border-[#0bc99b] focus:ring-1 focus:ring-[#0bc99b]/20"
                      >
                        <option value={0}>Sin descuento</option>
                        {discountOptions.map((discount) => (
                          <option key={discount.id} value={discount.id}>
                            {discount.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="px-3 py-2">
                      <input
                        value={item.quantity}
                        onChange={(event) => updateLineItem(item.id, 'quantity', Math.max(1, Number(event.target.value)))}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] text-slate-700 outline-none focus:border-[#0bc99b] focus:ring-1 focus:ring-[#0bc99b]/20"
                      />
                    </div>

                    {/* Price */}
                    {user?.roles === "admin" ? (
                      <div className="px-3 py-2">
                        <input
                          value={item.price}
                          onChange={(event) => updateLineItem(item.id, 'price', Number(event.target.value))}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-[10px] text-slate-700 outline-none focus:border-[#0bc99b] focus:ring-1 focus:ring-[#0bc99b]/20"
                      />
                      </div>
                    ): (
                      <div className="px-5 py-4 text-[11px] text-slate-900 truncate">
                        {formatCurrency(item.price)}
                      </div>
                    )}

                    {/* Total + remove */}
                    <div className="flex items-center justify-between gap-1 px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-700">
                        {formatCurrency(itemTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                        title="Eliminar producto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Totals*/}
      <section className="overflow-hidden rounded-xl shadow-[0_2px_12px_rgba(20,40,60,0.05)]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70">
          <div className="border-b border-slate-100 bg-white px-6 py-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Resumen
            </h3>
          </div>

          <div className="space-y-4 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">Subtotal</span>
              <span className="text-[11px] font-medium text-slate-900">
                {formatCurrency(base)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">Descuento</span>
              <span className="text-[11px] font-medium text-red-600">
                {formatCurrency(discount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">Impuesto</span>
              <span className="text-[11px] font-medium text-slate-900">
                {formatCurrency(taxes)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-4" />

            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-900">Total</span>
              <span className="text-[14px] font-bold text-[#0bc99b]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product selector*/}
      <AddProductsModal
        open={productTableOpen}
        onAdd={handleAddProduct}
        onClose={() => setProductTableOpen(false)}
      />
    </div>
  )
}


function HeaderCell({
  children,
  center = false,
}: {
  children: React.ReactNode
  center?: boolean
}) {
  return (
    <div className={`px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-400 ${center ? 'text-center' : 'text-left'}`}>
      {children}
    </div>
  )
}