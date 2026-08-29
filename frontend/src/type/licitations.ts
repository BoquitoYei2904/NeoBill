export type LicitationStatus =
    | 'Borrador'
    | 'Activa'
    | 'Adjudicada'
    | 'Perdida'
    | 'Por cobrar'
    | 'Cobrada'

export interface Licitation {
  id: string
  codigo: string
  cliente: string
  descripcion: string
  fecha: string
  fechaLimite: string
  presupuesto: number
  status: LicitationStatus
}