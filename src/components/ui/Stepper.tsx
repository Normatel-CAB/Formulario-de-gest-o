import { cn } from '../../lib/cn'

export interface StepperStep {
  label: string
  description?: string
}

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: StepperStep[]
  current: number
  onStepClick?: (index: number) => void
}) {
  return (
    <nav aria-label="Progresso do formulário" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          const clickable = Boolean(onStepClick) && index <= current
          return (
            <li key={step.label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(index)}
                className={cn(
                  'group flex items-center gap-2 text-left',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-200',
                    done && 'border-brand-600 bg-brand-600 text-white',
                    active && 'border-brand-500 bg-surface text-brand-400 ring-4 ring-brand-500/20',
                    !done && !active && 'border-border-light bg-surface text-ink-subtle',
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:block">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      active || done ? 'text-ink' : 'text-ink-subtle',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && <span className="block text-xs text-ink-subtle">{step.description}</span>}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-3',
                    done ? 'bg-brand-500' : 'bg-border-light',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
