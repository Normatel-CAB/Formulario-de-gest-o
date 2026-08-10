import type { ReactNode } from 'react'
import { Card } from './Card'
import { AnimatedCounter } from './AnimatedCounter'
import { Sparkline } from './Sparkline'
import { Reveal } from './Reveal'
import { cn } from '../../lib/cn'
import { VIZ } from '../../lib/chartTheme'

export type KpiTrend = 'up' | 'down' | 'flat'

/**
 * Catálogo de ícones do KPI. O ícone entra por NOME, não por componente — é o
 * mesmo contrato do organograma, e mantém as chamadas curtas e serializáveis.
 */
export const KPI_ICONS = {
  stack: (
    <>
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />,
  trendingUp: (
    <>
      <path d="M3 17l6-6 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 7h10v9H3zM13 11h4l3 3v2h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
} as const

export type KpiIconName = keyof typeof KPI_ICONS

/**
 * Cartão de indicador: rótulo, ícone, número que sobe, dica e variação, com um
 * sparkline sangrando no canto inferior direito.
 */
export function KpiCard({
  label,
  value,
  valueText,
  suffix,
  hint,
  icon,
  color = VIZ.green,
  trend,
  trendLabel,
  spark,
  index = 0,
  action,
}: {
  label: string
  /** Valor numérico — anima subindo. Ignorado se `valueText` for passado. */
  value?: number
  /** Texto fixo para indicadores não numéricos. */
  valueText?: string
  suffix?: string
  hint?: string
  icon: KpiIconName
  color?: string
  trend?: KpiTrend
  trendLabel?: string
  spark?: number[]
  index?: number
  action?: ReactNode
}) {
  const trendClass =
    trend === 'up'
      ? 'bg-viz-green/15 text-viz-lime'
      : trend === 'down'
        ? 'bg-viz-red/15 text-viz-red'
        : 'bg-viz-amber/15 text-viz-amber'

  const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'

  return (
    <Reveal index={index}>
      <Card className="relative h-full p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[11.5px] font-medium text-txt-dim">{label}</span>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2"
            style={{ color }}
          >
            <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {KPI_ICONS[icon]}
            </svg>
          </span>
        </div>

        {valueText !== undefined ? (
          <div className="mb-0.5 mt-3 truncate text-[19px] font-bold leading-tight tracking-[-0.02em]" title={valueText}>
            {valueText}
          </div>
        ) : (
          <div className="tabular mb-0.5 mt-3 text-[30px] font-bold leading-none tracking-[-0.03em] sm:text-[33px]">
            <AnimatedCounter value={value ?? 0} delay={280 + index * 90} />
            {suffix && <span className="ml-0.5 text-[18px] text-txt-dim">{suffix}</span>}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          {hint && <span className="min-w-0 truncate text-[10.5px] text-txt-faint">{hint}</span>}
          {trend && trendLabel && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10.5px] font-bold',
                trendClass,
              )}
            >
              {arrow} {trendLabel}
            </span>
          )}
          {action}
        </div>

        {spark && spark.length > 1 && (
          <Sparkline
            data={spark}
            color={color}
            area
            delay={460 + index * 90}
            className="pointer-events-none absolute bottom-0 right-0 h-[46px] w-[55%] opacity-55"
          />
        )}
      </Card>
    </Reveal>
  )
}
