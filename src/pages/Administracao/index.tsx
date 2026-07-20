import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../../store/formsStore'
import { useUsersStore } from '../../store/usersStore'
import { useCargosStore } from '../../store/cargosStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Badge } from '../../components/ui/Badge'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Dialog } from '../../components/ui/Dialog'
import { toast } from '../../store/toastStore'
import { formatarDataHora } from '../../lib/format'

export function Administracao() {
  const { formularios, loading, carregar, atualizarStatus } = useFormsStore()
  const { usuarios, carregar: carregarUsuarios } = useUsersStore()
  const { cargos, carregar: carregarCargos, criar, renomear, remover } = useCargosStore()

  const [novoCargo, setNovoCargo] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  useEffect(() => {
    void carregar()
    void carregarUsuarios()
    void carregarCargos()
  }, [carregar, carregarUsuarios, carregarCargos])

  const pendentes = useMemo(() => formularios.filter((f) => f.status === 'enviado' || f.status === 'em_analise'), [formularios])

  async function adicionarCargo(e: React.FormEvent) {
    e.preventDefault()
    if (!novoCargo.trim()) return
    await criar(novoCargo.trim())
    setNovoCargo('')
    toast({ variant: 'success', title: 'Cargo adicionado' })
  }

  async function salvarEdicaoCargo() {
    if (!editando || !editando.nome.trim()) return
    await renomear(editando.id, editando.nome.trim())
    setEditando(null)
    toast({ variant: 'success', title: 'Cargo atualizado' })
  }

  async function confirmarRemocaoCargo() {
    if (!removendoId) return
    await remover(removendoId)
    setRemovendoId(null)
    toast({ variant: 'success', title: 'Cargo removido' })
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Administração</h2>
        <p className="text-sm text-ink-muted">Visão geral do sistema, aprovações pendentes e gerenciamento de cargos.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Total de usuários</p>
            <p className="mt-2 text-3xl font-bold text-ink">{usuarios.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Aguardando aprovação</p>
            <p className="mt-2 text-3xl font-bold text-ink">{pendentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Cargos cadastrados</p>
            <p className="mt-2 text-3xl font-bold text-ink">{cargos.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Aprovações pendentes</CardTitle>
            <CardDescription>Formulários enviados ou em análise aguardando decisão.</CardDescription>
          </div>
          <Link to="/historico">
            <Button variant="ghost" size="sm">
              Ver histórico completo
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-ink-muted">Carregando…</p>
          ) : pendentes.length === 0 ? (
            <EmptyState title="Nenhuma aprovação pendente" description="Todos os formulários enviados já foram avaliados." />
          ) : (
            <div className="space-y-2">
              {pendentes.slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{f.infoGerais.localAtividade || 'Atividade sem nome'}</p>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      Nº {f.infoGerais.numeroSolicitacao || '—'} · {formatarDataHora(f.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => atualizarStatus(f.id, 'em_analise')}>
                      Em Análise
                    </Button>
                    <Button size="sm" onClick={() => atualizarStatus(f.id, 'aprovado')}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => atualizarStatus(f.id, 'reprovado')}>
                      Reprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={adicionarCargo} className="flex gap-2">
            <Input placeholder="Nome do novo cargo" value={novoCargo} onChange={(e) => setNovoCargo(e.target.value)} className="flex-1" />
            <Button type="submit">Adicionar</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {cargos.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 rounded-full border border-border-light bg-surface-2 py-1 pl-3 pr-1.5">
                <Badge tone="outline" className="border-0 bg-transparent px-0">
                  {c.nome}
                </Badge>
                <button
                  type="button"
                  onClick={() => setEditando({ id: c.id, nome: c.nome })}
                  className="rounded-full p-1 text-ink-subtle hover:bg-surface-3 hover:text-ink"
                  aria-label={`Editar cargo ${c.nome}`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 20h4L18.5 9.5a2 2 0 000-2.8L16.3 4.5a2 2 0 00-2.8 0L3 15v5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setRemovendoId(c.id)}
                  className="rounded-full p-1 text-ink-subtle hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label={`Remover cargo ${c.nome}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title="Editar cargo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoCargo}>Salvar</Button>
          </>
        }
      >
        <Input label="Nome do cargo" value={editando?.nome ?? ''} onChange={(e) => setEditando((prev) => (prev ? { ...prev, nome: e.target.value } : prev))} />
      </Dialog>

      <Dialog
        open={Boolean(removendoId)}
        onClose={() => setRemovendoId(null)}
        title="Remover cargo?"
        description="Usuários que já possuem este cargo não serão afetados."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemovendoId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarRemocaoCargo}>
              Remover
            </Button>
          </>
        }
      />
    </div>
  )
}
