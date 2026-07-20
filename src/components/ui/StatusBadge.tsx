import type { FormStatus } from '../../lib/types'
import { STATUS_LABELS } from '../../lib/types'
import { cn } from '../../lib/cn'

const toneClasses: Record<FormStatus, string> = {
  rascunho: 'bg-white/10 text-ink-muted',
  enviado: 'bg-sky-500/15 text-sky-300',
  em_analise: 'bg-amber-500/15 text-amber-300',
  aprovado: 'bg-brand-500/15 text-brand-300',
  reprovado: 'bg-rose-500/15 text-rose-300',
}

const dotClasses: Record<FormStatus, string> = {
  rascunho: 'bg-slate-400',
  enviado: 'bg-sky-500',
  em_analise: 'bg-amber-500',
  aprovado: 'bg-brand-500',
  reprovado: 'bg-rose-500',
}

export function StatusBadge({ status, className }: { status: FormStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        toneClasses[status],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[status])} />
      {STATUS_LABELS[status]}
    </span>
  )
}
