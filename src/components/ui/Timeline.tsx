import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: string
  icon?: ReactNode
  tone?: 'brand' | 'slate' | 'amber' | 'rose'
}

const toneClasses = {
  brand: 'bg-brand-500 ring-brand-500/20',
  slate: 'bg-ink-subtle ring-white/10',
  amber: 'bg-amber-500 ring-amber-500/20',
  rose: 'bg-rose-500 ring-rose-500/20',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              'absolute -left-[29px] top-1 flex h-3 w-3 rounded-full ring-4',
              toneClasses[item.tone ?? 'brand'],
            )}
          />
          <p className="text-sm font-medium text-ink">{item.title}</p>
          {item.description && <p className="text-sm text-ink-muted">{item.description}</p>}
          <time className="mt-0.5 block text-xs text-ink-subtle">{item.timestamp}</time>
        </li>
      ))}
    </ol>
  )
}
