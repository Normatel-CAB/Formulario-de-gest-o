import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeToggle } from '../../components/theme/ThemeToggle'
import { Logo } from '../../components/ui/Logo'
import { useEntranceMotion } from '../../lib/motion'

const destaques = [
  { label: 'Etapas', value: '4' },
  { label: 'Offline', value: 'Sim' },
  { label: 'Lotações', value: '6' },
]

/**
 * Duas colunas, como o login do organograma: à esquerda a peça de marca
 * (sempre escura, independente do tema), à direita o formulário no tema atual.
 */
export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { reduce } = useEntranceMotion()

  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.5, ease: 'easeOut' as const, delay },
  })

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* ---------------- Painel esquerdo (sempre escuro: é peça de marca) ---------------- */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-brand-deep p-12 lg:flex lg:w-1/2">
        {/* Halos estáticos — sem animação infinita, que é cara de compositar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-brand opacity-30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-16 h-[28rem] w-[28rem] rounded-full bg-viz-teal opacity-20 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div className="relative z-10 flex flex-col items-center" {...rise()}>
          <Logo className="mb-8 w-32 drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)]" />
          <div className="mb-10 text-center">
            <strong className="block text-[22px] font-bold tracking-[-0.02em] text-white">Normatel</strong>
            <span className="block text-[11px] uppercase tracking-[0.22em] text-white/50">Engenharia</span>
          </div>
          <p className="max-w-xs text-center text-[15px] font-light leading-relaxed text-white/70">
            Ficha Técnica de Avaliação de Serviços. Avaliação, necessidades e evidências em um só
            lugar.
          </p>

          <div className="mt-14 grid w-full max-w-xs grid-cols-3 gap-8">
            {destaques.map((item, i) => (
              <motion.div key={item.label} className="text-center" {...rise(0.25 + i * 0.1)}>
                <div className="tabular text-2xl font-semibold text-white">{item.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.09em] text-white/50">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---------------- Painel direito (segue o tema) ---------------- */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(700px 420px at 80% -10%, var(--halo-1), transparent 62%),
              radial-gradient(600px 400px at 10% 110%, var(--halo-3), transparent 60%),
              var(--bg)
            `,
          }}
        />

        <div className="absolute right-5 top-5 z-10">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-14 w-14" withWordmark />
          </div>

          <motion.div className="glass p-6 sm:p-7" {...rise(0.1)}>
            <span className="chip">Sistema de Gestão Integrada</span>
            <h1 className="mb-1 mt-3 text-[24px] font-bold tracking-[-0.025em] text-txt">{title}</h1>
            {subtitle && <p className="mb-6 text-[13px] text-txt-dim">{subtitle}</p>}
            {children}
          </motion.div>

          <p className="mt-6 text-center text-[11px] text-txt-faint">
            <Link to="/" className="font-medium text-txt-dim underline-offset-4 hover:text-txt hover:underline">
              Voltar para a ficha técnica
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
