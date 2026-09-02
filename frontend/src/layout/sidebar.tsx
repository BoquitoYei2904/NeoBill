import {
  Activity,
  BarChart3,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { quickAccess } from '../pages/navigation'
import { useAuth } from '../services/AuthContext'
import { formatCurrency,toDateInputValue } from '../components/globalComponents'
import { useEffect, useState } from 'react'
import type { UpcomingExpirations } from '../type/licitations'
import { LicitationsApi } from '../services/licitationsApi'

export default function Sidebar() {

  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<UpcomingExpirations[]>()

  const fetchData = async () => {
      setLoading(true)
      //setError(null)
      try {
        const data = await LicitationsApi().upcomingExpirations();
        if(data){
          setDocuments(data)
        } else {
          setDocuments([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data'
        //setError(message)
      } finally {
        setLoading(false)
      }
    }
        
    useEffect(() => {
      fetchData()
    }, [])
  
  return (
      <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-[228px] flex-col overflow-hidden bg-[#081a30]
        px-[14px] py-7">
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
              {user?.name?.substring(0, 2).toUpperCase() || 'ER'}
            </div>

            <div>
              <p className="text-[12px] font-semibold text-white">
                {user?.name || 'Usuario'}
              </p>

              <p className="text-[10px] text-[#55d5ba]">
                {user?.roles || 'user'}
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
            if(item.label === "Configuraciones" && user?.roles !== "admin"){
              return null
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[11px] transition
                    ${
                      isActive
                        ? 'bg-[#183453] text-white'
                        : 'text-slate-400 hover:bg-[#102843] hover:text-white'
                    }`
                }>
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
        <p className="mb-2 px-2 text-[8px] font-semibold uppercase tracking-wider text-slate-500">
          Próximas licitationes a vencer
        </p>
        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-2">
              {!documents || documents.length === 0 ? (
                <p className="text-xs text-slate-500 px-2 py-4 text-center">
                  No hay licitaciones próximas a vencer.
                </p>
              ) : (
                documents.map((item) => (
                  <Alert
                    id={item.id}
                    icon={<Activity size={14} />}
                    title={item.clientName}
                    time={item.limitDate}
                    amount={item.amount || 0}
                  />
                ))
              )}
            </div>
        </div>

        
      </aside>
  )
}

interface AlertProps {
  id: number
  icon: React.ReactNode
  title: string
  time: string
  amount: number
}

function Alert({
  id,
  icon,
  title,
  time,
  amount,
}: AlertProps) {
  return (
    <NavLink 
      key={`Licitations/${id}`}
      to={`Licitations/${id}`}
      className="block rounded-lg bg-[#102640] px-3 py-2.5 no-underline">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-[#0bc99b]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium text-slate-200">
            {title+"-"+formatCurrency(amount)}
          </p>

          <p className="mt-0.5 text-[8px] text-slate-500">
            {toDateInputValue(time)}
          </p>
        </div>
      </div>
    </NavLink>
  )
}