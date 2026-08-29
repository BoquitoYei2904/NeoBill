import type {
  TaxOption,
  UserConfiguration,
  ConfigurationItem,
  DiscountOption
} from '../type/Configurations'

export const users: UserConfiguration[] = [
  {
    id: 'USR-001',
    name: 'Elena Rostova',
    email: 'elena@neobill.com',
    role: 'Líder SysOps',
    status: 'Activo',
  },
  {
    id: 'USR-002',
    name: 'Carlos Mendoza',
    email: 'carlos@neobill.com',
    role: 'Administrador',
    status: 'Activo',
  },
  {
    id: 'USR-003',
    name: 'María Torres',
    email: 'maria@neobill.com',
    role: 'Operador',
    status: 'Activo',
  },
  {
    id: 'USR-004',
    name: 'Juan Pérez',
    email: 'juan@neobill.com',
    role: 'Operador',
    status: 'Inactivo',
  },
]

export const clientTypes: ConfigurationItem[] = [
  {
    id: 'CLI-001',
    name: 'Empresa privada',
    status: 'Activo',
  },
  {
    id: 'CLI-002',
    name: 'Entidad pública',
    status: 'Activo',
  },
  {
    id: 'CLI-003',
    name: 'Persona natural',
    status: 'Activo',
  },
]

export const discountOptions: DiscountOption[] = [
  {
    id: 'TAX-001',
    name: '7%',
    value: 7,
    status: 'Activo',
  },
  {
    id: 'TAX-002',
    name: '10%',
    value: 10,
    status: 'Activo',
  },
  {
    id: 'TAX-003',
    name: '15%',
    value: 15,
    status: 'Activo',
  },
]

export const taxTypes: TaxOption[] = [
  {
    id: 'OPT-001',
    name: 'ITBMS 7%',
    value: 7,
    status: 'Activo',
  },
  {
    id: 'OPT-002',
    name: 'ITBMS 10%',
    value: 10,
    status: 'Activo',
  },
  {
    id: 'OPT-003',
    name: 'ITBMS 15%',
    value: 15,
    status: 'Activo',
  },
]