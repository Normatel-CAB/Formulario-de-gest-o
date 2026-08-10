import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Barra de proporção que cresce dentro da linha da tabela — a animação-assinatura
 * do design system. Começa em 0 e só recebe a largura final depois da montagem,
 * senão o CSS não tem de onde animar. Precisa ficar dentro de uma célula
 * (`<TableCell>` já é `relative`).
 *
 * `pct` de 0 a 100; `from`/`to` são as duas pontas do gradiente — use os tokens
 * de `VIZ` em `lib/chartTheme.ts`.
 */
export function RowBar({
  pct,
  from,
  to,
  delay = 0,
}: {
  pct: number
  from: string
  to: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  const [w, setW] = useState(0)
  const target = Math.max(0, Math.min(100, pct))

  useEffect(() => {
    if (reduce) {
      setW(target)
      return
    }
    const t = window.setTimeout(() => setW(target), 60 + delay)
    return () => window.clearTimeout(t)
  }, [target, delay, reduce])

  return (
    <span
      aria-hidden
      className="row-bar"
      style={{ width: `${w}%`, background: `linear-gradient(90deg, ${from}33, ${to}0D)` }}
    />
  )
}
