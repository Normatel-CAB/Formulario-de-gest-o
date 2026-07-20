import { cn } from '../../lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-out',
        checked ? 'bg-brand-600' : 'bg-brand-100',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-out',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

export function SimNaoField({
  label,
  checked,
  onChange,
  description,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-brand-950">{label}</p>
        {description && <p className="text-xs text-brand-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-semibold', checked ? 'text-brand-300' : 'text-brand-700')}>Não</span>
        <Switch checked={checked} onChange={onChange} label={label} />
        <span className={cn('text-xs font-semibold', checked ? 'text-brand-700' : 'text-brand-300')}>Sim</span>
      </div>
    </div>
  )
}
