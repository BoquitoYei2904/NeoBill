import { AlertCircle, X } from 'lucide-react'

interface ErrorModalProps {
  open: boolean
  title?: string
  message: string
  onClose: () => void
}

export default function ErrorModal({
  open,
  title = 'Ha ocurrido un error',
  message,
  onClose,
}: ErrorModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle
                size={16}
                className="text-red-500"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#17233b]">
                {title}
              </h2>

              <p className="mt-0.5 text-[9px] text-slate-400">
                No se pudo completar la operación.
              </p>
            </div>

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

        {/* Message */}
        <div className="px-5 py-5">
          <div className="rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
            <p className="whitespace-pre-wrap text-[10px] leading-5 text-red-600">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="
              rounded-lg
              bg-[#17233b]
              px-4 py-2
              text-[10px]
              font-semibold
              text-white
              transition
              hover:bg-[#243250]
            "
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}