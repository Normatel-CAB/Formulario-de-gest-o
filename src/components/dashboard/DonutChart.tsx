import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { serieAt } from '../../lib/chartTheme'
import { cn } from '../../lib/cn'

export interface DonutItem {
  name: string
  value: number
  /** Cor fixa (usada quando a série tem significado, ex.: status). */
  color?: string
}

const R = 46
const CIRC = 2 * Math.PI * R
const GAP = 3.2

/**
 * Rosca de participação em SVG puro — o mesmo componente do dashboard do
 * organograma, sem depender de biblioteca de gráficos. Cada arco tem gradiente
 * próprio, cresce na entrada, e o rótulo central cicla pelas fatias. Apontar a
 * legenda congela o ciclo e destaca a fatia.
 */
export function DonutChart({
  data,
  total,
  unidade = 'fichas',
}: {
  data: DonutItem[]
  total?: number
  unidade?: string
}) {
  const reduce = useReducedMotion()
  const soma = total ?? data.reduce((s, d) => s + d.value, 0)
  const [grown, setGrown] = useState(false)
  const [hot, setHot] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const cursor = useRef(0)

  useEffect(() => {
    if (reduce) {
      setGrown(true)
      setHot(0)
      return
    }
    const t = window.setTimeout(() => setGrown(true), 120)
    return () => window.clearTimeout(t)
  }, [reduce])

  // Ciclo automático do rótulo central; pausa enquanto o usuário aponta a legenda.
  useEffect(() => {
    if (reduce || pinned || data.length === 0) return
    const start = window.setTimeout(() => setHot(0), 700)
    const id = window.setInterval(() => {
      cursor.current = (cursor.current + 1) % data.length
      setHot(cursor.current)
    }, 1900)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(id)
    }
  }, [reduce, pinned, data.length])

  if (soma === 0) {
    return <p className="py-8 text-center text-[12px] text-txt-faint">Nenhum dado disponível</p>
  }

  const cor = (d: DonutItem, i: number) =>
    d.color ? { from: d.color, to: d.color } : serieAt(i)

  let acc = 0
  const arcs = data.map((d, i) => {
    const frac = d.value / soma
    const arc = { len: Math.max(0, frac * CIRC - GAP), offset: -acc * CIRC, ...cor(d, i) }
    acc += frac
    return arc
  })

  const active = hot === null ? null : data[hot]

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[164px] w-[164px] shrink-0 sm:h-[176px] sm:w-[176px]">
        <div
          aria-hidden
          className="absolute inset-4 animate-slow-spin rounded-full opacity-30 blur-[26px]"
          style={{
            background:
              'conic-gradient(from 0deg, var(--viz-green), var(--viz-teal), var(--viz-lime), var(--viz-amber), var(--viz-green))',
          }}
        />
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <defs>
            {arcs.map((a, i) => (
              <linearGradient key={i} id={`donut-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={a.from} />
                <stop offset="100%" stopColor={a.to} />
              </linearGradient>
            ))}
          </defs>

          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth={13} />

          {arcs.map((a, i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={`url(#donut-${i})`}
              strokeWidth={hot === i ? 17 : 13}
              strokeLinecap="round"
              strokeDasharray={`${grown ? a.len : 0} ${CIRC}`}
              strokeDashoffset={a.offset}
              opacity={hot === null || hot === i ? 1 : 0.32}
              style={{
                transition:
                  'stroke-dasharray 1.05s cubic-bezier(0.22,0.75,0.28,1), opacity 0.4s ease, stroke-width 0.35s ease',
                transitionDelay: `${i * 130}ms`,
              }}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-content-center gap-0.5 text-center">
          <div className="tabular text-[25px] font-bold leading-none tracking-[-0.03em]">
            {active ? `${Math.round((active.value / soma) * 100)}%` : soma}
          </div>
          <div className="max-w-[104px] text-[10.5px] leading-tight text-txt-dim">
            {active?.name ?? `no total, em ${unidade}`}
          </div>
        </div>
      </div>

      <ul className="grid w-full min-w-0 flex-1 gap-0.5" onMouseLeave={() => setPinned(false)}>
        {data.map((d, i) => {
          const s = cor(d, i)
          return (
            <li key={d.name}>
              <button
                type="button"
                onMouseEnter={() => {
                  setPinned(true)
                  setHot(i)
                }}
                onFocus={() => {
                  setPinned(true)
                  setHot(i)
                }}
                onClick={() => {
                  setPinned(true)
                  setHot(i)
                }}
                className={cn(
                  'grid w-full grid-cols-[14px_1fr_auto] items-center gap-2.5 rounded-md px-2 py-2 text-left transition-all duration-200',
                  hot === i ? 'translate-x-0.5 bg-surface-2' : 'hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 justify-self-center rounded-sm transition-transform duration-300',
                    hot === i && 'scale-[1.45]',
                  )}
                  style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
                />
                <span className="truncate text-[12px] font-medium">{d.name}</span>
                <span className={cn('tabular text-[12px] font-bold', hot === i ? 'text-txt' : 'text-txt-dim')}>
                  {d.value}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
