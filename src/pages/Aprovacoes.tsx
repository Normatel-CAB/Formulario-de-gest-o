import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormsStore } from '../store/formsStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { Reveal } from '../components/ui/Reveal'
import { formatarDataHora } from '../lib/format'
import { LOTACOES, type FormStatus } from '../lib/types'
import { toast } from '../store/toastStore'

export function Aprovacoes() {
  const { formularios, loading, carregar, atualizarStatus } = useFormsStore()
  const [filtroLotacao, setFiltroLotacao] = useState('')

  useEffect(() => {
    void carregar()
  }, [carregar])

  const pendentes = useMemo(
    () =>
      formularios.filter(
        (f) =>
          (f.status === 'enviado' || f.status === 'em_analise') &&
          (!filtroLotacao || f.infoGerais.lotacao === filtroLotacao),
      ),
    [formularios, filtroLotacao],
  )

  async function mudarStatus(id: string, status: FormStatus) {
    try {
      await atualizarStatus(id, status)
      toast({ variant: 'success', title: 'Status atualizado' })
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Status não foi salvo',
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="space-y-5">
      <Reveal index={0}>
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] sm:text-[27px]">Aprovações</h1>
          <p className="mt-1 text-[13px] text-txt-dim">Fichas enviadas ou em análise aguardando decisão.</p>
        </div>
      </Reveal>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Aprovações pendentes ({pendentes.length})</CardTitle>
            <CardDescription>Abra a ficha para ver fotos e necessidades completas.</CardDescription>
          </div>
          <Select
            value={filtroLotacao}
            onChange={(e) => setFiltroLotacao(e.target.value)}
            aria-label="Filtrar por lotação"
            className="min-w-0 w-full sm:w-48"
          >
            <option value="">Todas as lotações</option>
            {LOTACOES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent>
          {loading && formularios.length === 0 ? (
            <p className="text-[13px] text-txt-dim">Carregando…</p>
          ) : pendentes.length === 0 ? (
            <EmptyState title="Nenhuma aprovação pendente" description="Todos os formulários enviados já foram avaliados." />
          ) : (
            <div className="space-y-2">
              {pendentes.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-3 rounded-md border border-hairline bg-surface-2 p-3 transition-colors hover:bg-surface sm:flex-row sm:items-start sm:justify-between"
                >
                  <Link to={`/formulario/${f.id}`} className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[12.5px] font-semibold">{f.infoGerais.localAtividade || 'Atividade sem nome'}</p>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-txt-faint">
                      {f.infoGerais.numeroSolicitacao ? `Nº ${f.infoGerais.numeroSolicitacao}` : 'Sem número'} ·{' '}
                      {f.infoGerais.lotacao || 'Sem lotação'} ·{' '}
                      {f.infoGerais.tempoEstimadoExecucao || 'sem tempo estimado'} ·{' '}
                      {formatarDataHora(f.updatedAt)}
                    </p>
                    {f.observacoes?.trim() && (
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[12px] text-txt-dim">
                        <span className="font-semibold text-txt">Observações: </span>
                        {f.observacoes}
                      </p>
                    )}
                  </Link>
                  <div className="grid shrink-0 grid-cols-3 gap-2 sm:flex">
                    <Button size="sm" variant="outline" onClick={() => mudarStatus(f.id, 'em_analise')}>
                      Análise
                    </Button>
                    <Button size="sm" onClick={() => mudarStatus(f.id, 'aprovado')}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => mudarStatus(f.id, 'reprovado')}>
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
