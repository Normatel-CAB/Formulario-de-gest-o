import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { PROJETOS_PADRAO, STATUS_LABELS } from '../lib/types'
import { formatarDataHora } from '../lib/format'
import { cn } from '../lib/cn'

function IconWrap({ tone, children }: { tone: 'brand' | 'sky' | 'amber' | 'rose'; children: React.ReactNode }) {
  const toneClasses = {
    brand: 'bg-brand-500/15 text-brand-400',
    sky: 'bg-sky-500/15 text-sky-400',
    amber: 'bg-amber-500/15 text-amber-400',
    rose: 'bg-rose-500/15 text-rose-400',
  } as const
  return <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', toneClasses[tone])}>{children}</div>
}

function StackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12l8 4.5 8-4.5M4 16.5L12 21l8-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

const indicadores = [
  { key: 'total', label: 'Total de Formulários', tone: 'brand', icon: StackIcon },
  { key: 'pendentes', label: 'Pendentes', tone: 'sky', icon: ClockIcon },
  { key: 'emAnalise', label: 'Em Análise', tone: 'amber', icon: SearchIcon },
  { key: 'aprovados', label: 'Aprovados', tone: 'brand', icon: CheckIcon },
  { key: 'reprovados', label: 'Reprovados', tone: 'rose', icon: XIcon },
] as const

const DIST_COLORS: Record<string, string> = {
  aprovado: '#2fa87e',
  em_analise: '#f59e0b',
  enviado: '#38bdf8',
  rascunho: '#a3a3a3',
  reprovado: '#f43f5e',
}

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
      lista = lista.filter((f) => !f.projeto || !usuario.projeto || f.projeto === usuario.projeto)
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

  const distribuicao = useMemo(() => {
    const porStatus: Record<string, number> = { aprovado: 0, em_analise: 0, enviado: 0, rascunho: 0, reprovado: 0 }
    for (const f of escopo) porStatus[f.status] = (porStatus[f.status] ?? 0) + 1
    const total = escopo.length || 1
    let acumulado = 0
    const fatias = Object.entries(porStatus)
      .filter(([, qtd]) => qtd > 0)
      .map(([status, qtd]) => {
        const pct = (qtd / total) * 100
        const fatia = { status, qtd, pct, de: acumulado, ate: acumulado + pct }
        acumulado += pct
        return fatia
      })
    const gradient = fatias.length
      ? fatias.map((f) => `${DIST_COLORS[f.status]} ${f.de}% ${f.ate}%`).join(', ')
      : 'var(--color-surface-3) 0% 100%'
    return { fatias, gradient }
  }, [escopo])

  const ultimosEnvios = useMemo(
    () =>
      [...escopo]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [escopo],
  )

  const taxaAprovacao = useMemo(() => {
    const avaliados = stats.aprovados + stats.reprovados
    if (avaliados === 0) return 0
    return Math.round((stats.aprovados / avaliados) * 100)
  }, [stats])

  const volumeMensal = useMemo(() => {
    const meses: { chave: string; label: string; qtd: number }[] = []
    const agora = new Date()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      meses.push({
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        qtd: 0,
      })
    }
    const indice = new Map(meses.map((m) => [m.chave, m]))
    for (const f of escopo) {
      const chave = (f.createdAt ?? f.updatedAt).slice(0, 7)
      const alvo = indice.get(chave)
      if (alvo) alvo.qtd += 1
    }
    const max = Math.max(1, ...meses.map((m) => m.qtd))
    return { meses, max }
  }, [escopo])

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Visão geral</h2>
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
            <Button size="lg" className="shadow-lg shadow-brand-900/40">
              <PlusIcon />
              Novo Formulário
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : indicadores.map((ind) => {
              const Icon = ind.icon
              return (
                <Card key={ind.key} className="animate-slide-up transition-shadow duration-200 hover:shadow-md hover:shadow-black/30">
                  <CardContent className="flex items-start justify-between gap-2 p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{ind.label}</p>
                      <p className="mt-2 text-3xl font-bold text-ink">{stats[ind.key]}</p>
                    </div>
                    <IconWrap tone={ind.tone}>
                      <Icon />
                    </IconWrap>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-ink">{taxaAprovacao}%</span>
                  <span className="mb-1 text-xs text-ink-subtle">dos avaliados</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                    style={{ width: `${taxaAprovacao}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-surface-2 p-3">
                    <p className="text-xs text-ink-subtle">Aprovados</p>
                    <p className="text-lg font-semibold text-brand-400">{stats.aprovados}</p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3">
                    <p className="text-xs text-ink-subtle">Reprovados</p>
                    <p className="text-lg font-semibold text-rose-400">{stats.reprovados}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Volume por mês</CardTitle>
              <CardDescription>Formulários criados nos últimos 6 meses.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
            ) : (
              <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
                {volumeMensal.meses.map((m) => (
                  <div key={m.chave} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-medium text-ink">{m.qtd}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-brand-500/80 transition-[height] duration-500 hover:bg-brand-500"
                        style={{ height: `${Math.max(4, (m.qtd / volumeMensal.max) * 100)}%` }}
                        title={`${m.qtd} formulário(s)`}
                      />
                    </div>
                    <span className="text-[11px] capitalize text-ink-subtle">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Últimos envios</CardTitle>
              <CardDescription>Atualizações mais recentes dos formulários.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
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
              <ul className="divide-y divide-border">
                {ultimosEnvios.map((f) => (
                  <li key={f.id}>
                    <Link
                      to={`/formulario/${f.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-surface-2"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: DIST_COLORS[f.status] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{f.infoGerais.localAtividade || 'Atividade sem nome'}</p>
                        <p className="truncate text-xs text-ink-subtle">Nº {f.infoGerais.numeroSolicitacao || '—'}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={f.status} />
                        <span className="text-[11px] text-ink-subtle">{formatarDataHora(f.updatedAt)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
            ) : (
              <div className="flex flex-col items-center gap-5">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(${distribuicao.gradient})` }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-surface text-center">
                    <span className="text-2xl font-bold text-ink">{escopo.length}</span>
                    <span className="text-[11px] text-ink-subtle">formulários</span>
                  </div>
                </div>
                <ul className="w-full space-y-2">
                  {distribuicao.fatias.length === 0 ? (
                    <p className="text-center text-sm text-ink-muted">Sem dados no momento.</p>
                  ) : (
                    distribuicao.fatias.map((f) => (
                      <li key={f.status} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 text-ink-muted">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DIST_COLORS[f.status] }} />
                          {STATUS_LABELS[f.status as keyof typeof STATUS_LABELS]}
                        </span>
                        <span className="font-medium text-ink">{f.qtd}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && escopo.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Formulários recentes</CardTitle>
              <CardDescription>Acesso rápido às últimas fichas técnicas.</CardDescription>
            </div>
            <Link to="/historico">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {escopo.slice(0, 6).map((f) => (
              <Link
                key={f.id}
                to={`/formulario/${f.id}`}
                className="group rounded-xl border border-border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-600/50 hover:bg-surface-2 hover:shadow-md hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink line-clamp-1 group-hover:text-brand-300">
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
