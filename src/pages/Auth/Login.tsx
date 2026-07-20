import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { Input } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import { ADMIN_SEED_EMAIL, ADMIN_SEED_SENHA } from '../../lib/auth'

export function Login() {
  const entrar = useAuthStore((s) => s.entrar)
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await entrar(email, senha, lembrar)
      toast({ variant: 'success', title: 'Login realizado com sucesso' })
      const destino = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destino, { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout title="Acessar o sistema" subtitle="Entre com suas credenciais para continuar">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seuemail@empresa.com"
        />
        <div className="relative">
          <Input
            label="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-3 top-[38px] text-ink-subtle transition-colors hover:text-ink"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.5 3.5M6.5 6.7C4.4 8.1 2.9 10 2 12c1.6 3.6 5.4 7 10 7 1.6 0 3.1-.4 4.4-1.1M9.9 4.2A9.9 9.9 0 0112 4c4.6 0 8.4 3.4 10 7-.5 1.1-1.1 2.1-1.9 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12c1.6-3.6 5.4-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.4 7-10 7s-8.4-3.4-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
              className="h-4 w-4 rounded border-border-light bg-surface-2 accent-brand-600"
            />
            Lembrar acesso
          </label>
          <Link to="/esqueci-senha" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Esqueci minha senha
          </Link>
        </div>

        {erro && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300" role="alert">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={carregando}>
          Entrar
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-medium text-brand-400 hover:text-brand-300">
            Ir para cadastro
          </Link>
        </p>

        <p className="text-center text-xs text-ink-subtle">
          Acesso administrador padrão: {ADMIN_SEED_EMAIL} / {ADMIN_SEED_SENHA}
        </p>
      </form>
    </AuthLayout>
  )
}
