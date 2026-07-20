import type { FormularioAvaliacao } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatarData } from '../../lib/format'

const AGENDAMENTO_LABELS: Record<string, string> = {
  visitaTecnica: 'Visita Técnica',
  montagemAndaime: 'Montagem de Andaime',
  visitaSMS: 'Visita SMS',
  caminhaoMunck: 'Caminhão Munck',
  veiculo: 'Veículo',
  libra: 'LIBRA',
  ar2: 'AR2',
  desligamentoEletrico: 'Desligamento Elétrico',
  desligamentoSDAI: 'Desligamento SDAI',
  desligamentoFM200: 'Desligamento FM200',
  remanejamentoMobiliario: 'Remanejamento de Mobiliário',
}

const QTD_DIAS_LABELS: Record<string, string> = {
  pemt: 'PEMT',
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

  const qtdDiasAtivos = Object.entries(QTD_DIAS_LABELS).filter(([key]) => (n as any)[key].necessario)
  const agendamentosAtivos = Object.entries(AGENDAMENTO_LABELS).filter(([key]) => (n as any)[key].necessario)
  const descricoesAtivas = Object.entries(DESCRICAO_LABELS).filter(([key]) => (n as any)[key].necessario)

  return (
    <div className="space-y-4">
      <Card className="animate-slide-up">
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
          <InfoRow label="Local da Atividade" value={info.localAtividade} />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Necessidades selecionadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {qtdDiasAtivos.length === 0 && agendamentosAtivos.length === 0 && descricoesAtivas.length === 0 ? (
            <p className="text-sm text-brand-500">Nenhuma necessidade marcada como "Sim".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {qtdDiasAtivos.map(([key, label]) => (
                <Badge key={key}>{label} · {(n as any)[key].dias ?? 0} dia(s)</Badge>
              ))}
              {agendamentosAtivos.map(([key, label]) => (
                <Badge key={key} tone="sky">
                  {label} {(n as any)[key].data ? `· ${formatarData((n as any)[key].data)}` : ''}
                </Badge>
              ))}
              {descricoesAtivas.map(([key, label]) => (
                <Badge key={key} tone="amber">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-brand-700">
          <span>{formulario.imagens.length} imagem(ns)</span>
          <span>{formulario.localizacao ? 'Localização capturada' : 'Sem localização'}</span>
          <span>{formulario.assinaturaDataUrl ? 'Assinatura registrada' : 'Sem assinatura'}</span>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-500">{label}</p>
      <p className="text-sm font-medium text-brand-950">{value || '—'}</p>
    </div>
  )
}
