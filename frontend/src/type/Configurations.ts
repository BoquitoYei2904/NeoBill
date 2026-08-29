export type ConfigurationType =
  | 'users'
  | 'clientTypes'
  | 'taxTypes'
  | 'discountOptions'

export interface ConfigurationItem {
  id: string
  name: string
  status: 'Activo' | 'Inactivo'
}

export interface UserConfiguration extends ConfigurationItem {
  email: string
  role: string
}

export interface TaxOption extends ConfigurationItem {
  value: number
}

export interface DiscountOption extends ConfigurationItem {
  value: number
}