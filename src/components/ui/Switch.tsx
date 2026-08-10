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
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 ease-smooth',
        checked
          ? 'border-transparent bg-gradient-to-r from-brand-lite to-brand shadow-brand-sm'
          : 'border-hairline bg-surface-2',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-smooth',
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
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-txt">{label}</p>
        {description && <p className="text-[11px] text-txt-faint">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('text-[10.5px] font-bold uppercase tracking-[0.08em]', checked ? 'text-txt-faint' : 'text-txt')}>
          Não
        </span>
        <Switch checked={checked} onChange={onChange} label={label} />
        <span className={cn('text-[10.5px] font-bold uppercase tracking-[0.08em]', checked ? 'text-brand-lite' : 'text-txt-faint')}>
          Sim
        </span>
      </div>
    </div>
  )
}
