import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Dialog } from '../../components/ui/Dialog'
import { Reveal } from '../../components/ui/Reveal'
import { useSolicitacoesStore } from '../../store/solicitacoesStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import { PAPEL_LABELS, PROJETOS_PADRAO, type Papel } from '../../lib/types'
import type { SolicitacaoAcesso } from '../../lib/acesso'
import { formatarDataHora } from '../../lib/format'

/**
 * Diretório de acessos à área administrativa.
 *
 * É a única lista de contas compartilhada entre aparelhos. A tabela "Usuários"
 * logo abaixo lê o IndexedDB, que é local: quem entrou pelo próprio celular
 * criou a conta lá e nunca apareceu para o administrador. Aqui aparece.
 *
 * As linhas nascem sozinhas quando alguém entra com a Microsoft. O administrador
 * decide, muda o papel depois se precisar, e pode cadastrar um e-mail já
 * aprovado — que é como se libera quem entrou antes desta tela existir.
 */
export function SolicitacoesAcesso() {
  const { solicitacoes, loading, erro, carregar, aprovar, rejeitar, reabrir, cadastrar } =
    useSolicitacoesStore()
  const usuario = useAuthStore((s) => s.usuario)

  const [papeis, setPapeis] = useState<Record<string, Papel>>({})
  const [projetos, setProjetos] = useState<Record<string, string>>({})
  const [processando, setProcessando] = useState<string | null>(null)
  const [rejeitando, setRejeitando] = useState<SolicitacaoAcesso | null>(null)
  const [motivo, setMotivo] = useState('')

  const [cadastroAberto, setCadastroAberto] = useState(false)
  const [novoEmail, setNovoEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState<Papel>('visualizador')
  const [novoProjeto, setNovoProjeto] = useState('')

  useEffect(() => {
    void carregar()
  }, [carregar])

  const pendentes = useMemo(() => solicitacoes.filter((s) => s.status === 'pendente'), [solicitacoes])
  const aprovados = useMemo(() => solicitacoes.filter((s) => s.status === 'aprovado'), [solicitacoes])
  const recusados = useMemo(() => solicitacoes.filter((s) => s.status === 'rejeitado'), [solicitacoes])

  const decididoPor = usuario?.email ?? 'administrador'
  const papelDe = (s: SolicitacaoAcesso) => papeis[s.id] ?? s.papel ?? 'visualizador'
  const projetoDe = (s: SolicitacaoAcesso) => projetos[s.id] ?? s.projeto ?? ''

  async function comAviso(id: string, acao: () => Promise<void>, titulo: string) {
    setProcessando(id)
    try {
      await acao()
      toast({ variant: 'success', title: titulo })
    } catch (err) {
      toast({ variant: 'error', title: 'Não foi possível concluir', description: mensagem(err) })
    } finally {
      setProcessando(null)
    }
  }

  async function onCadastrar() {
    setProcessando('novo')
    try {
      await cadastrar(novoEmail, novoPapel, novoProjeto, decididoPor)
      toast({
        variant: 'success',
        title: 'Acesso liberado',
        description: `${novoEmail.trim().toLowerCase()} entra no próximo login.`,
      })
      setCadastroAberto(false)
      setNovoEmail('')
      setNovoPapel('visualizador')
      setNovoProjeto('')
    } catch (err) {
      toast({ variant: 'error', title: 'Não foi possível liberar', description: mensagem(err) })
    } finally {
      setProcessando(null)
    }
  }

  return (
    <Reveal index={0}>
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Acessos à área administrativa</CardTitle>
            <CardDescription>
              Lista compartilhada entre aparelhos. As linhas nascem sozinhas quando alguém entra com a
              conta Microsoft.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pendentes.length > 0 && <Badge tone="amber">{pendentes.length} pendente(s)</Badge>}
            <Button variant="outline" size="sm" onClick={() => setCadastroAberto(true)}>
              Liberar e-mail
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void carregar()} loading={loading}>
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {erro && (
            <div className="rounded-md border border-viz-red/25 bg-viz-red/10 px-3 py-3 text-[12px] text-viz-red">
              <p className="font-semibold">Não foi possível carregar a lista.</p>
              <p className="mt-1 leading-relaxed">{erro}</p>
              <p className="mt-2 text-[11px] opacity-80">
                Se a mensagem fala de tabela inexistente, rode as migrações 002 e 003 de
                <code className="mx-1 rounded bg-black/20 px-1">supabase/migrations</code>
                no SQL Editor do Supabase.
              </p>
            </div>
          )}

          {/* ---------------- Pendentes ---------------- */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
              Aguardando aprovação
            </p>
            {pendentes.length === 0 && !loading && (
              <p className="rounded-md border border-hairline bg-surface-2 px-3 py-3 text-[12px] text-txt-faint">
                Nenhum pedido na fila. Quem já entrava antes desta tela existir não aparece aqui até
                fazer login de novo — use <b className="font-semibold">Liberar e-mail</b> para
                adiantar.
              </p>
            )}
            <div className="grid gap-2">
              {pendentes.map((s) => (
                <LinhaDecisao
                  key={s.id}
                  s={s}
                  papel={papelDe(s)}
                  projeto={projetoDe(s)}
                  onPapel={(p) => setPapeis((v) => ({ ...v, [s.id]: p }))}
                  onProjeto={(p) => setProjetos((v) => ({ ...v, [s.id]: p }))}
                  processando={processando === s.id}
                  acoes={
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejeitando(s)
                          setMotivo('')
                        }}
                        disabled={processando === s.id}
                      >
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        loading={processando === s.id}
                        onClick={() =>
                          void comAviso(
                            s.id,
                            () => aprovar(s.id, papelDe(s), projetoDe(s), decididoPor),
                            `${s.nome || s.email} aprovado`,
                          )
                        }
                      >
                        Aprovar
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </section>

          {/* ---------------- Aprovados ---------------- */}
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
              Com acesso liberado ({aprovados.length})
            </p>
            {aprovados.length === 0 && !loading && (
              <p className="text-[12px] text-txt-faint">Ninguém liberado ainda.</p>
            )}
            <div className="grid gap-2">
              {aprovados.map((s) => (
                <LinhaDecisao
                  key={s.id}
                  s={s}
                  papel={papelDe(s)}
                  projeto={projetoDe(s)}
                  onPapel={(p) => setPapeis((v) => ({ ...v, [s.id]: p }))}
                  onProjeto={(p) => setProjetos((v) => ({ ...v, [s.id]: p }))}
                  processando={processando === s.id}
                  acoes={
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejeitando(s)
                          setMotivo('')
                        }}
                        disabled={processando === s.id}
                      >
                        Revogar
                      </Button>
                      {/* O papel só muda de verdade quando salvo: mexer no select
                          sem confirmar não deve alterar permissão de ninguém. */}
                      <Button
                        variant="outline"
                        size="sm"
                        loading={processando === s.id}
                        disabled={papelDe(s) === s.papel && projetoDe(s) === s.projeto}
                        onClick={() =>
                          void comAviso(
                            s.id,
                            () => aprovar(s.id, papelDe(s), projetoDe(s), decididoPor),
                            'Permissão atualizada',
                          )
                        }
                      >
                        Salvar
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </section>

          {/* ---------------- Recusados ---------------- */}
          {recusados.length > 0 && (
            <section>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
                Recusados ({recusados.length})
              </p>
              <ul className="grid gap-1.5">
                {recusados.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] transition-colors hover:bg-surface-2"
                  >
                    <Badge tone="rose">Recusado</Badge>
                    <span className="min-w-0 flex-1 truncate text-txt-dim">{s.email}</span>
                    {s.observacao && (
                      <span className="truncate text-txt-faint" title={s.observacao}>
                        {s.observacao}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={processando === s.id}
                      onClick={() => void comAviso(s.id, () => reabrir(s.id), 'Solicitação reaberta')}
                    >
                      Reabrir
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </CardContent>

        {/* ---------------- Recusar / revogar ---------------- */}
        <Dialog
          open={Boolean(rejeitando)}
          onClose={() => setRejeitando(null)}
          title={rejeitando?.status === 'aprovado' ? 'Revogar acesso' : 'Recusar solicitação'}
          description={rejeitando?.email}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRejeitando(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={Boolean(processando)}
                onClick={() => {
                  if (!rejeitando) return
                  void comAviso(
                    rejeitando.id,
                    () => rejeitar(rejeitando.id, motivo, decididoPor),
                    'Acesso removido',
                  ).then(() => setRejeitando(null))
                }}
              >
                {rejeitando?.status === 'aprovado' ? 'Revogar' : 'Recusar'}
              </Button>
            </>
          }
        >
          <Textarea
            label="Motivo (opcional)"
            hint="A pessoa vê este texto ao tentar entrar."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: conta não pertence à equipe de gestão"
          />
        </Dialog>

        {/* ---------------- Liberar e-mail ---------------- */}
        <Dialog
          open={cadastroAberto}
          onClose={() => setCadastroAberto(false)}
          title="Liberar acesso por e-mail"
          description="Para quem já usava o sistema e não apareceu na fila."
          footer={
            <>
              <Button variant="ghost" onClick={() => setCadastroAberto(false)}>
                Cancelar
              </Button>
              <Button
                loading={processando === 'novo'}
                disabled={!novoEmail.trim()}
                onClick={() => void onCadastrar()}
              >
                Liberar acesso
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Input
              label="E-mail corporativo"
              type="email"
              required
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="nome.sobrenome@normatel.com.br"
              hint="Precisa ser o mesmo e-mail da conta Microsoft da pessoa."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Papel" value={novoPapel} onChange={(e) => setNovoPapel(e.target.value as Papel)}>
                {(Object.keys(PAPEL_LABELS) as Papel[]).map((papel) => (
                  <option key={papel} value={papel}>
                    {PAPEL_LABELS[papel]}
                  </option>
                ))}
              </Select>
              <Select label="Projeto" value={novoProjeto} onChange={(e) => setNovoProjeto(e.target.value)}>
                <option value="">Todos os projetos</option>
                {PROJETOS_PADRAO.map((projeto) => (
                  <option key={projeto} value={projeto}>
                    {projeto}
                  </option>
                ))}
              </Select>
            </div>
            <p className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[11.5px] text-txt-faint">
              A pessoa entra direto no próximo login com a Microsoft, sem passar pela fila. Se o
              e-mail já estiver na lista, esta ação atualiza a decisão dele.
            </p>
          </div>
        </Dialog>
      </Card>
    </Reveal>
  )
}

/** Linha de um acesso, com os selects de papel e projeto e as ações à direita. */
function LinhaDecisao({
  s,
  papel,
  projeto,
  onPapel,
  onProjeto,
  processando,
  acoes,
}: {
  s: SolicitacaoAcesso
  papel: Papel
  projeto: string
  onPapel: (p: Papel) => void
  onProjeto: (p: string) => void
  processando: boolean
  acoes: React.ReactNode
}) {
  return (
    <div className="grid gap-3 rounded-md border border-hairline bg-surface-2 p-3 lg:grid-cols-[1fr_150px_180px_auto] lg:items-end">
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold">{s.nome || s.email.split('@')[0]}</p>
        <p className="truncate text-[11.5px] text-txt-dim">{s.email}</p>
        <p className="mt-0.5 text-[10.5px] text-txt-faint">
          {s.status === 'pendente'
            ? `Solicitado em ${formatarDataHora(s.criadoEm)}`
            : `Liberado em ${s.decididoEm ? formatarDataHora(s.decididoEm) : formatarDataHora(s.criadoEm)}`}
        </p>
      </div>

      <Select label="Papel" value={papel} onChange={(e) => onPapel(e.target.value as Papel)} disabled={processando}>
        {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
          <option key={p} value={p}>
            {PAPEL_LABELS[p]}
          </option>
        ))}
      </Select>

      <Select label="Projeto" value={projeto} onChange={(e) => onProjeto(e.target.value)} disabled={processando}>
        <option value="">Todos os projetos</option>
        {PROJETOS_PADRAO.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-2 lg:flex">{acoes}</div>
    </div>
  )
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : undefined
}
