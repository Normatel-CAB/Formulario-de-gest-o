import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useEntranceMotion } from '../../lib/motion'

/**
 * Envelope de entrada em cascata. Use `index` para escalonar os elementos de uma
 * mesma seção (0, 1, 2…) — é o que produz o efeito de conteúdo "chegando", em
 * vez de tudo aparecer de uma vez.
 */
export function Reveal({
  children,
  index = 0,
  step = 0.07,
  base = 0.05,
  className,
}: {
  children: ReactNode
  index?: number
  step?: number
  base?: number
  className?: string
}) {
  const { fadeInUp } = useEntranceMotion()
  return (
    <motion.div className={className} {...fadeInUp(base + index * step)}>
      {children}
    </motion.div>
  )
}
