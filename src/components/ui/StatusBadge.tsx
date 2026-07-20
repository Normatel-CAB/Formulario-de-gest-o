import type { FormStatus } from '../../lib/types'
import { STATUS_LABELS } from '../../lib/types'
import { cn } from '../../lib/cn'

const toneClasses: Record<FormStatus, string> = {
  rascunho: 'bg-slate-100 text-slate-600',
  enviado: 'bg-sky-100 text-sky-700',
  em_analise: 'bg-amber-100 text-amber-700',
  aprovado: 'bg-brand-100 text-brand-700',
  reprovado: 'bg-rose-100 text-rose-700',
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
