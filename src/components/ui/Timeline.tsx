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
  brand: 'bg-brand-500 ring-brand-100',
  slate: 'bg-slate-400 ring-slate-100',
  amber: 'bg-amber-500 ring-amber-100',
  rose: 'bg-rose-500 ring-rose-100',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-6 border-l border-brand-100 pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              'absolute -left-[29px] top-1 flex h-3 w-3 rounded-full ring-4',
              toneClasses[item.tone ?? 'brand'],
            )}
          />
          <p className="text-sm font-medium text-brand-950">{item.title}</p>
          {item.description && <p className="text-sm text-brand-700/70">{item.description}</p>}
          <time className="mt-0.5 block text-xs text-brand-400">{item.timestamp}</time>
        </li>
      ))}
    </ol>
  )
}
