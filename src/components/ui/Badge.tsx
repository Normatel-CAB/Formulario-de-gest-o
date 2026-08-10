import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'brand' | 'slate' | 'sky' | 'amber' | 'rose' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

/** Cores de dados do design system (viz-*) em vez das paletas soltas do Tailwind. */
const toneClasses: Record<BadgeTone, string> = {
  brand: 'border border-brand/25 bg-brand/13 text-brand-lite',
  slate: 'border border-hairline bg-surface-2 text-txt-dim',
  sky: 'border border-viz-teal/25 bg-viz-teal/13 text-viz-teal',
  amber: 'border border-viz-amber/25 bg-viz-amber/13 text-viz-amber',
  rose: 'border border-viz-red/25 bg-viz-red/13 text-viz-red',
  outline: 'border border-hairline bg-transparent text-txt-dim',
}

export function Badge({ className, tone = 'brand', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-[0.01em]',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
