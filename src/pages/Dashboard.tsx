import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Timeline } from '../components/ui/Timeline'
import { STATUS_LABELS } from '../lib/types'
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

  useEffect(() => {
    void carregar()
  }, [carregar])

  const stats = useMemo(() => {
    return {
      total: formularios.length,
      pendentes: formularios.filter((f) => f.status === 'rascunho' || f.status === 'enviado').length,
      emAnalise: formularios.filter((f) => f.status === 'em_analise').length,
      aprovados: formularios.filter((f) => f.status === 'aprovado').length,
      reprovados: formularios.filter((f) => f.status === 'reprovado').length,
    }
  }, [formularios])

  const ultimosEnvios = useMemo(
    () =>
      [...formularios]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map((f) => ({
          id: f.id,
          title: f.infoGerais.localAtividade || 'Atividade sem nome',
          description: `${STATUS_LABELS[f.status]} · Nº ${f.infoGerais.numeroSolicitacao || '—'}`,
          timestamp: formatarDataHora(f.updatedAt),
          tone: f.status === 'aprovado' ? ('brand' as const) : f.status === 'reprovado' ? ('rose' as const) : f.status === 'em_analise' ? ('amber' as const) : ('slate' as const),
        })),
    [formularios],
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-brand-950">Visão geral</h2>
          <p className="text-sm text-brand-700/70">Acompanhe os indicadores das fichas técnicas de avaliação.</p>
        </div>
        <Link to="/novo">
          <Button>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo Formulário
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : indicadores.map((ind) => (
              <Card key={ind.key} className="animate-slide-up">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-500">{ind.label}</p>
                  <p className="mt-2 text-3xl font-bold text-brand-950">{stats[ind.key]}</p>
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

      {!loading && formularios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formulários recentes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formularios.slice(0, 6).map((f) => (
              <Link
                key={f.id}
                to={`/formulario/${f.id}`}
                className="rounded-xl border border-brand-100 p-4 transition-colors duration-150 hover:border-brand-300 hover:bg-brand-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-950 line-clamp-1">
                    {f.infoGerais.localAtividade || 'Atividade sem nome'}
                  </p>
                  <StatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-xs text-brand-500">Responsável: {f.infoGerais.responsavel || '—'}</p>
                <p className="mt-0.5 text-xs text-brand-400">{formatarDataHora(f.updatedAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
