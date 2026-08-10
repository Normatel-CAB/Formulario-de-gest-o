import { useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Curva suave (bézier com controles no meio) a partir de uma lista de pontos. */
export function smoothPath(pts: Array<[number, number]>) {
  if (pts.length === 0) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  return d
}

/**
 * Mini-gráfico de linha que se desenha na entrada (stroke-dashoffset).
 * Use dentro de KPIs e células de tabela para dar leitura de tendência.
 */
export function Sparkline({
  data,
  color,
  width = 120,
  height = 46,
  area = false,
  delay = 0,
  className,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
  area?: boolean
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const gid = useId().replace(/:/g, '')
  const pathRef = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(0)
  const [drawn, setDrawn] = useState(false)

  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const pad = area ? 6 : 3
  const pts: Array<[number, number]> = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * width,
    height - pad - ((v - min) / span) * (height - pad * 2 - 4),
  ])
  const line = smoothPath(pts)

  // Mede o comprimento real do traçado antes de animar. Sem essa medida o
  // dash-array sairia com valor chutado e a linha apareceria cortada.
  useEffect(() => {
    const measured = pathRef.current?.getTotalLength?.() ?? 0
    setLen(measured || 400)
  }, [line])

  useEffect(() => {
    if (!len) return
    if (reduce) {
      setDrawn(true)
      return
    }
    const t = window.setTimeout(() => setDrawn(true), delay)
    return () => window.clearTimeout(t)
  }, [len, delay, reduce])

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      {area && (
        <defs>
          <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.38} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {area && (
        <path
          d={`${line} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#sp-${gid})`}
          style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1.1s ease 0.35s' }}
        />
      )}
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={area ? 2 : 1.8}
        strokeLinecap="round"
        style={{
          strokeDasharray: len || undefined,
          strokeDashoffset: len && !drawn ? len : 0,
          opacity: len ? 1 : 0,
          transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,0.75,0.28,1)',
        }}
      />
    </svg>
  )
}
