import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { VIZ } from '../../lib/chartTheme'

export interface BarSeries {
  label: string
  key: string
  from: string
  to: string
}

export interface BarRow {
  name: string
  /** Um valor por série, na mesma ordem de `series`. */
  [key: string]: string | number
}

const SERIES_PADRAO: BarSeries[] = [
  { label: 'Fichas', key: 'valor', from: VIZ.teal, to: VIZ.green },
]

/**
 * Gráfico de barras horizontais em HTML/CSS, com o mesmo desenho do gráfico do
 * organograma (que usa Recharts).
 *
 * Feito à mão de propósito: o app não tem Recharts nas dependências, e trazer
 * uma biblioteca de gráficos só para duas barras custaria mais no bundle — que
 * aqui roda offline no celular — do que o componente inteiro. Barras em `%` de
 * largura também são naturalmente responsivas, sem `ResponsiveContainer`.
 */
export function BarsChart({
  rows,
  series = SERIES_PADRAO,
  labelWidth = 'w-[92px] sm:w-[130px]',
}: {
  rows: BarRow[]
  series?: BarSeries[]
  labelWidth?: string
}) {
  const reduce = useReducedMotion()
  const [grown, setGrown] = useState(reduce)

  useEffect(() => {
    if (reduce) {
      setGrown(true)
      return
    }
    const t = window.setTimeout(() => setGrown(true), 90)
    return () => window.clearTimeout(t)
  }, [reduce])

  if (rows.length === 0) {
    return <p className="py-8 text-center text-[12px] text-txt-faint">Nenhum dado disponível</p>
  }

  const max = Math.max(
    1,
    ...rows.flatMap((r) => series.map((s) => Number(r[s.key] ?? 0))),
  )

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {rows.map((row, i) => (
          <li key={row.name} className="flex items-center gap-2.5 sm:gap-3">
            <span
              className={`${labelWidth} shrink-0 truncate text-right text-[11.5px] text-txt-dim`}
              title={row.name}
            >
              {row.name}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              {series.map((s, si) => {
                const valor = Number(row[s.key] ?? 0)
                if (series.length > 1 && valor === 0) return null
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className="h-[13px] min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-2">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: grown ? `${Math.max(valor > 0 ? 2 : 0, (valor / max) * 100)}%` : '0%',
                          background: `linear-gradient(90deg, ${s.from}, ${s.to})`,
                          transition: 'width 0.95s cubic-bezier(0.22,0.75,0.28,1)',
                          transitionDelay: `${i * 70 + si * 110}ms`,
                        }}
                        title={`${s.label}: ${valor}`}
                      />
                    </div>
                    <span className="tabular w-8 shrink-0 text-right text-[11.5px] font-bold">{valor}</span>
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ul>

      {series.length > 1 && (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[11px] text-txt-dim">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
