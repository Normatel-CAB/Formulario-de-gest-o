import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'

/**
 * Entrada na área administrativa: só conta Microsoft.
 *
 * O formulário de e-mail e senha saiu daqui junto com as contas locais. Elas
 * viviam no IndexedDB de cada navegador, então a mesma pessoa tinha cadastros
 * diferentes em cada aparelho — e a tela exibia, em texto e num endereço
 * público, o usuário e a senha da conta semente de administrador.
 *
 * Quem não tem acesso ainda entra normalmente, gera a solicitação sozinho e cai
 * na tela de espera.
 */
export function Login() {
  const acesso = useAuthStore((s) => s.acesso)
  const entrarComMicrosoft = useAuthStore((s) => s.entrarComMicrosoft)

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Voltou ao login com um pedido em aberto: a tela de espera é o lugar certo.
  if (acesso) return <Navigate to="/acesso" replace />

  async function onMicrosoft() {
    setErro('')
    setCarregando(true)
    try {
      await entrarComMicrosoft()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar com a Microsoft.')
      setCarregando(false)
    }
  }

  return (
    <AuthLayout title="Área administrativa" subtitle="Entre com sua conta Microsoft da Normatel.">
      {erro && (
        <p
          className="mb-5 rounded-md border border-viz-red/25 bg-viz-red/10 px-3 py-2 text-[12.5px] text-viz-red"
          role="alert"
        >
          {erro}
        </p>
      )}

      <Button type="button" size="lg" className="h-12 w-full" onClick={onMicrosoft} disabled={carregando}>
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 21 21" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
        {carregando ? 'Redirecionando…' : 'Entrar com Microsoft'}
      </Button>

      <div className="mt-6 rounded-md border border-hairline bg-surface-2 px-3 py-3">
        <p className="text-[11.5px] leading-relaxed text-txt-dim">
          Primeira vez? Entrar já registra seu pedido de acesso. Um administrador aprova e você entra
          no login seguinte.
        </p>
      </div>

      <p className="mt-5 text-center text-[11px] text-txt-faint">
        Para preencher uma ficha técnica não precisa de login.{' '}
        <Link to="/" className="font-medium text-txt-dim underline-offset-4 hover:text-txt hover:underline">
          Ir para a ficha
        </Link>
      </p>
    </AuthLayout>
  )
}
