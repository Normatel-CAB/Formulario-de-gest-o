import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Número que sobe de 0 até o valor final com ease-out — o efeito dos KPIs do
 * organograma. Respeita prefers-reduced-motion (mostra o valor final direto).
 */
export function AnimatedCounter({
  value,
  duration = 1300,
  delay = 0,
  suffix,
  className,
}: {
  value: number
  duration?: number
  delay?: number
  suffix?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    let start: number | null = null
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (start === null) start = now
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setShown(Math.round(value * eased))
        if (p < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }, delay)

    return () => {
      window.clearTimeout(timer)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration, delay, reduce])

  return (
    <span className={className}>
      {shown.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}
