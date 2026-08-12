import { FilaAprovacao, UsuariosComAcesso } from './AcessosCompartilhados'

/**
 * Usuários da área administrativa.
 *
 * Duas seções, um único cadastro: a fila do que exige decisão e a lista de quem
 * tem acesso. Tudo vem da tabela `solicitacoes_acesso` no Supabase, então é a
 * mesma informação em qualquer aparelho.
 *
 * A tabela de contas locais de e-mail e senha saiu daqui: ela vivia no
 * IndexedDB, era diferente em cada navegador, e virou duas listas de usuário na
 * mesma tela. Entrar no sistema agora é só pela conta Microsoft.
 */
export function Usuarios() {
  return (
    <div className="space-y-5">
      <div>
        <span className="chip">Área administrativa</span>
        <h2 className="mt-2 text-[22px] font-bold tracking-[-0.025em] text-txt sm:text-[27px]">Usuários</h2>
        <p className="mt-1 text-[13px] text-txt-dim">
          Quem entra com a conta Microsoft e ainda não tem acesso aparece na fila. Aprovar libera no
          login seguinte.
        </p>
      </div>

      <FilaAprovacao />

      <UsuariosComAcesso />
    </div>
  )
}
