import type { FormularioAvaliacao } from '../../lib/types'
import { LOTACOES } from '../../lib/types'
import { Input, Select } from '../../components/ui/Field'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Reveal } from '../../components/ui/Reveal'

export function StepInfoGerais({
  formulario,
  onChange,
}: {
  formulario: FormularioAvaliacao
  onChange: (patch: Partial<FormularioAvaliacao['infoGerais']>) => void
}) {
  const info = formulario.infoGerais

  return (
    <Reveal index={0}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Dados básicos da solicitação e da avaliação de serviço.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Responsável"
            required
            value={info.responsavel}
            onChange={(e) => onChange({ responsavel: e.target.value })}
            placeholder="Nome do responsável"
          />
          <Input
            label="Data da Avaliação"
            required
            type="date"
            value={info.dataAvaliacao}
            onChange={(e) => onChange({ dataAvaliacao: e.target.value })}
          />
          <Input
            label="Tempo Estimado de Execução"
            required
            value={info.tempoEstimadoExecucao}
            onChange={(e) => onChange({ tempoEstimadoExecucao: e.target.value })}
            placeholder="Ex.: 3 dias úteis"
          />
          <Input
            label="Nº da Solicitação"
            required
            value={info.numeroSolicitacao}
            onChange={(e) => onChange({ numeroSolicitacao: e.target.value })}
            placeholder="Ex.: SOL-2026-0142"
          />
          <Input
            label="Equipe Necessária"
            required
            value={info.equipeNecessaria}
            onChange={(e) => onChange({ equipeNecessaria: e.target.value })}
            placeholder="Ex.: Manutenção Elétrica"
          />
          {/* Lotação é a base/unidade; o local da atividade continua livre para o
              ponto exato dentro dela (bloco, sala, subestação…). */}
          <Select
            label="Lotação"
            required
            value={info.lotacao}
            onChange={(e) => onChange({ lotacao: e.target.value })}
          >
            <option value="">Selecione a lotação</option>
            {LOTACOES.map((lotacao) => (
              <option key={lotacao} value={lotacao}>
                {lotacao}
              </option>
            ))}
          </Select>
          <Input
            label="Local da Atividade"
            required
            value={info.localAtividade}
            onChange={(e) => onChange({ localAtividade: e.target.value })}
            placeholder="Ex.: Bloco C - Subsolo"
          />
        </CardContent>
      </Card>
    </Reveal>
  )
}
