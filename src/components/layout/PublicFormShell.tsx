import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppBackground } from './AppBackground'
import { ThemeToggle } from '../theme/ThemeToggle'
import { SkeletonCard } from '../ui/Skeleton'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { Button } from '../ui/Button'
import { BotaoInstalar, ConviteInstalacao } from '../pwa/InstalarApp'
import { Logo } from '../ui/Logo'
import { useAuthStore } from '../../store/authStore'
import { useEntranceMotion } from '../../lib/motion'

const NovoFormulario = lazy(() =>
  import('../../pages/NovoFormulario').then((m) => ({ default: m.NovoFormulario })),
)

function MicrosoftLogo({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 21 21" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

/**
 * Tela inicial do sistema: a ficha técnica, aberta e sem login.
 *
 * A maioria dos colaboradores não tem e-mail corporativo, então exigir login
 * na entrada bloquearia justamente quem preenche a ficha. O acesso à área
 * administrativa fica num painel que abre aqui mesmo, no cabeçalho.
 */
export function PublicFormShell() {
  const entrarComMicrosoft = useAuthStore((s) => s.entrarComMicrosoft)
  const { reduce } = useEntranceMotion()

  const [painelAberto, setPainelAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function onMicrosoft() {
    setErro('')
    setCarregando(true)
    try {
      await entrarComMicrosoft()
      // Em caso de sucesso o navegador é redirecionado para a Microsoft;
      // o `finally` abaixo só roda se algo impedir o redirecionamento.
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar com a Microsoft.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <AppBackground />

      <div className="relative z-10 min-h-screen">
        <header
          className="safe-top sticky top-0 z-30 border-b border-hairline backdrop-blur-xl"
          style={{ background: 'var(--sidebar-bg)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-3 sm:px-6 lg:px-8">
            <Logo className="h-9 w-9 shrink-0" withWordmark />
            <div className="ml-auto flex items-center gap-2">
              <BotaoInstalar />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPainelAberto((v) => !v)}
                aria-expanded={painelAberto}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span className="hidden sm:inline">Área administrativa</span>
                <span className="sm:hidden">Entrar</span>
              </Button>
            </div>
          </div>

          {painelAberto && (
            <motion.div
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden border-t border-hairline"
            >
              <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="glass p-5">
                  <span className="chip">Acesso corporativo</span>
                  <h2 className="mt-3 text-[17px] font-bold tracking-[-0.02em] text-txt">
                    Entrar na área administrativa
                  </h2>
                  <p className="mt-1 text-[12.5px] text-txt-dim">
                    Use sua conta Microsoft da Normatel. Só a equipe de gestão precisa entrar. A
                    ficha ao lado pode ser preenchida sem login.
                  </p>

                  {erro && (
                    <p
                      role="alert"
                      className="mt-4 rounded-md border border-viz-red/25 bg-viz-red/10 px-3 py-2 text-[12.5px] text-viz-red"
                    >
                      {erro}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      size="lg"
                      className="h-12 w-full sm:w-auto sm:min-w-[15rem] sm:flex-1"
                      onClick={onMicrosoft}
                      disabled={carregando}
                    >
                      <MicrosoftLogo />
                      {carregando ? 'Redirecionando…' : 'Entrar com Microsoft'}
                    </Button>
                    <Link
                      to="/login"
                      className="text-[12px] font-medium text-txt-dim underline-offset-4 hover:text-txt hover:underline"
                    >
                      Entrar com e-mail e senha
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </header>

        <main className="px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-5">
            <Suspense fallback={<SkeletonCard />}>
              <ErrorBoundary>
                <NovoFormulario />
              </ErrorBoundary>
            </Suspense>
            <ConviteInstalacao />
          </div>
        </main>

        <footer className="safe-bottom px-4 pb-8 text-center text-[11px] text-txt-faint">
          Normatel Engenharia · Ficha Técnica de Avaliação de Serviços
        </footer>
      </div>
    </>
  )
}
