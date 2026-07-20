import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'brand' | 'slate' | 'sky' | 'amber' | 'rose' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  brand: 'bg-brand-500/15 text-brand-300',
  slate: 'bg-white/10 text-ink-muted',
  sky: 'bg-sky-500/15 text-sky-300',
  amber: 'bg-amber-500/15 text-amber-300',
  rose: 'bg-rose-500/15 text-rose-300',
  outline: 'border border-border-light text-ink-muted bg-transparent',
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
