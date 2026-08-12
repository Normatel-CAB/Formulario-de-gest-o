import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'

/**
 * Tela que a conta Microsoft vê enquanto não foi aprovada.
 *
 * A solicitação já foi criada sozinha no login, então aqui não há formulário
 * nenhum: só o estado do pedido e um jeito de reconsultar. Enquanto espera, a
 * pessoa continua podendo preencher a ficha, que é pública.
 */
export function AcessoPendente() {
  const acesso = useAuthStore((s) => s.acesso)
  const usuario = useAuthStore((s) => s.usuario)
  const reverificar = useAuthStore((s) => s.reverificarAcesso)
  const sair = useAuthStore((s) => s.sair)
  const [verificando, setVerificando] = useState(false)

  // Aprovado no meio do caminho, ou chegou aqui sem pedido nenhum: nada a mostrar.
  if (usuario) return <Navigate to="/dashboard" replace />
  if (!acesso) return <Navigate to="/login" replace />

  const rejeitado = acesso.estado === 'rejeitado'

  async function verificarAgora() {
    setVerificando(true)
    try {
      await reverificar()
    } finally {
      setVerificando(false)
    }
  }

  return (
    <AuthLayout
      title={rejeitado ? 'Acesso não autorizado' : 'Solicitação enviada'}
      subtitle={
        rejeitado
          ? 'Um administrador recusou este acesso.'
          : 'Seu pedido de acesso foi registrado e está na fila de aprovação.'
      }
    >
      <div
        className={`rounded-md border px-3 py-3 text-[12.5px] ${
          rejeitado
            ? 'border-viz-red/25 bg-viz-red/10 text-viz-red'
            : 'border-viz-amber/25 bg-viz-amber/10 text-viz-amber'
        }`}
        role="status"
      >
        {acesso.mensagem}
      </div>

      {!rejeitado && (
        <ol className="mt-5 grid gap-2.5">
          {[
            'Sua conta Microsoft foi autenticada com sucesso',
            'A solicitação de acesso já está registrada, você não precisa fazer nada',
            'Um administrador aprova e o acesso libera no próximo login',
          ].map((passo, i) => (
            <li key={i} className="flex gap-3 text-[12px] text-txt-dim">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-hairline bg-surface-2 text-[10px] font-bold text-txt">
                {i + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid gap-2">
        {!rejeitado && (
          <Button onClick={verificarAgora} loading={verificando} className="w-full">
            Verificar novamente
          </Button>
        )}
        <Link to="/" className="contents">
          <Button variant="outline" className="w-full">
            Preencher uma ficha técnica
          </Button>
        </Link>
        <Button variant="ghost" className="w-full" onClick={sair}>
          Sair desta conta
        </Button>
      </div>

      <p className="mt-5 text-center text-[11px] text-txt-faint">
        Precisa de acesso com urgência? Fale com a equipe de gestão informando seu e-mail corporativo.
      </p>
    </AuthLayout>
  )
}
