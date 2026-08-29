import { Bell, CheckCircle2, Info, X } from 'lucide-react'
import { useState } from 'react'

export default function Notifications() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
      >
        <Bell size={15} />

        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#0bc99b]" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-[300px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[12px] font-semibold">
              Notificaciones
            </h3>

            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <Notification
            icon={<CheckCircle2 size={14} />}
            title="Despliegue exitoso"
            description="El respaldo se completó correctamente."
            time="Hace 1 hora"
          />

          <Notification
            icon={<Info size={14} />}
            title="Nuevo reporte disponible"
            description="El reporte semanal está listo."
            time="Hace 3 horas"
          />
        </div>
      )}
    </div>
  )
}

interface NotificationProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}

function Notification({
  icon,
  title,
  description,
  time,
}: NotificationProps) {
  return (
    <div className="flex gap-3 border-t border-slate-100 py-3">
      <div className="mt-0.5 text-blue-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-700">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
          {description}
        </p>

        <p className="mt-1 text-[8px] text-slate-300">
          {time}
        </p>
      </div>
    </div>
  )
}