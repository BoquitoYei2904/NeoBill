export type ConfigurationType =
  | 'users'
  | 'clientTypes'
  | 'taxTypes'
  | 'discountOptions'

export interface ConfigurationItem {
  id: string
  name: string
  status: boolean
}

export interface TaxOption extends ConfigurationItem {
  value: number
}

export interface DiscountOption extends ConfigurationItem {
  value: number
}

export interface UserConfigInfo {
  id: string
  name: string
  email: string
  roles: string
  password: string
  age: number,
  address: string,
  phone: string,
  status: string
}