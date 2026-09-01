import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import PaymentModal from './paymentsModal'
import { PaymentsApi } from '../../services/paymentsApi'
import type { Payment, PaymentSummary } from '../../type/payments'

export default function PaymentsTable() {
  const [payments, setPayments] = useState<PaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedPayment, setSelectedPayment] = useState<Payment | undefined>()

  // Fetch data on mount
  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PaymentsApi().listSummary()
      setPayments(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load payments'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedPayment(undefined)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEdit = async (paymentId: number) => {
    try {
      const payment = await PaymentsApi().get(paymentId)
      setSelectedPayment(payment)
      setModalMode('edit')
      setIsModalOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load payment'
      alert(message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pago?')) return

    try {
      await PaymentsApi().delete(id)
      setPayments(payments.filter(p => p.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete'
      alert(message)
    }
  }

  const handleModalSuccess = () => {
    fetchPayments()
  }

  if (loading && payments.length === 0) {
    return <div className="p-6">Cargando pagos...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17233b]">Pagos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Total: {payments.length} pago{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-[#0bc99b] px-4 py-2 text-sm font-semibold text-[#071b2f] transition hover:bg-[#0ab58c]">
          <Plus size={16} />
          Nuevo Pago
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
          No hay pagos registrados. Crea el primero haciendo clic en "+ Nuevo Pago"
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Método</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Notas</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{payment.referencia}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{payment.cliente}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    ${payment.monto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{payment.metodo}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(payment.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{payment.notas || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(payment.id)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(payment.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <PaymentModal
        open={isModalOpen}
        mode={modalMode}
        payment={selectedPayment}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}