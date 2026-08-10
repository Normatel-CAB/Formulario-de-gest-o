import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { KpiCard } from '../components/ui/KpiCard'
import { Reveal } from '../components/ui/Reveal'
import { RowBar } from '../components/ui/RowBar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import { DonutChart } from '../components/dashboard/DonutChart'
import { BarsChart } from '../components/dashboard/BarsChart'
import { PROJETOS_PADRAO, STATUS_LABELS, LOTACOES, EQUIPAMENTO_CHAVES, EQUIPAMENTO_LABELS } from '../lib/types'
import type { FormStatus } from '../lib/types'
import { STATUS_COLOR, VIZ, serieAt } from '../lib/chartTheme'
import { formatarDataHora } from '../lib/format'

const ORDEM_STATUS: FormStatus[] = ['rascunho', 'enviado', 'em_analise', 'aprovado', 'reprovado']

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

  const stats = useMemo(
    () => ({
      total: escopo.length,
      pendentes: escopo.filter((f) => f.status === 'rascunho' || f.status === 'enviado').length,
      emAnalise: escopo.filter((f) => f.status === 'em_analise').length,
      aprovados: escopo.filter((f) => f.status === 'aprovado').length,
      reprovados: escopo.filter((f) => f.status === 'reprovado').length,
    }),
    [escopo],
  )

  const taxaAprovacao = useMemo(() => {
    const avaliados = stats.aprovados + stats.reprovados
    return avaliados === 0 ? 0 : Math.round((stats.aprovados / avaliados) * 100)
  }, [stats])

  /** Últimos 6 meses de criação — alimenta o sparkline dos KPIs e o gráfico. */
  const volumeMensal = useMemo(() => {
    const meses: { chave: string; label: string; qtd: number }[] = []
    const agora = new Date()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      meses.push({
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
        qtd: 0,
      })
    }
    const indice = new Map(meses.map((m) => [m.chave, m]))
    for (const f of escopo) {
      const alvo = indice.get((f.createdAt ?? f.updatedAt).slice(0, 7))
      if (alvo) alvo.qtd += 1
    }
    return meses
  }, [escopo])

  // Um sparkline reto não comunica nada; sem histórico usamos uma curva neutra.
  const spark = useMemo(() => {
    const serie = volumeMensal.map((m) => m.qtd)
    return serie.some((v) => v > 0) ? serie : [1, 2, 2, 3, 3, 4]
  }, [volumeMensal])

  const porStatus = useMemo(
    () =>
      ORDEM_STATUS.map((status) => ({
        name: STATUS_LABELS[status],
        value: escopo.filter((f) => f.status === status).length,
        color: STATUS_COLOR[status],
      })).filter((d) => d.value > 0),
    [escopo],
  )

  /** Uma linha por lotação, incluindo as que ainda não têm ficha. */
  const porLotacao = useMemo(() => {
    const base = new Map<string, { pendentes: number; emAnalise: number; concluidas: number }>()
    for (const l of LOTACOES) base.set(l, { pendentes: 0, emAnalise: 0, concluidas: 0 })
    for (const f of escopo) {
      const chave = f.infoGerais.lotacao || 'Sem lotação'
      if (!base.has(chave)) base.set(chave, { pendentes: 0, emAnalise: 0, concluidas: 0 })
      const linha = base.get(chave)!
      if (f.status === 'rascunho' || f.status === 'enviado') linha.pendentes += 1
      else if (f.status === 'em_analise') linha.emAnalise += 1
      else linha.concluidas += 1
    }
    return [...base.entries()]
      .map(([name, v]) => ({ name, ...v, total: v.pendentes + v.emAnalise + v.concluidas }))
      .sort((a, b) => b.total - a.total)
  }, [escopo])

  const lotacaoComFicha = useMemo(() => porLotacao.filter((l) => l.total > 0), [porLotacao])

  /** Equipamentos mais pedidos — a leitura que a mobilização usa. */
  const porEquipamento = useMemo(() => {
    const contagem = EQUIPAMENTO_CHAVES.map((chave) => ({
      name: EQUIPAMENTO_LABELS[chave],
      valor: escopo.filter((f) => f.necessidades.equipamentos?.[chave]?.necessario).length,
    })).sort((a, b) => b.valor - a.valor)
    return contagem.some((c) => c.valor > 0) ? contagem : []
  }, [escopo])

  const ultimosEnvios = useMemo(
    () => [...escopo].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [escopo],
  )

  const equipamentoMaisPedido = porEquipamento[0]?.valor ? porEquipamento[0].name : '—'

  return (
    <div className="space-y-5">
      {/* ---------------- Cabeçalho ---------------- */}
      <Reveal index={0}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="chip">
              <span className="h-1.5 w-1.5 animate-brand-pulse rounded-full bg-brand-glow shadow-[0_0_8px_var(--brand-glow)]" />
              Fichas técnicas · {filtroProjeto || 'todos os projetos'}
            </span>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.025em] sm:text-[27px]">Visão geral</h1>
            <p className="mt-1 text-[13px] text-txt-dim">
              {stats.total} ficha(s) no escopo · {lotacaoComFicha.length} lotação(ões) com registro
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {ehAdministrador && (
              <Select
                value={filtroProjeto}
                onChange={(e) => setFiltroProjeto(e.target.value)}
                aria-label="Filtrar por projeto"
                className="min-w-0 flex-1 sm:w-48 sm:flex-none"
              >
                <option value="">Todos os projetos</option>
                {PROJETOS_PADRAO.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            )}
            <Link to="/novo" className="shrink-0">
              <Button size="lg" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Nova ficha</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ---------------- KPIs ---------------- */}
      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <KpiCard
            index={1}
            label="Total de fichas"
            value={stats.total}
            hint="no escopo selecionado"
            icon="stack"
            color={VIZ.teal}
            spark={spark}
          />
          <KpiCard
            index={2}
            label="Pendentes"
            value={stats.pendentes}
            hint="rascunhos e enviadas"
            icon="clock"
            color={VIZ.amber}
            spark={spark}
          />
          <KpiCard
            index={3}
            label="Aprovadas"
            value={stats.aprovados}
            hint={`${stats.emAnalise} em análise`}
            icon="check"
            color={VIZ.green}
            spark={spark}
            trend={taxaAprovacao >= 50 ? 'up' : taxaAprovacao > 0 ? 'down' : 'flat'}
            trendLabel={`${taxaAprovacao}%`}
          />
          <KpiCard
            index={4}
            label="Equipamento mais pedido"
            valueText={equipamentoMaisPedido}
            hint={porEquipamento[0]?.valor ? `${porEquipamento[0].valor} ficha(s)` : 'nenhum pedido ainda'}
            icon="truck"
            color={VIZ.lime}
          />
        </section>
      )}

      {/* ---------------- Donut + volume mensal ---------------- */}
      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Reveal index={5}>
          <Card className="h-full">
            <CardHeader>
              <div className="min-w-0">
                <CardTitle>Distribuição por status</CardTitle>
                <CardDescription>{stats.total} ficha(s) no escopo</CardDescription>
              </div>
              <Badge tone="slate">{porStatus.length} status</Badge>
            </CardHeader>
            <CardContent>
              <DonutChart data={porStatus} unidade="fichas" />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal index={6}>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Volume por mês</CardTitle>
                <CardDescription>fichas criadas nos últimos 6 meses</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <BarsChart
                rows={volumeMensal.map((m) => ({ name: m.label, valor: m.qtd }))}
                labelWidth="w-[58px] sm:w-[74px]"
              />
            </CardContent>
          </Card>
        </Reveal>
      </section>

      {/* ---------------- Lotação ---------------- */}
      <Reveal index={7}>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Fichas por Lotação</CardTitle>
              <CardDescription>distribuição entre as bases do contrato</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {lotacaoComFicha.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-txt-faint">Nenhuma ficha registrada ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="[&>th]:bg-transparent">
                    <TableHead>Lotação</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead className="text-right">Em análise</TableHead>
                    <TableHead className="text-right">Concluídas</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotacaoComFicha.map((l, i) => {
                    const s = serieAt(i)
                    const max = Math.max(...lotacaoComFicha.map((x) => x.total), 1)
                    return (
                      <TableRow key={l.name}>
                        <TableCell>
                          <RowBar pct={(l.total / max) * 100} from={s.from} to={s.to} delay={i * 105} />
                          <span className="relative z-[1] inline-flex items-center gap-2 whitespace-nowrap font-semibold">
                            <span
                              className="h-[17px] w-[3px] shrink-0 rounded-sm"
                              style={{ background: `linear-gradient(180deg, ${s.from}, ${s.to})` }}
                            />
                            {l.name}
                          </span>
                        </TableCell>
                        <TableCell className="tabular text-right font-semibold text-viz-amber">{l.pendentes}</TableCell>
                        <TableCell className="tabular text-right text-viz-teal">{l.emAnalise}</TableCell>
                        <TableCell className="tabular text-right text-viz-lime">{l.concluidas}</TableCell>
                        <TableCell className="tabular text-right font-bold">{l.total}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* ---------------- Equipamentos ---------------- */}
      {porEquipamento.length > 0 && (
        <Reveal index={8}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Equipamentos solicitados</CardTitle>
                <CardDescription>quantidade de fichas que pedem cada equipamento</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <BarsChart rows={porEquipamento} />
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* ---------------- Últimos envios ---------------- */}
      <Reveal index={9}>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Últimos envios</CardTitle>
              <CardDescription>atualizações mais recentes das fichas</CardDescription>
            </div>
            <Link to="/historico">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonCard />
            ) : ultimosEnvios.length === 0 ? (
              <EmptyState
                title="Nenhuma ficha enviada ainda"
                description="Crie a primeira ficha técnica de avaliação para começar a acompanhar os indicadores."
                action={
                  <Link to="/novo">
                    <Button>Criar ficha</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="grid gap-2">
                {ultimosEnvios.map((f) => (
                  <li key={f.id}>
                    <Link
                      to={`/formulario/${f.id}`}
                      className="flex items-center gap-3 rounded-md border border-hairline bg-surface-2 px-3 py-3 transition-all duration-200 hover:-translate-y-px hover:border-hairline-hi hover:bg-surface"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[f.status] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">
                          {f.infoGerais.localAtividade || 'Atividade sem nome'}
                        </p>
                        <p className="truncate text-[11px] text-txt-faint">
                          Nº {f.infoGerais.numeroSolicitacao || '—'}
                          {f.infoGerais.lotacao ? ` · ${f.infoGerais.lotacao}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={f.status} />
                        <span className="hidden text-[10.5px] text-txt-faint sm:block">
                          {formatarDataHora(f.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}
