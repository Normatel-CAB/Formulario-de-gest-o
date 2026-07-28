import type { FormularioAvaliacao, NecessidadesExecucao } from '../../lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Field'
import { AgendamentoField, DescricaoItemField, QtdDiasField, VisitaSMSField } from './NecessidadeItems'

export function StepNecessidades({
  formulario,
  onChange,
}: {
  formulario: FormularioAvaliacao
  onChange: (patch: Partial<NecessidadesExecucao>) => void
}) {
  const n = formulario.necessidades

  return (
    <div className="space-y-4">
      <Card className="animate-slide-up">
        <CardHeader>
          <div>
            <CardTitle>Necessidades da Execução</CardTitle>
            <CardDescription>Indique os recursos necessários para a atividade. Campos condicionais aparecem ao marcar "Sim".</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <QtdDiasField label="PEMT" value={n.pemt} onChange={(v) => onChange({ pemt: v })} />
          <QtdDiasField label="Limpeza de Área" value={n.limpezaArea} onChange={(v) => onChange({ limpezaArea: v })} fimDeSemana />
          <QtdDiasField
            label="Comunicações Operantes"
            value={n.comunicacoesOperantes}
            onChange={(v) => onChange({ comunicacoesOperantes: v })}
            fimDeSemana
          />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <AgendamentoField label="Visita Técnica" value={n.visitaTecnica} onChange={(v) => onChange({ visitaTecnica: v })} />
          <AgendamentoField label="Montagem de Andaime" value={n.montagemAndaime} onChange={(v) => onChange({ montagemAndaime: v })} />
          <VisitaSMSField value={n.visitaSMS} onChange={(v) => onChange({ visitaSMS: v })} formulario={formulario} />
          <AgendamentoField label="Caminhão Munck" value={n.caminhaoMunck} onChange={(v) => onChange({ caminhaoMunck: v })} />
          <AgendamentoField label="Veículo" value={n.veiculo} onChange={(v) => onChange({ veiculo: v })} />
          <AgendamentoField label="LIBRA" value={n.libra} onChange={(v) => onChange({ libra: v })} />
          <AgendamentoField label="AR2" value={n.ar2} onChange={(v) => onChange({ ar2: v })} />
          <AgendamentoField label="Desligamento Elétrico" value={n.desligamentoEletrico} onChange={(v) => onChange({ desligamentoEletrico: v })} />
          <AgendamentoField label="Desligamento SDAI" value={n.desligamentoSDAI} onChange={(v) => onChange({ desligamentoSDAI: v })} />
          <AgendamentoField label="Desligamento FM200" value={n.desligamentoFM200} onChange={(v) => onChange({ desligamentoFM200: v })} />
          <AgendamentoField
            label="Remanejamento de Mobiliário"
            value={n.remanejamentoMobiliario}
            onChange={(v) => onChange({ remanejamentoMobiliario: v })}
          />
        </CardContent>
      </Card>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Materiais e Apoio</CardTitle>
        </CardHeader>
        <CardContent>
          <DescricaoItemField
            label="Material específico"
            placeholder="Descreva os materiais necessários"
            value={n.materialEspecifico}
            onChange={(v) => onChange({ materialEspecifico: v })}
          />
          <DescricaoItemField
            label="Locação de Máquinas/Ferramentas"
            placeholder="Descreva as máquinas ou ferramentas necessárias"
            value={n.locacaoMaquinas}
            onChange={(v) => onChange({ locacaoMaquinas: v })}
          />
          <DescricaoItemField
            label="Apoio de outra equipe"
            placeholder="Qual equipe?"
            value={n.apoioOutraEquipe}
            onChange={(v) => onChange({ apoioOutraEquipe: v })}
          />
          <div className="pt-2">
            <Textarea
              label="Necessidades adicionais"
              hint="Opcional. Descreva outras necessidades não listadas acima."
              value={n.necessidadesAdicionais ?? ''}
              onChange={(e) => onChange({ necessidadesAdicionais: e.target.value })}
              placeholder="Descreva necessidades adicionais, se houver"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
