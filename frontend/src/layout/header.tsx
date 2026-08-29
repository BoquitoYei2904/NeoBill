import { Search, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { quickAccess } from '../pages/navigation'
import { supabase } from '../services/supabaseClient'
export default function Header() {
  const location = useLocation()

  const currentPage = quickAccess.find(
    (item) => item.path === location.pathname
  )

  const title = currentPage?.title ?? 'NeoBill'

  const description =
    currentPage?.description ??
    'Gestiona tu información desde NeoBill'

  return (
    <header className="mb-7 flex min-w-0 items-start justify-between gap-4">

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] font-bold tracking-tight text-[#17233b]">
          {title}
        </h1>

        <p className="mt-0.5 text-[11px] text-slate-400">
          {description}
        </p>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center gap-3">

        <div className="hidden h-9 w-[215px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm md:flex">
          <Search
            size={14}
            className="shrink-0 text-slate-400"
          />

          <input
            type="text"
            placeholder="Buscar..."
            className="w-full min-w-0 bg-transparent text-[11px] outline-none placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 hover:text-gray-900 py-2 px-4 rounded-md transition duration-200" onClick={() => supabase.auth.signOut()}>
          Cerrar sesion<LogOut size={16} />
        </button>


      </div>
    </header>
  )
}