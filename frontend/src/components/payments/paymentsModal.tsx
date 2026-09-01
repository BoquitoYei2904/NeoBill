import { X, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

import { PaymentsApi } from '../../services/paymentsApi'
import { LicitationsApi } from '../../services/licitationsApi'
import { ClientsApi } from '../../services/clientsApi'

import type {
  Payment,
  CreatePaymentPayload,
} from '../../type/payments'

import {
  formatCurrency,
  FormField,
  inputClass,
} from '../globalComponents'


interface PaymentModalProps {
  open: boolean
  mode: 'create' | 'edit'
  payment?: Payment
  onClose: () => void
  onSuccess?: () => void
}


function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}


const today = new Date()


const emptyPayment: CreatePaymentPayload = {
  amount: 0,
  payment_method: '',
  date: formatDateForInput(today),
  notes: '',
  licitationId: 0,
  clientId: 0,
}


export default function PaymentModal({
  open,
  mode,
  payment,
  onClose,
  onSuccess,
}: PaymentModalProps) {

  const [info, setInfo] = useState<CreatePaymentPayload>(emptyPayment)

  const [step, setStep] = useState<'client' | 'form'>('client')

  const [clients, setClients] = useState<any[]>([])
  const [licitations, setLicitations] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoadingData(true)
      setError(null)

      try {
        const [licitationsList, clientsList] = await Promise.all([
          LicitationsApi().list(),
          ClientsApi().list(),
        ])

        setLicitations(licitationsList)
        setClients(clientsList)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los datos'

        setError(message)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [open])


  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && payment) {
      setInfo({
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        date: payment.date?.split('T')[0] ?? '',
        notes: payment.notes ?? '',
        licitationId: Number(payment.licitationId),
        clientId: Number(payment.clientId),
      })

      // Edit skips client selection.
      setStep('form')
    } else {
      setInfo(emptyPayment)

      // Create starts with client selection.
      setStep('client')
    }

    setError(null)
  }, [open, mode, payment])


  const updateField = <K extends keyof CreatePaymentPayload>(
    field: K,
    value: CreatePaymentPayload[K]
  ) => {
    setInfo((current) => ({
      ...current,
      [field]: value,
    }))
  }


  const handleClientSelect = (clientId: number) => {
    setInfo((current) => ({
      ...current,
      clientId,
      licitationId: 0,
      amount: 0,
    }))

    setStep('form')
  }



  const handleLicitationSelect = (licitation: any) => {
    setInfo((current) => ({
      ...current,
      licitationId: Number(licitation.id),
      amount: Number(licitation.total ?? 0),
    }))
  }


  const availableLicitations = licitations.filter(
    (licitation) =>
      Number(licitation.clientId) === Number(info.clientId) && licitation.status === "por_cobrar"
  )

  const selectedClient = clients.find(
    (client) =>
      Number(client.id) === Number(info.clientId)
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (
        !info.amount ||
        !info.payment_method ||
        !info.date ||
        !info.licitationId ||
        !info.clientId
      ) {
        throw new Error(
          'Por favor completa todos los campos requeridos'
        )
      }

      const payload: CreatePaymentPayload = {
        amount: Number(info.amount),
        payment_method: info.payment_method,
        date: info.date,
        licitationId: Number(info.licitationId),
        clientId: Number(info.clientId),
        notes: info.notes || '',
      }

      if (mode === 'create') {
        await PaymentsApi().create(payload)
      } else {
        if (!payment?.id) {
          throw new Error('No se encontró el pago')
        }

        await PaymentsApi().update(payment.id, payload)
      }

      onSuccess?.()
      onClose()

    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar'

      setError(message)

    } finally {
      setLoading(false)
    }
  }


  if (!open) {
    return null
  }


  const title =
    mode === 'create'
      ? 'Nuevo Pago'
      : 'Editar Pago'


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071b2f]/40 px-4 backdrop-blur-[2px]">

      <div className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">

          <div>
            <h2 className="text-[14px] font-bold text-[#17233b]">
              {title}
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {step === 'client'
                ? 'Selecciona el cliente para continuar.'
                : mode === 'create'
                  ? 'Completa la información para registrar el pago.'
                  : 'Modifica la información del pago.'
              }
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="
              flex h-7 w-7
              items-center justify-center
              rounded-md
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-600
              disabled:opacity-50
            "
          >
            <X size={16} />
          </button>

        </div>


        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
            {error}
          </div>
        )}


        {/* Loading */}
        {loadingData ? (
          <div className="p-8 text-center text-[11px] text-slate-400">
            Cargando...
          </div>
        ) : (
          <>
            {/* STEP 1 — CLIENT SELECTION */}

            {step === 'client' && mode === 'create' && (

              <div className="p-5">

                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Clientes
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Selecciona el cliente al que pertenece este pago.
                  </p>
                </div>


                <div className="overflow-hidden rounded-lg border border-slate-200">

                  {clients.map((client) => (

                    <button
                      key={client.id}
                      type="button"
                      onClick={() =>
                        handleClientSelect(Number(client.id))
                      }
                      className="
                        flex w-full
                        items-center justify-between
                        border-b border-slate-100
                        px-4 py-3
                        text-left
                        transition
                        last:border-b-0
                        hover:bg-slate-50
                      "
                    >

                      <div>

                        <p className="text-[11px] font-semibold text-[#17233b]">
                          {client.name}
                        </p>

                        {client.email && (
                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {client.email}
                          </p>
                        )}

                      </div>

                      <span className="text-[9px] text-slate-400">
                        Seleccionar →
                      </span>

                    </button>

                  ))}

                </div>

              </div>
            )}

            {/* STEP 2 — PAYMENT FORM */}

            {step === 'form' && (

              <form
                onSubmit={handleSubmit}
                className="space-y-4 px-5 py-5"
              >

                {/* Back to clients */}
                {mode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setStep('client')}
                    disabled={loading}
                    className="
                      flex items-center gap-1.5
                      text-[9px]
                      font-medium
                      text-slate-400
                      transition
                      hover:text-slate-700
                    "
                  >
                    <ArrowLeft size={12} />
                    Cambiar cliente
                  </button>
                )}

                 {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[10px]
                      font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    disabled={
                      loading ||
                      loadingData ||
                      !info.clientId ||
                      !info.licitationId
                    }
                    className="flex items-center gap-2 rounded-lg bg-[#0bc99b] px-4 py-2
                      text-[10px] font-semibold text-[#071b2f] transition hover:bg-[#0ab58c] disabled:opacity-50"
                  >
                    {loading
                      ? 'Guardando...'
                      : mode === 'create'
                        ? 'Crear pago'
                        : 'Guardar cambios'
                    }
                  </button>

                </div>

                {/* Selected client */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[#17233b]">
                    {selectedClient?.name ?? `Cliente #${info.clientId}`}
                  </p>
                </div>

                <FormField label="Método de Pago">
                  <select
                    disabled={loading}
                    value={info.payment_method}
                    onChange={(event) =>
                      updateField(
                        'payment_method',
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Seleccionar método
                    </option>
                    <option value="Efectivo">
                      Efectivo
                    </option>
                    <option value="Cheque">
                      Cheque
                    </option>
                    <option value="Transferencia">
                      Transferencia Bancaria
                    </option>
                    <option value="Tarjeta">
                      Tarjeta de Crédito
                    </option>
                    <option value="Otro">
                      Otro
                    </option>
                  </select>

                </FormField>

                <FormField label="Fecha">
                  <input
                    disabled={loading}
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

                <FormField label="Monto">
                  <input
                    disabled={loading}
                    type="number"
                    step="0.01"
                    value={info.amount}
                    onChange={(event) =>
                      updateField(
                        'amount',
                        Number(event.target.value)
                      )
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Notas">
                  <textarea
                    disabled={loading}
                    value={info.notes ?? ''}
                    onChange={(event) =>
                      updateField(
                        'notes',
                        event.target.value
                      )
                    }
                    placeholder="Notas adicionales sobre el pago"
                    className={`${inputClass} h-20 resize-none`}
                  />
                </FormField>
                
                <FormField label="Licitaciones">
                  {availableLicitations.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-[10px] text-amber-700">
                      Este cliente no tiene licitaciones disponibles.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      {availableLicitations.map((licitation) => {
                        const selected =
                          Number(info.licitationId) ===
                          Number(licitation.id)

                        return (
                          <label
                            key={licitation.id}
                            className={`
                              flex cursor-pointer
                              items-center gap-3
                              border-b border-slate-100
                              px-4 py-3
                              last:border-b-0
                              transition
                              ${
                                selected
                                  ? 'bg-emerald-50/50'
                                  : 'hover:bg-slate-50'
                              }
                            `}
                          >

                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                handleLicitationSelect(licitation)
                              }
                              className="h-3.5 w-3.5 accent-[#0bc99b]"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-[#17233b]">
                                {licitation.reference}
                              </p>
                              {licitation.notes && (
                                <p className="mt-0.5 truncate text-[9px] text-slate-400">
                                  {licitation.notes}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-slate-700">
                                {formatCurrency(
                                  Number(licitation.total ?? 0)
                                )}
                              </p>
                              {licitation.date && (
                                <p className="mt-0.5 text-[8px] text-slate-400">
                                  {licitation.date.split('T')[0]}
                                </p>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </FormField>

              </form>
            )}

          </>
        )}

      </div>
    </div>
  )
}