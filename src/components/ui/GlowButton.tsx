import { type ButtonHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '../../lib/cn'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './Button'

/** Quanto o botão "persegue" o cursor, em px. Acima de ~8 vira caricatura. */
const PULL = 6

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/**
 * Botão com atração magnética e brilho que segue o cursor (o mesmo do login do
 * organograma).
 *
 * Tudo via variáveis CSS atualizadas dentro de requestAnimationFrame: uma
 * escrita de estilo por frame e nenhum re-render do React. Em telas de toque e
 * com "reduzir movimento" ligado, vira um botão comum.
 */
export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  { className, variant = 'primary', size = 'md', children, ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLButtonElement>(null)
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLButtonElement)

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let queued = false
    let mx = 0
    let my = 0
    let dx = 0
    let dy = 0

    const paint = () => {
      queued = false
      el.style.setProperty('--gx', `${mx}px`)
      el.style.setProperty('--gy', `${my}px`)
      el.style.setProperty('--dx', `${dx}px`)
      el.style.setProperty('--dy', `${dy}px`)
    }

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
      // -1..1 a partir do centro, limitado para o botão não fugir do lugar
      dx = ((mx - r.width / 2) / (r.width / 2)) * PULL
      dy = ((my - r.height / 2) / (r.height / 2)) * PULL
      if (!queued) {
        queued = true
        requestAnimationFrame(paint)
      }
    }

    const onEnter = () => el.style.setProperty('--glow', '1')
    const onLeave = () => {
      el.style.setProperty('--glow', '0')
      dx = 0
      dy = 0
      if (!queued) {
        queued = true
        requestAnimationFrame(paint)
      }
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <button ref={innerRef} className={cn(buttonClasses(variant, size), 'glow-btn', className)} {...props}>
      <span className="glow-btn-sheen" aria-hidden />
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </button>
  )
})
