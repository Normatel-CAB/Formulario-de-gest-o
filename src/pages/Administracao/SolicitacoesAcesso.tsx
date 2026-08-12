import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Select, Textarea } from '../../components/ui/Field'
import { Dialog } from '../../components/ui/Dialog'
import { Reveal } from '../../components/ui/Reveal'
import { useSolicitacoesStore } from '../../store/solicitacoesStore'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import { PAPEL_LABELS, PROJETOS_PADRAO, type Papel } from '../../lib/types'
import type { SolicitacaoAcesso } from '../../lib/acesso'
import { formatarDataHora } from '../../lib/format'

/**
 * Fila de aprovação de acesso.
 *
 * As solicitações nascem sozinhas no login com a Microsoft, então aqui não há
 * criação de conta: só decidir. Aprovar libera no próximo login da pessoa, com o
 * papel escolhido.
 */
export function SolicitacoesAcesso() {
  const { solicitacoes, loading, erro, carregar, aprovar, rejeitar, reabrir } = useSolicitacoesStore()
  const usuario = useAuthStore((s) => s.usuario)

  const [papeis, setPapeis] = useState<Record<string, Papel>>({})
  const [projetos, setProjetos] = useState<Record<string, string>>({})
  const [processando, setProcessando] = useState<string | null>(null)
  const [rejeitando, setRejeitando] = useState<SolicitacaoAcesso | null>(null)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    void carregar()
  }, [carregar])

  const pendentes = useMemo(() => solicitacoes.filter((s) => s.status === 'pendente'), [solicitacoes])
  const decididas = useMemo(() => solicitacoes.filter((s) => s.status !== 'pendente').slice(0, 8), [solicitacoes])

  const decididoPor = usuario?.email ?? 'administrador'

  async function onAprovar(s: SolicitacaoAcesso) {
    setProcessando(s.id)
    try {
      await aprovar(s.id, papeis[s.id] ?? 'visualizador', projetos[s.id] ?? '', decididoPor)
      toast({
        variant: 'success',
        title: `${s.nome || s.email} aprovado`,
        description: 'O acesso libera no próximo login da pessoa.',
      })
    } catch (err) {
      toast({ variant: 'error', title: 'Falha ao aprovar', description: mensagem(err) })
    } finally {
      setProcessando(null)
    }
  }

  async function onRejeitar() {
    if (!rejeitando) return
    setProcessando(rejeitando.id)
    try {
      await rejeitar(rejeitando.id, motivo, decididoPor)
      toast({ variant: 'success', title: 'Solicitação recusada' })
      setRejeitando(null)
      setMotivo('')
    } catch (err) {
      toast({ variant: 'error', title: 'Falha ao recusar', description: mensagem(err) })
    } finally {
      setProcessando(null)
    }
  }

  async function onReabrir(s: SolicitacaoAcesso) {
    setProcessando(s.id)
    try {
      await reabrir(s.id)
      toast({ variant: 'success', title: 'Solicitação reaberta' })
    } catch (err) {
      toast({ variant: 'error', title: 'Falha ao reabrir', description: mensagem(err) })
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
              Criadas automaticamente quando alguém entra com a conta Microsoft. Aprovar libera no
              próximo login.
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
          {erro && (
            <div className="rounded-md border border-viz-red/25 bg-viz-red/10 px-3 py-3 text-[12px] text-viz-red">
              <p className="font-semibold">Não foi possível carregar a fila.</p>
              <p className="mt-1 leading-relaxed">{erro}</p>
              <p className="mt-2 text-[11px] opacity-80">
                Se a mensagem fala de tabela inexistente, rode
                <code className="mx-1 rounded bg-black/20 px-1">
                  supabase/migrations/002_solicitacoes_de_acesso.sql
                </code>
                no SQL Editor do Supabase.
              </p>
            </div>
          )}

          {!erro && pendentes.length === 0 && !loading && (
            <p className="py-4 text-center text-[12px] text-txt-faint">
              Nenhuma solicitação aguardando aprovação.
            </p>
          )}

          {pendentes.map((s) => (
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
                value={papeis[s.id] ?? 'visualizador'}
                onChange={(e) => setPapeis((p) => ({ ...p, [s.id]: e.target.value as Papel }))}
              >
                {(Object.keys(PAPEL_LABELS) as Papel[]).map((papel) => (
                  <option key={papel} value={papel}>
                    {PAPEL_LABELS[papel]}
                  </option>
                ))}
              </Select>

              <Select
                label="Projeto"
                value={projetos[s.id] ?? ''}
                onChange={(e) => setProjetos((p) => ({ ...p, [s.id]: e.target.value }))}
              >
                <option value="">Todos os projetos</option>
                {PROJETOS_PADRAO.map((projeto) => (
                  <option key={projeto} value={projeto}>
                    {projeto}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-2 lg:flex">
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
                <Button size="sm" onClick={() => void onAprovar(s)} loading={processando === s.id}>
                  Aprovar
                </Button>
              </div>
            </div>
          ))}

          {decididas.length > 0 && (
            <div className="border-t border-hairline pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
                Decisões recentes
              </p>
              <ul className="grid gap-1.5">
                {decididas.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-[11.5px] transition-colors hover:bg-surface-2"
                  >
                    <Badge tone={s.status === 'aprovado' ? 'brand' : 'rose'}>
                      {s.status === 'aprovado' ? 'Aprovado' : 'Recusado'}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate text-txt-dim">{s.email}</span>
                    {s.status === 'aprovado' && (
                      <span className="text-txt-faint">{PAPEL_LABELS[s.papel] ?? s.papel}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onReabrir(s)}
                      disabled={processando === s.id}
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
          open={Boolean(rejeitando)}
          onClose={() => setRejeitando(null)}
          title="Recusar solicitação"
          description={rejeitando?.email}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRejeitando(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => void onRejeitar()} loading={Boolean(processando)}>
                Recusar acesso
              </Button>
            </>
          }
        >
          <Textarea
            label="Motivo (opcional)"
            hint="A pessoa vê este texto na tela de acesso recusado."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: conta não pertence à equipe de gestão"
          />
        </Dialog>
      </Card>
    </Reveal>
  )
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : undefined
}
