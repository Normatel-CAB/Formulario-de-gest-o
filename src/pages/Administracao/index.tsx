import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../../store/formsStore'
import { useUsersStore } from '../../store/usersStore'
import { useCargosStore } from '../../store/cargosStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Field'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState } from '../../components/ui/EmptyState'
import { RbacIcon } from '../../components/ui/RbacIcon'
import { formatarDataHora } from '../../lib/format'
import { PROJETOS_PADRAO } from '../../lib/types'

export function Administracao() {
  const { formularios, loading, carregar, atualizarStatus } = useFormsStore()
  const { usuarios, carregar: carregarUsuarios } = useUsersStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()
  const [filtroProjeto, setFiltroProjeto] = useState('')

  useEffect(() => {
    void carregar()
    void carregarUsuarios()
    void carregarCargos()
  }, [carregar, carregarUsuarios, carregarCargos])

  const pendentes = useMemo(
    () =>
      formularios.filter(
        (f) => (f.status === 'enviado' || f.status === 'em_analise') && (!filtroProjeto || f.projeto === filtroProjeto),
      ),
    [formularios, filtroProjeto],
  )

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Administração</h2>
        <p className="text-sm text-ink-muted">Visão geral do sistema e aprovações pendentes.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/usuarios">
          <Card className="h-full transition-colors hover:border-brand-600/50 hover:bg-surface-2">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Total de usuários</p>
              <p className="mt-2 text-3xl font-bold text-ink">{usuarios.length}</p>
            </CardContent>
          </Card>
        </Link>
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
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Link to="/usuarios">
            <Button variant="outline" size="sm">
              Usuários
            </Button>
          </Link>
          <Link to="/administracao/cargos">
            <Button variant="outline" size="sm">
              Cargos
            </Button>
          </Link>
          <Link to="/administracao/permissoes">
            <Button variant="outline" size="sm">
              Permissões
            </Button>
          </Link>
          <Link to="/configuracoes">
            <Button variant="outline" size="sm">
              Configurações
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Aprovações pendentes</CardTitle>
            <CardDescription>Formulários enviados ou em análise aguardando decisão.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} aria-label="Filtrar por projeto" className="w-48">
              <option value="">Todos os projetos</option>
              {PROJETOS_PADRAO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Link to="/historico">
              <Button variant="ghost" size="sm">
                Ver histórico completo
              </Button>
            </Link>
          </div>
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
                      Nº {f.infoGerais.numeroSolicitacao || '—'} · {f.projeto || '—'} · {formatarDataHora(f.updatedAt)}
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
    </div>
  )
}
