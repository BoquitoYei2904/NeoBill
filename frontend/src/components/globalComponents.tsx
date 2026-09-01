export function FormField({
  label,
  children,
  required
}: {
  label: string
  children: React.ReactNode,
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {required && <span className="text-red-500">*</span>}
      {children}
    </label>
  )
}

export const inputClass = `
  h-9
  w-full
  rounded-lg
  border border-slate-200
  bg-white
  px-3
  text-[11px]
  text-slate-700
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-[#0bc99b]
  focus:ring-2
  focus:ring-[#0bc99b]/10
`

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'PAB', // changed to balboas
    maximumFractionDigits: 2,
  }).format(value)
}
export function toDateInputValue(date: string) {
  return date.split('T')[0]
}