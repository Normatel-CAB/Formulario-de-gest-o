import { useEffect, useRef } from 'react'

const SIZE = 460 // diâmetro da área iluminada
const HALF = SIZE / 2

/**
 * Faz a grade do fundo acender ao redor do cursor.
 *
 * COMO FUNCIONA (e por que assim): em vez de mascarar uma camada do tamanho da
 * tela inteira — que obriga o navegador a repintar tudo a cada frame — só um
 * quadrado de 460px acompanha o mouse via `transform`, que é trabalho de
 * compositor. A grade de dentro recebe um `background-position` que desconta o
 * deslocamento, então as linhas continuam alinhadas com a grade estática do
 * fundo em vez de viajarem junto com o holofote.
 */
export function GridSpotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respeita quem pediu menos movimento no sistema.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Sem cursor (celular/tablet) o efeito não faz sentido e só custaria bateria.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let x = 0
    let y = 0
    let queued = false

    const paint = () => {
      queued = false
      el.style.setProperty('--x', `${x}px`)
      el.style.setProperty('--y', `${y}px`)
      el.style.setProperty('--bgx', `${HALF - x}px`)
      el.style.setProperty('--bgy', `${HALF - y}px`)
    }

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      el.style.setProperty('--o', '1')
      if (!queued) {
        queued = true
        requestAnimationFrame(paint)
      }
    }

    const onLeave = () => el.style.setProperty('--o', '0')

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className="grid-spotlight" aria-hidden>
      <div className="grid-spotlight-inner" />
    </div>
  )
}
