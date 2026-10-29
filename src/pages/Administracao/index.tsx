import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../../store/formsStore'
import { useSolicitacoesStore } from '../../store/solicitacoesStore'
import { useCargosStore } from '../../store/cargosStore'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { KpiCard } from '../../components/ui/KpiCard'
import { Reveal } from '../../components/ui/Reveal'
import { VIZ } from '../../lib/chartTheme'
import { FilaAprovacao } from './AcessosCompartilhados'

export function Administracao() {
  const { formularios, carregar } = useFormsStore()
  const { solicitacoes, carregar: carregarAcessos } = useSolicitacoesStore()
  const { cargos, carregar: carregarCargos } = useCargosStore()

  useEffect(() => {
    void carregar()
    void carregarAcessos()
    void carregarCargos()
  }, [carregar, carregarAcessos, carregarCargos])

  const pendentes = useMemo(
    () => formularios.filter((f) => f.status === 'enviado' || f.status === 'em_analise').length,
    [formularios],
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
          <KpiCard index={1} label="Total de usuários" value={solicitacoes.filter((s) => s.status === 'aprovado').length} hint="com acesso liberado" icon="stack" color={VIZ.teal} />
        </Link>
        <Link to="/aprovacoes" className="min-w-0">
          <KpiCard index={2} label="Fichas em análise" value={pendentes} hint="enviadas ou em análise" icon="clock" color={VIZ.amber} />
        </Link>
        <Link to="/administracao/cargos" className="min-w-0">
          <KpiCard index={3} label="Cargos e permissões" value={cargos.length} hint="perfis configurados" icon="check" color={VIZ.green} />
        </Link>
      </section>

      <FilaAprovacao />

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Link to="/aprovacoes">
            <Button variant="outline" size="sm">
              Aprovações
            </Button>
          </Link>
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

    </div>
  )
}
