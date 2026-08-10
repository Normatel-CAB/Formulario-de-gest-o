import type { FormStatus } from './types'

/**
 * Paleta única de visualização de dados — a mesma do organograma
 * (`src/lib/chart-theme.ts` lá). Todo gráfico, sparkline e barra de tabela tira
 * cor daqui, para os dois sistemas continuarem falando a mesma língua visual.
 *
 * Os valores existem também como custom properties em index.css (--viz-green
 * etc). Aqui ficam literais porque gradientes em <defs> de SVG precisam da cor
 * já resolvida.
 */
export const VIZ = {
  green: '#4CAF50',
  lime: '#8BC34A',
  teal: '#23C4A0',
  amber: '#F0B429',
  red: '#F2645F',
  deep: '#2E7D32',
  slate: '#8AA08E',
} as const

/** Sequência para séries sem significado semântico (lotações, meses…). */
export const VIZ_SERIES: Array<{ from: string; to: string }> = [
  { from: VIZ.lime, to: VIZ.green },
  { from: VIZ.green, to: VIZ.teal },
  { from: VIZ.teal, to: '#2F9E8F' },
  { from: VIZ.amber, to: '#D89412' },
  { from: VIZ.red, to: '#C9463F' },
  { from: VIZ.lime, to: '#5CA85F' },
]

export function serieAt(i: number) {
  return VIZ_SERIES[i % VIZ_SERIES.length]
}

/** Cor por status da ficha — usada em KPIs, donut, badges e gráficos. */
export const STATUS_COLOR: Record<FormStatus, string> = {
  rascunho: VIZ.slate,
  enviado: VIZ.teal,
  em_analise: VIZ.amber,
  aprovado: VIZ.green,
  reprovado: VIZ.red,
}
