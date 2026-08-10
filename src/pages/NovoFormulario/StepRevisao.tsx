import type { FormularioAvaliacao } from '../../lib/types'
import { EQUIPAMENTO_CHAVES, EQUIPAMENTO_LABELS } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Reveal } from '../../components/ui/Reveal'
import { formatarData } from '../../lib/format'

const AGENDAMENTO_LABELS: Record<string, string> = {
  visitaTecnica: 'Visita Técnica',
  montagemAndaime: 'Montagem de Andaime',
  visitaSMS: 'Visita SMS',
  veiculo: 'Veículo',
  libra: 'LIBRA',
  ar2: 'AR2',
  desligamentoEletrico: 'Desligamento Elétrico',
  desligamentoSDAI: 'Desligamento SDAI',
  desligamentoFM200: 'Desligamento FM200',
  remanejamentoMobiliario: 'Remanejamento de Mobiliário',
}

const QTD_DIAS_LABELS: Record<string, string> = {
  limpezaArea: 'Limpeza de Área',
  comunicacoesOperantes: 'Comunicações Operantes',
}

const DESCRICAO_LABELS: Record<string, string> = {
  materialEspecifico: 'Material específico',
  locacaoMaquinas: 'Locação de Máquinas/Ferramentas',
  apoioOutraEquipe: 'Apoio de outra equipe',
}

export function StepRevisao({ formulario }: { formulario: FormularioAvaliacao }) {
  const info = formulario.infoGerais
  const n = formulario.necessidades
  const item = (chave: string) => (n as unknown as Record<string, { necessario?: boolean; dias?: number; data?: string }>)[chave]

  const equipamentosAtivos = EQUIPAMENTO_CHAVES.filter((chave) => n.equipamentos[chave]?.necessario)
  const qtdDiasAtivos = Object.entries(QTD_DIAS_LABELS).filter(([chave]) => item(chave)?.necessario)
  const agendamentosAtivos = Object.entries(AGENDAMENTO_LABELS).filter(([chave]) => item(chave)?.necessario)
  const descricoesAtivas = Object.entries(DESCRICAO_LABELS).filter(([chave]) => item(chave)?.necessario)

  const nada =
    equipamentosAtivos.length === 0 &&
    qtdDiasAtivos.length === 0 &&
    agendamentosAtivos.length === 0 &&
    descricoesAtivas.length === 0

  return (
    <div className="space-y-4">
      <Reveal index={0}>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revisão do formulário</CardTitle>
              <CardDescription>Confira as informações antes de enviar.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Responsável" value={info.responsavel} />
            <InfoRow label="Data da Avaliação" value={info.dataAvaliacao ? formatarData(info.dataAvaliacao) : '—'} />
            <InfoRow label="Tempo Estimado" value={info.tempoEstimadoExecucao} />
            <InfoRow label="Nº da Solicitação" value={info.numeroSolicitacao} />
            <InfoRow label="Equipe Necessária" value={info.equipeNecessaria} />
            <InfoRow label="Lotação" value={info.lotacao} />
            <InfoRow label="Local da Atividade" value={info.localAtividade} />
          </CardContent>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Card>
          <CardHeader>
            <CardTitle>Necessidades selecionadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nada ? (
              <p className="text-[12.5px] text-txt-dim">Nenhuma necessidade marcada como "Sim".</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {equipamentosAtivos.map((chave) => {
                  const eq = n.equipamentos[chave]
                  const detalhes = [
                    eq.dias ? `${eq.dias} dia(s)` : null,
                    eq.data ? formatarData(eq.data) : null,
                  ].filter(Boolean)
                  return (
                    <Badge key={chave}>
                      {EQUIPAMENTO_LABELS[chave]}
                      {detalhes.length > 0 ? ` · ${detalhes.join(' · ')}` : ''}
                    </Badge>
                  )
                })}
                {qtdDiasAtivos.map(([chave, label]) => (
                  <Badge key={chave} tone="slate">
                    {label} · {item(chave)?.dias ?? 0} dia(s)
                  </Badge>
                ))}
                {agendamentosAtivos.map(([chave, label]) => (
                  <Badge key={chave} tone="sky">
                    {label}
                    {item(chave)?.data ? ` · ${formatarData(item(chave)!.data as string)}` : ''}
                  </Badge>
                ))}
                {descricoesAtivas.map(([chave, label]) => (
                  <Badge key={chave} tone="amber">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
            {n.necessidadesAdicionais?.trim() && (
              <div className="border-t border-hairline pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
                  Necessidades adicionais
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] text-txt">{n.necessidadesAdicionais}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal index={2}>
        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-[12.5px] text-txt-dim">
            <span>{formulario.imagens.length} imagem(ns)</span>
            <span>{formulario.localizacao ? 'Localização capturada' : 'Sem localização'}</span>
            <span>{formulario.assinaturaDataUrl ? 'Assinatura registrada' : 'Sem assinatura'}</span>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">{label}</p>
      <p className="mt-0.5 text-[12.5px] font-medium text-txt">{value || '—'}</p>
    </div>
  )
}
