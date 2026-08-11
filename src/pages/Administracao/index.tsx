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
import { KpiCard } from '../../components/ui/KpiCard'
import { Reveal } from '../../components/ui/Reveal'
import { formatarDataHora } from '../../lib/format'
import { PROJETOS_PADRAO } from '../../lib/types'
import { VIZ } from '../../lib/chartTheme'

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
    <div className="space-y-5">
      <Reveal index={0}>
        <div>
          <span className="chip">Área administrativa</span>
          <h1 className="mt-2 text-[22px] font-bold tracking-[-0.025em] sm:text-[27px]">Administração</h1>
          <p className="mt-1 text-[13px] text-txt-dim">Visão geral do sistema e aprovações pendentes.</p>
        </div>
      </Reveal>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Link to="/usuarios" className="min-w-0">
          <KpiCard index={1} label="Total de usuários" value={usuarios.length} hint="contas cadastradas" icon="stack" color={VIZ.teal} />
        </Link>
        <KpiCard index={2} label="Aguardando aprovação" value={pendentes.length} hint="enviadas ou em análise" icon="clock" color={VIZ.amber} />
        <Link to="/administracao/cargos" className="min-w-0">
          <KpiCard index={3} label="Cargos e permissões" value={cargos.length} hint="perfis configurados" icon="check" color={VIZ.green} />
        </Link>
      </section>

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
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} aria-label="Filtrar por projeto" className="min-w-0 flex-1 sm:w-48 sm:flex-none">
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
            <p className="text-[13px] text-txt-dim">Carregando…</p>
          ) : pendentes.length === 0 ? (
            <EmptyState title="Nenhuma aprovação pendente" description="Todos os formulários enviados já foram avaliados." />
          ) : (
            <div className="space-y-2">
              {pendentes.slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-3 rounded-md border border-hairline bg-surface-2 p-3 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{f.infoGerais.localAtividade || 'Atividade sem nome'}</p>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-txt-faint">
                      {f.infoGerais.numeroSolicitacao ? `Nº ${f.infoGerais.numeroSolicitacao}` : 'Sem número'} ·{' '}
                      {f.infoGerais.lotacao || f.projeto || 'Sem lotação'} ·{' '}
                      {formatarDataHora(f.updatedAt)}
                    </p>
                  </div>
                  {/* No celular os três botões viram uma grade de largura total:
                      lado a lado eles ficariam menores que a área de toque. */}
                  <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
                    <Button size="sm" variant="outline" onClick={() => atualizarStatus(f.id, 'em_analise')}>
                      Análise
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
