import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { useAuthStore } from '../store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { Reveal } from '../components/ui/Reveal'
import { DialogoCompras } from '../components/ficha/DialogoCompras'
import { formatarDataHora } from '../lib/format'
import { transicoesPossiveis } from '../lib/fluxo'
import {
  LOTACOES_FILTRO,
  localDaFicha,
  podeDecidirFicha,
  podeProgramar,
  tituloFicha,
  type FormStatus,
  type FormularioAvaliacao,
} from '../lib/types'
import { toast } from '../store/toastStore'

const FILA_SUPERVISOR: FormStatus[] = ['enviado', 'em_analise', 'em_compras']
const FILA_PLANEJADOR: FormStatus[] = ['aprovado']

export function Aprovacoes() {
  const { formularios, loading, carregar, atualizarStatus } = useFormsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const [filtroLotacao, setFiltroLotacao] = useState('')
  const [paraCompras, setParaCompras] = useState<FormularioAvaliacao | null>(null)

  useEffect(() => {
    void carregar()
  }, [carregar])

  const ehSupervisor = podeDecidirFicha(usuario)
  const ehPlanejador = podeProgramar(usuario)

  const daLotacao = useMemo(
    () => formularios.filter((f) => !filtroLotacao || f.infoGerais.lotacao === filtroLotacao),
    [formularios, filtroLotacao],
  )
  const filaSupervisor = daLotacao.filter((f) => FILA_SUPERVISOR.includes(f.status))
  const filaPlanejador = daLotacao.filter((f) => FILA_PLANEJADOR.includes(f.status))

  async function mudarStatus(f: FormularioAvaliacao, status: FormStatus, justificativa?: string) {
    if (status === 'em_compras' && justificativa === undefined) {
      setParaCompras(f)
      return
    }
    try {
      await atualizarStatus(f.id, status, justificativa)
      setParaCompras(null)
      toast({ variant: 'success', title: 'Status atualizado' })
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Status não foi salvo',
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  function lista(fichas: FormularioAvaliacao[], vazio: string) {
    if (loading && formularios.length === 0) return <p className="text-[13px] text-txt-dim">Carregando…</p>
    if (fichas.length === 0) return <EmptyState title="Nada pendente" description={vazio} />
    return (
      <div className="space-y-2">
        {fichas.map((f) => (
          <div
            key={f.id}
            className="flex flex-col gap-3 rounded-md border border-hairline bg-surface-2 p-3 transition-colors hover:bg-surface sm:flex-row sm:items-start sm:justify-between"
          >
            <Link to={`/formulario/${f.id}`} className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-[12.5px] font-semibold">{tituloFicha(f)}</p>
                <StatusBadge status={f.status} />
              </div>
              {localDaFicha(f) && <p className="mt-0.5 truncate text-[11.5px] text-txt-dim">Local: {localDaFicha(f)}</p>}
              <p className="mt-0.5 text-[11px] text-txt-faint">
                {[
                  f.infoGerais.numeroSolicitacao ? `Nº ${f.infoGerais.numeroSolicitacao}` : 'Sem número',
                  f.infoGerais.lotacao || 'Sem lotação',
                  f.infoGerais.carteira,
                  f.infoGerais.tempoEstimadoExecucao,
                  formatarDataHora(f.updatedAt),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {f.status === 'em_compras' && f.justificativaCompras?.trim() && (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[12px] text-txt-dim">
                  <span className="font-semibold text-txt">Compras: </span>
                  {f.justificativaCompras}
                </p>
              )}
              {f.observacoes?.trim() && (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[12px] text-txt-dim">
                  <span className="font-semibold text-txt">Observações: </span>
                  {f.observacoes}
                </p>
              )}
            </Link>
            <div className="flex shrink-0 flex-wrap gap-2">
              {transicoesPossiveis(usuario, f.status).map((t) => (
                <Button key={t.para} size="sm" variant={t.variante} onClick={() => void mudarStatus(f, t.para)}>
                  {t.rotulo}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Reveal index={0}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.025em] sm:text-[27px]">Aprovações</h1>
            <p className="mt-1 text-[13px] text-txt-dim">
              {ehSupervisor && ehPlanejador
                ? 'Fichas aguardando avaliação e programação.'
                : ehPlanejador
                ? 'Fichas aprovadas pelo supervisor, aguardando programação.'
                : 'Fichas enviadas aguardando sua avaliação.'}
            </p>
          </div>
          <Select
            value={filtroLotacao}
            onChange={(e) => setFiltroLotacao(e.target.value)}
            aria-label="Filtrar por lotação"
            className="min-w-0 w-full sm:w-48"
          >
            <option value="">Todas as lotações</option>
            {LOTACOES_FILTRO.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      </Reveal>

      {ehSupervisor && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Aguardando avaliação ({filaSupervisor.length})</CardTitle>
              <CardDescription>Enviadas, em análise ou paradas em compras. Abra a ficha para ver fotos e necessidades.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{lista(filaSupervisor, 'Nenhuma ficha esperando avaliação.')}</CardContent>
        </Card>
      )}

      {ehPlanejador && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Aguardando programação ({filaPlanejador.length})</CardTitle>
              <CardDescription>Aprovadas pelo supervisor.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{lista(filaPlanejador, 'Nenhuma ficha aprovada esperando programação.')}</CardContent>
        </Card>
      )}

      <DialogoCompras
        aberto={Boolean(paraCompras)}
        justificativaAtual={paraCompras?.justificativaCompras}
        onFechar={() => setParaCompras(null)}
        onConfirmar={(texto) => (paraCompras ? mudarStatus(paraCompras, 'em_compras', texto) : undefined)}
      />
    </div>
  )
}
