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
  const atual = steps[current]

  return (
    <nav aria-label="Progresso do formulário" className="w-full">
      {/* No celular não cabe o rótulo de cada etapa ao lado da bolinha, então o
          nome da etapa atual aparece acima da trilha. */}
      <div className="mb-3 sm:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
          Etapa {current + 1} de {steps.length}
        </p>
        <p className="text-[14px] font-semibold tracking-[-0.01em] text-txt">{atual?.label}</p>
        {atual?.description && <p className="text-[11.5px] text-txt-dim">{atual.description}</p>}
      </div>

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
                className={cn('tap-target group flex items-center gap-2.5 text-left', clickable ? 'cursor-pointer' : 'cursor-default')}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[12px] font-bold transition-all duration-200 ease-smooth',
                    done && 'border-transparent bg-gradient-to-br from-brand-lite to-brand text-white shadow-brand-sm',
                    active &&
                      'border-hairline-hi bg-surface text-brand-lite ring-[3px] ring-brand/15',
                    !done && !active && 'border-hairline bg-surface-2 text-txt-faint',
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
                      'block text-[12.5px] font-semibold tracking-[-0.005em]',
                      active || done ? 'text-txt' : 'text-txt-faint',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="block text-[10.5px] uppercase tracking-[0.08em] text-txt-faint">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-2 h-px flex-1 rounded-full transition-colors duration-300 sm:mx-3',
                    done ? 'bg-brand/60' : 'bg-hairline',
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
