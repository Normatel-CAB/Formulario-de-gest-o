import { GridSpotlight } from './GridSpotlight'

/**
 * Camadas de fundo do app: halos radiais + grade sutil que desaparece para baixo,
 * mais dois orbes desfocados. Tudo decorativo (pointer-events: none) e fixo,
 * então não interfere no scroll do conteúdo.
 *
 * O <GridSpotlight> é a única parte interativa: acende a grade ao redor do cursor.
 */
export function AppBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 transition-[background] duration-500"
          style={{
            background: `
              radial-gradient(900px 520px at 12% -8%,  var(--halo-1), transparent 62%),
              radial-gradient(800px 500px at 88% 4%,   var(--halo-2), transparent 60%),
              radial-gradient(1100px 700px at 60% 108%, var(--halo-3), transparent 66%),
              var(--bg)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--grid) 1px, transparent 1px)
            `,
            backgroundSize: '104px 104px',
            maskImage: 'linear-gradient(180deg, #000 0%, transparent 78%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 78%)',
          }}
        />
      </div>

      {/* PERFORMANCE: os orbes são estáticos.
          Um círculo de 460px com blur(90px) gera uma textura enorme; animá-lo em
          loop obriga o compositor a refazer essa camada continuamente e é uma
          das causas de scroll engasgado. Parados, rasterizam uma vez. */}
      <div
        className="pointer-events-none fixed -top-40 left-[10%] z-0 h-[460px] w-[460px] rounded-full bg-brand opacity-[0.16] blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-32 z-0 h-[380px] w-[380px] rounded-full bg-viz-teal opacity-[0.12] blur-[90px]"
        aria-hidden
      />

      <GridSpotlight />
    </>
  )
}
