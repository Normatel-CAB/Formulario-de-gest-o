import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Dialog } from '../../components/ui/Dialog'
import { Reveal } from '../../components/ui/Reveal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { useSolicitacoesStore } from '../../store/solicitacoesStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import { PAPEL_LABELS, PROJETOS_PADRAO, type Papel } from '../../lib/types'
import { emailDaSessaoSupabase, type SolicitacaoAcesso } from '../../lib/acesso'
import { formatarDataHora } from '../../lib/format'

/**
 * Acessos à área administrativa, guardados no Supabase.
 *
 * A tela é dividida em duas partes de propósito, porque são dois momentos
 * diferentes: a FILA é só o que exige decisão, e some da fila ao ser decidido.
 * Quem já tem acesso vive na LISTA DE USUÁRIOS, onde se ajusta papel e projeto.
 * Misturar os dois fazia o aprovado continuar aparecendo como se houvesse algo
 * pendente sobre ele.
 */

/** Estado compartilhado pelos dois blocos: carrega uma vez, usa nos dois. */
function useAcessos() {
  const store = useSolicitacoesStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [emailSessao, setEmailSessao] = useState<string | null>(null)
  const [sessaoVerificada, setSessaoVerificada] = useState(false)

  useEffect(() => {
    void store.carregar()
    void emailDaSessaoSupabase().then((email) => {
      setEmailSessao(email)
      setSessaoVerificada(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    ...store,
    decididoPor: usuario?.email ?? 'administrador',
    emailSessao,
    semSessaoSupabase: sessaoVerificada && !emailSessao,
  }
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : undefined
}

function AvisoSemSessao() {
  return (
    <div className="rounded-md border border-viz-amber/25 bg-viz-amber/10 px-3 py-3 text-[12px] text-viz-amber">
      <p className="font-semibold">Você não está autenticado no banco de dados.</p>
      <p className="mt-1 leading-relaxed">
        A sessão da interface e a sessão do Supabase são separadas. Sem a do Supabase, esta lista
        volta vazia e as ações falham, mesmo com as migrações aplicadas.
      </p>
      <p className="mt-2">
        Saia e entre de novo usando <b className="font-semibold">Entrar com Microsoft</b>.
      </p>
    </div>
  )
}

function AvisoErro({ erro }: { erro: string }) {
  return (
    <div className="rounded-md border border-viz-red/25 bg-viz-red/10 px-3 py-3 text-[12px] text-viz-red">
      <p className="font-semibold">Não foi possível carregar.</p>
      <p className="mt-1 leading-relaxed">{erro}</p>
      <p className="mt-2 text-[11px] opacity-80">
        Se a mensagem fala de tabela inexistente, rode as migrações de
        <code className="mx-1 rounded bg-black/20 px-1">supabase/migrations</code>
        no SQL Editor do Supabase.
      </p>
    </div>
  )
}

/* ==========================================================================
   1) Fila de aprovação — só o que exige decisão
   ========================================================================== */
export function FilaAprovacao() {
  const { solicitacoes, loading, erro, carregar, aprovar, rejeitar, reabrir, semSessaoSupabase, decididoPor } =
    useAcessos()

  const [papeis, setPapeis] = useState<Record<string, Papel>>({})
  const [projetos, setProjetos] = useState<Record<string, string>>({})
  const [processando, setProcessando] = useState<string | null>(null)
  const [recusando, setRecusando] = useState<SolicitacaoAcesso | null>(null)
  const [motivo, setMotivo] = useState('')

  const pendentes = useMemo(() => solicitacoes.filter((s) => s.status === 'pendente'), [solicitacoes])
  const recusados = useMemo(() => solicitacoes.filter((s) => s.status === 'rejeitado'), [solicitacoes])

  async function executar(id: string, acao: () => Promise<void>, titulo: string) {
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

  return (
    <Reveal index={0}>
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Solicitações de acesso</CardTitle>
            <CardDescription>
              Criadas sozinhas quando alguém entra com a conta Microsoft. Ao aprovar, a pessoa passa
              para a lista de usuários abaixo.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pendentes.length > 0 && <Badge tone="amber">{pendentes.length} pendente(s)</Badge>}
            <Button variant="ghost" size="sm" onClick={() => void carregar()} loading={loading}>
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {semSessaoSupabase && <AvisoSemSessao />}
          {erro && <AvisoErro erro={erro} />}

          {pendentes.length === 0 && !loading && !erro && (
            <p className="rounded-md border border-hairline bg-surface-2 px-3 py-3 text-[12px] text-txt-faint">
              Nenhuma solicitação aguardando decisão.
            </p>
          )}

          {pendentes.map((s) => {
            const papel = papeis[s.id] ?? 'visualizador'
            const projeto = projetos[s.id] ?? ''
            return (
              <div
                key={s.id}
                className="grid gap-3 rounded-md border border-hairline bg-surface-2 p-3 lg:grid-cols-[1fr_150px_180px_auto] lg:items-end"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold">{s.nome || s.email.split('@')[0]}</p>
                  <p className="truncate text-[11.5px] text-txt-dim">{s.email}</p>
                  <p className="mt-0.5 text-[10.5px] text-txt-faint">
                    Solicitado em {formatarDataHora(s.criadoEm)}
                  </p>
                </div>

                <Select
                  label="Papel"
                  value={papel}
                  onChange={(e) => setPapeis((v) => ({ ...v, [s.id]: e.target.value as Papel }))}
                  disabled={processando === s.id}
                >
                  {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
                    <option key={p} value={p}>
                      {PAPEL_LABELS[p]}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Projeto"
                  value={projeto}
                  onChange={(e) => setProjetos((v) => ({ ...v, [s.id]: e.target.value }))}
                  disabled={processando === s.id}
                >
                  <option value="">Todos os projetos</option>
                  {PROJETOS_PADRAO.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>

                <div className="grid grid-cols-2 gap-2 lg:flex">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={processando === s.id}
                    onClick={() => {
                      setRecusando(s)
                      setMotivo('')
                    }}
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    loading={processando === s.id}
                    onClick={() =>
                      void executar(
                        s.id,
                        () => aprovar(s.id, papel, projeto, decididoPor),
                        `${s.nome || s.email} aprovado`,
                      )
                    }
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            )
          })}

          {recusados.length > 0 && (
            <div className="border-t border-hairline pt-3">
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
                      <span className="hidden truncate text-txt-faint sm:block" title={s.observacao}>
                        {s.observacao}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={processando === s.id}
                      onClick={() => void executar(s.id, () => reabrir(s.id), 'Solicitação reaberta')}
                    >
                      Reabrir
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <Dialog
          open={Boolean(recusando)}
          onClose={() => setRecusando(null)}
          title="Recusar solicitação"
          description={recusando?.email}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRecusando(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={Boolean(processando)}
                onClick={() => {
                  if (!recusando) return
                  void executar(recusando.id, () => rejeitar(recusando.id, motivo, decididoPor), 'Solicitação recusada')
                    .then(() => setRecusando(null))
                }}
              >
                Recusar
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
      </Card>
    </Reveal>
  )
}

/* ==========================================================================
   2) Usuários com acesso — a lista de verdade, compartilhada
   ========================================================================== */
export function UsuariosComAcesso() {
  const { solicitacoes, loading, erro, aprovar, rejeitar, cadastrar, decididoPor, emailSessao } = useAcessos()

  const [papeis, setPapeis] = useState<Record<string, Papel>>({})
  const [projetos, setProjetos] = useState<Record<string, string>>({})
  const [processando, setProcessando] = useState<string | null>(null)
  const [revogando, setRevogando] = useState<SolicitacaoAcesso | null>(null)

  const [cadastroAberto, setCadastroAberto] = useState(false)
  const [novoEmail, setNovoEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState<Papel>('visualizador')
  const [novoProjeto, setNovoProjeto] = useState('')

  const aprovados = useMemo(
    () =>
      solicitacoes
        .filter((s) => s.status === 'aprovado')
        .sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email)),
    [solicitacoes],
  )

  const papelDe = (s: SolicitacaoAcesso) => papeis[s.id] ?? s.papel
  const projetoDe = (s: SolicitacaoAcesso) => projetos[s.id] ?? s.projeto

  /**
   * A própria conta não pode ser rebaixada nem revogada aqui.
   *
   * Sem isso, um administrador tira o próprio acesso com um clique e fica sem
   * ninguém para devolvê-lo — a recuperação exigiria SQL no painel do Supabase.
   */
  const ehVoce = (s: SolicitacaoAcesso) =>
    Boolean(emailSessao) && s.email.toLowerCase() === emailSessao?.toLowerCase()

  async function executar(id: string, acao: () => Promise<void>, titulo: string) {
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
    <Reveal index={1}>
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Usuários com acesso ({aprovados.length})</CardTitle>
            <CardDescription>
              Contas Microsoft liberadas. Esta lista é compartilhada entre todos os aparelhos.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCadastroAberto(true)}>
            Liberar e-mail
          </Button>
        </CardHeader>

        <CardContent>
          {erro && <AvisoErro erro={erro} />}

          {!erro && aprovados.length === 0 && !loading && (
            <p className="py-4 text-center text-[12px] text-txt-faint">
              Ninguém liberado ainda. Aprove uma solicitação acima, ou use <b>Liberar e-mail</b>.
            </p>
          )}

          {aprovados.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="hidden xl:table-cell">Projeto</TableHead>
                  <TableHead className="hidden lg:table-cell">Liberado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aprovados.map((s) => {
                  const sou = ehVoce(s)
                  const alterado = papelDe(s) !== s.papel || projetoDe(s) !== s.projeto
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="min-w-[9rem] font-semibold">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {s.nome || s.email.split('@')[0]}
                          {sou && <Badge tone="slate">você</Badge>}
                        </span>
                        <span className="block truncate text-[10.5px] font-normal text-txt-faint lg:hidden">
                          {s.email}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-txt-dim lg:table-cell">{s.email}</TableCell>
                      <TableCell>
                        <Select
                          value={papelDe(s)}
                          onChange={(e) => setPapeis((v) => ({ ...v, [s.id]: e.target.value as Papel }))}
                          disabled={sou || processando === s.id}
                          aria-label={`Papel de ${s.email}`}
                          className="min-w-[8.5rem]"
                        >
                          {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
                            <option key={p} value={p}>
                              {PAPEL_LABELS[p]}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Select
                          value={projetoDe(s)}
                          onChange={(e) => setProjetos((v) => ({ ...v, [s.id]: e.target.value }))}
                          disabled={sou || processando === s.id}
                          aria-label={`Projeto de ${s.email}`}
                          className="min-w-[10rem]"
                        >
                          <option value="">Todos os projetos</option>
                          {PROJETOS_PADRAO.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-txt-dim lg:table-cell">
                        {s.decididoEm ? formatarDataHora(s.decididoEm) : formatarDataHora(s.criadoEm)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            loading={processando === s.id}
                            disabled={sou || !alterado}
                            onClick={() =>
                              void executar(
                                s.id,
                                () => aprovar(s.id, papelDe(s), projetoDe(s), decididoPor),
                                'Permissão atualizada',
                              )
                            }
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-viz-red hover:bg-viz-red/10"
                            disabled={sou || processando === s.id}
                            title={sou ? 'Você não pode revogar o seu próprio acesso' : undefined}
                            onClick={() => setRevogando(s)}
                          >
                            Revogar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <Dialog
          open={Boolean(revogando)}
          onClose={() => setRevogando(null)}
          title="Revogar acesso"
          description={revogando?.email}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRevogando(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={Boolean(processando)}
                onClick={() => {
                  if (!revogando) return
                  void executar(
                    revogando.id,
                    () => rejeitar(revogando.id, 'Acesso revogado por um administrador.', decididoPor),
                    'Acesso revogado',
                  ).then(() => setRevogando(null))
                }}
              >
                Revogar acesso
              </Button>
            </>
          }
        >
          <p className="text-[12.5px] text-txt-dim">
            A pessoa perde o acesso no próximo carregamento do app e passa para a lista de recusados,
            de onde pode ser reaberta.
          </p>
        </Dialog>

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
              <Button loading={processando === 'novo'} disabled={!novoEmail.trim()} onClick={() => void onCadastrar()}>
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
                {(Object.keys(PAPEL_LABELS) as Papel[]).map((p) => (
                  <option key={p} value={p}>
                    {PAPEL_LABELS[p]}
                  </option>
                ))}
              </Select>
              <Select label="Projeto" value={novoProjeto} onChange={(e) => setNovoProjeto(e.target.value)}>
                <option value="">Todos os projetos</option>
                {PROJETOS_PADRAO.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Dialog>
      </Card>
    </Reveal>
  )
}
