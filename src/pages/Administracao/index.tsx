import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../../store/formsStore'
import { useUsersStore } from '../../store/usersStore'
import { useCargosStore } from '../../store/cargosStore'
import { useAuditoriaStore } from '../../store/auditoriaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { RbacIcon } from '../../components/ui/RbacIcon'
import { formatarDataHora } from '../../lib/format'

export function Administracao() {
  const { formularios, loading, carregar, atualizarStatus } = useFormsStore()
  const { usuarios, carregar: carregarUsuarios } = useUsersStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()
  const { registros, carregar: carregarAuditoria } = useAuditoriaStore()

  useEffect(() => {
    void carregar()
    void carregarUsuarios()
    void carregarCargos()
    void carregarAuditoria()
  }, [carregar, carregarUsuarios, carregarCargos, carregarAuditoria])

  const pendentes = useMemo(() => formularios.filter((f) => f.status === 'enviado' || f.status === 'em_analise'), [formularios])

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Administração</h2>
        <p className="text-sm text-ink-muted">Visão geral do sistema, aprovações pendentes e auditoria de permissões.</p>
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
        <Link to="/administracao/cargos">
          <Card className="h-full transition-colors hover:border-brand-600/50 hover:bg-surface-2">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Cargos e permissões</p>
                <p className="mt-2 text-3xl font-bold text-ink">{cargos.length}</p>
              </div>
              <RbacIcon nome="shield" className="h-8 w-8 text-brand-400" />
            </CardContent>
          </Card>
        </Link>
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
          <div>
            <CardTitle>Auditoria de permissões</CardTitle>
            <CardDescription>Últimas alterações em cargos, funções e permissões.</CardDescription>
          </div>
          <Link to="/administracao/cargos">
            <Button variant="ghost" size="sm">
              Gerenciar cargos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {registros.length === 0 ? (
            <EmptyState title="Nenhum registro de auditoria" description="Alterações em cargos e permissões aparecerão aqui." />
          ) : (
            <div className="space-y-2">
              {registros.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
                    <RbacIcon nome="clipboard" className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{r.detalhes}</p>
                    <p className="text-xs text-ink-subtle">
                      {r.usuarioNome} · {formatarDataHora(r.criadoEm)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
