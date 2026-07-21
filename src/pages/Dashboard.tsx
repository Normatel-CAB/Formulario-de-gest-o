import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Timeline } from '../components/ui/Timeline'
import { PROJETOS_PADRAO, STATUS_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'

const indicadores = [
  { key: 'total', label: 'Total de Formulários', tone: 'brand' },
  { key: 'pendentes', label: 'Pendentes', tone: 'slate' },
  { key: 'emAnalise', label: 'Em Análise', tone: 'amber' },
  { key: 'aprovados', label: 'Aprovados', tone: 'brand' },
  { key: 'reprovados', label: 'Reprovados', tone: 'rose' },
] as const

export function Dashboard() {
  const { formularios, loading, carregar } = useFormsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [filtroProjeto, setFiltroProjeto] = useState('')

  const ehAdministrador = usuario?.papel === 'administrador'

  useEffect(() => {
    void carregar()
  }, [carregar])

  const escopo = useMemo(() => {
    let lista = formularios
    if (!ehAdministrador && usuario) {
      lista = lista.filter((f) => f.projeto === usuario.projeto)
    } else if (ehAdministrador && filtroProjeto) {
      lista = lista.filter((f) => f.projeto === filtroProjeto)
    }
    return lista
  }, [formularios, usuario, ehAdministrador, filtroProjeto])

  const stats = useMemo(() => {
    return {
      total: escopo.length,
      pendentes: escopo.filter((f) => f.status === 'rascunho' || f.status === 'enviado').length,
      emAnalise: escopo.filter((f) => f.status === 'em_analise').length,
      aprovados: escopo.filter((f) => f.status === 'aprovado').length,
      reprovados: escopo.filter((f) => f.status === 'reprovado').length,
    }
  }, [escopo])

  const ultimosEnvios = useMemo(
    () =>
      [...escopo]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map((f) => ({
          id: f.id,
          title: f.infoGerais.localAtividade || 'Atividade sem nome',
          description: `${STATUS_LABELS[f.status]} · Nº ${f.infoGerais.numeroSolicitacao || '—'}`,
          timestamp: formatarDataHora(f.updatedAt),
          tone: f.status === 'aprovado' ? ('brand' as const) : f.status === 'reprovado' ? ('rose' as const) : f.status === 'em_analise' ? ('amber' as const) : ('slate' as const),
        })),
    [escopo],
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-ink">Visão geral</h2>
          <p className="text-sm text-ink-muted">Acompanhe os indicadores das fichas técnicas de avaliação.</p>
        </div>
        <div className="flex items-center gap-2">
          {ehAdministrador && (
            <Select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} aria-label="Filtrar por projeto" className="w-48">
              <option value="">Todos os projetos</option>
              {PROJETOS_PADRAO.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          )}
          <Link to="/novo">
            <Button>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Formulário
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : indicadores.map((ind) => (
              <Card key={ind.key} className="animate-slide-up">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{ind.label}</p>
                  <p className="mt-2 text-3xl font-bold text-ink">{stats[ind.key]}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos envios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
            </div>
          ) : ultimosEnvios.length === 0 ? (
            <EmptyState
              title="Nenhum formulário enviado ainda"
              description="Crie seu primeiro formulário de avaliação de serviços para começar a acompanhar os indicadores."
              action={
                <Link to="/novo">
                  <Button>Criar formulário</Button>
                </Link>
              }
            />
          ) : (
            <Timeline items={ultimosEnvios} />
          )}
        </CardContent>
      </Card>

      {!loading && escopo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formulários recentes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {escopo.slice(0, 6).map((f) => (
              <Link
                key={f.id}
                to={`/formulario/${f.id}`}
                className="rounded-xl border border-border p-4 transition-colors duration-150 hover:border-brand-600/50 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {f.infoGerais.localAtividade || 'Atividade sem nome'}
                  </p>
                  <StatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">Responsável: {f.infoGerais.responsavel || '—'}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">{formatarDataHora(f.updatedAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
