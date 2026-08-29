import {
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  ShoppingBag
} from 'lucide-react'

export const quickAccess = [
  {
    label: 'Inicio',
    path: '/',
    icon: LayoutDashboard,
    title: 'Inicio',
    description: 'Resumen general de tu actividad',
  },
  {
    label: 'Licitaciones',
    path: '/dashboard',
    icon: BarChart3,
    title: 'Licitaciones',
    description: 'Gestiona y supervisa tus licitaciones',
  },
  {
    label: 'Clientes',
    path: '/clients',
    icon: Users,
    title: 'Clientes',
    description: 'Consulta y administra tus clientes',
  },
  {
    label: 'Productos',
    path: '/products',
    icon: ShoppingBag,
    title: 'Productos',
    description: 'Consulta y administra tus productos',
  },
  {
    label: 'Configuraciones',
    path: '/settings',
    icon: Settings,
    title: 'Configuraciones',
    description: 'Gestiona las configuraciones del sistema',
  },
]