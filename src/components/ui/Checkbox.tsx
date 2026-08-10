import { cn } from '../../lib/cn'

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <label className={cn('flex select-none items-center gap-2 text-sm', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
      <span className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            'flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-colors duration-150',
            checked ? 'border-transparent bg-gradient-to-br from-brand-lite to-brand' : 'border-border-light bg-surface-2',
          )}
        >
          {checked && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </span>
      {label && <span className="text-ink-muted">{label}</span>}
    </label>
  )
}
