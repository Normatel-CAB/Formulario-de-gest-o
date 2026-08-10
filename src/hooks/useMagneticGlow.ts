import { useEffect, useRef } from 'react'

/** Quanto o botão "persegue" o cursor, em px. Acima de ~8 vira caricatura. */
const PULL = 6

/**
 * Atração magnética + brilho que segue o cursor, para os botões da marca.
 *
 * Dois efeitos somados:
 *  1. magnético — o botão desliza alguns pixels na direção do ponteiro e volta
 *     ao lugar quando ele sai;
 *  2. brilho — um halo radial acompanha a posição do mouse dentro do botão,
 *     mais um anel externo que acende no hover (ver `.glow-btn` no index.css).
 *
 * Tudo por variáveis CSS escritas dentro de requestAnimationFrame: uma escrita
 * de estilo por frame e nenhum re-render do React — com vários botões na tela
 * isso é a diferença entre 60fps e engasgo. Em telas de toque e com "reduzir
 * movimento" ligado o efeito não é registrado, e o botão fica comum.
 */
export function useMagneticGlow<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
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

    const agendar = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(paint)
    }

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
      // -1..1 a partir do centro, limitado para o botão não fugir do lugar
      dx = ((mx - r.width / 2) / (r.width / 2)) * PULL
      dy = ((my - r.height / 2) / (r.height / 2)) * PULL
      agendar()
    }

    const onEnter = () => el.style.setProperty('--glow', '1')
    const onLeave = () => {
      el.style.setProperty('--glow', '0')
      dx = 0
      dy = 0
      agendar()
    }

    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled])

  return ref
}
