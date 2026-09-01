import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { quickAccess } from '../pages/navigation'

export default function Sidebar() {

  
  return (
      <aside className="
        fixed
        inset-y-0
        left-0
        z-50
        flex
        h-screen
        w-[228px]
        flex-col
        overflow-hidden
        bg-[#081a30]
        px-[14px]
        py-7
        ">
        {/* Logo */}
        <div className="mb-5 flex items-center gap-3 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0bc99b] text-[#071b2f]">
            <Activity size={16} strokeWidth={2.5} />
          </div>

          <span className="text-[14px] font-bold tracking-wide text-white">
            NeoBill
          </span>

        </div>
        {/* System status */}
        <div className="mt-auto px-2 my-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Estado del sistema</span>

            <span className="flex items-center gap-1 text-[#32cda8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#32cda8]" />
              En línea
            </span>
          </div>
        </div>

        {/* User */}
        <div className="mb-6 rounded-xl bg-[#142c4b] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9c6b5] text-xs font-semibold text-[#253247]">
              ER
            </div>

            <div>
              <p className="text-[12px] font-semibold text-white">
                Elena Rostova
              </p>

              <p className="text-[10px] text-[#55d5ba]">
                Líder SysOps
              </p>
            </div>
          </div>
        </div>

        {/* Quick access */}
        <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Acceso rápido
        </p>

        <nav className="space-y-1">
          {quickAccess.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `
                    flex w-full items-center gap-3
                    rounded-md px-2.5 py-2
                    text-[11px]
                    transition
                    ${
                      isActive
                        ? 'bg-[#183453] text-white'
                        : 'text-slate-400 hover:bg-[#102843] hover:text-white'
                    }
                  `
                }
              >
                <Icon size={14} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Alerts */}
        <p className="mb-2 mt-7 px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Notificaciones
        </p>
        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-2">
            <Alert
                icon={<Activity size={14} />}
                title="Pico en el clúster principal"
                time="hace 10 min"
            />

            <Alert
                icon={<Activity size={14} />}
                title="Despliegue de respaldo exitoso"
                time="hace 1 h"
            />

            <Alert
                icon={<BarChart3 size={14} />}
                title="Compilación semanal de analítica"
                time="hace 3 h"
            />
            <Alert
                icon={<BarChart3 size={14} />}
                title="Compilación semanal de analítica"
                time="hace 3 h"
            />
            </div>
        </div>

        
      </aside>
  )
}

interface AlertProps {
  icon: React.ReactNode
  title: string
  time: string
}

function Alert({
  icon,
  title,
  time,
}: AlertProps) {
  return (
    <div className="rounded-lg bg-[#102640] px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-[#0bc99b]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium text-slate-200">
            {title}
          </p>

          <p className="mt-0.5 text-[8px] text-slate-500">
            {time}
          </p>
        </div>
      </div>
    </div>
  )
}