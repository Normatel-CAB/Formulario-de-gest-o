import type { FormStatus } from '../../lib/types'
import { STATUS_LABELS } from '../../lib/types'
import { cn } from '../../lib/cn'

const toneClasses: Record<FormStatus, string> = {
  rascunho: 'border border-hairline bg-surface-2 text-txt-dim',
  enviado: 'border border-viz-teal/25 bg-viz-teal/13 text-viz-teal',
  em_analise: 'border border-viz-amber/25 bg-viz-amber/13 text-viz-amber',
  aprovado: 'border border-brand/25 bg-brand/13 text-brand-lite',
  reprovado: 'border border-viz-red/25 bg-viz-red/13 text-viz-red',
}

const dotClasses: Record<FormStatus, string> = {
  rascunho: 'bg-txt-faint',
  enviado: 'bg-viz-teal',
  em_analise: 'bg-viz-amber',
  aprovado: 'bg-brand',
  reprovado: 'bg-viz-red',
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
