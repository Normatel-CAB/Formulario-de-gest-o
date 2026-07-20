import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'brand' | 'slate' | 'sky' | 'amber' | 'rose' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  slate: 'bg-slate-100 text-slate-600',
  sky: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  outline: 'border border-brand-200 text-brand-700 bg-transparent',
}

export function Badge({ className, tone = 'brand', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
