import type { FormularioAvaliacao } from '../../lib/types'
import { LOTACOES } from '../../lib/types'
import { Input, Select } from '../../components/ui/Field'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Reveal } from '../../components/ui/Reveal'
import { formatarTempoEstimado } from '../../lib/format'
import type { Carteira } from '../../store/carteirasStore'

function lerNumero(valor: string) {
  if (valor === '') return undefined
  const n = Math.max(0, Math.floor(Number(valor)))
  return Number.isFinite(n) ? n : undefined
}

export function StepInfoGerais({
  formulario,
  carteiras,
  onChange,
}: {
  formulario: FormularioAvaliacao
  carteiras: Carteira[]
  onChange: (patch: Partial<FormularioAvaliacao['infoGerais']>) => void
}) {
  const info = formulario.infoGerais
  const carteirasAtivas = carteiras.filter((c) => c.ativo)

  function mudarTempo(patch: Pick<Partial<FormularioAvaliacao['infoGerais']>, 'tempoEstimadoDias' | 'tempoEstimadoHoras'>) {
    const dias = 'tempoEstimadoDias' in patch ? patch.tempoEstimadoDias : info.tempoEstimadoDias
    const horas = 'tempoEstimadoHoras' in patch ? patch.tempoEstimadoHoras : info.tempoEstimadoHoras
    onChange({
      tempoEstimadoDias: dias,
      tempoEstimadoHoras: horas,
      tempoEstimadoExecucao: formatarTempoEstimado(dias, horas),
    })
  }

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
          <div className="sm:col-span-2">
            <Input
              label="Texto breve da solicitação"
              required
              maxLength={120}
              value={info.textoBreve}
              onChange={(e) => onChange({ textoBreve: e.target.value })}
              placeholder="Ex.: Troca de luminárias do corredor"
              hint="Aparece como título da ficha nas listas."
            />
          </div>
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
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">
              Tempo Estimado de Execução <span className="text-viz-red">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={info.tempoEstimadoDias ?? ''}
                onChange={(e) => mudarTempo({ tempoEstimadoDias: lerNumero(e.target.value) })}
                placeholder="Dias"
                aria-label="Dias"
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={info.tempoEstimadoHoras ?? ''}
                onChange={(e) => mudarTempo({ tempoEstimadoHoras: lerNumero(e.target.value) })}
                placeholder="Horas"
                aria-label="Horas"
              />
            </div>
            {/* ficha antiga tem texto livre aqui, mostra pra pessoa nao achar que sumiu */}
            {info.tempoEstimadoExecucao && info.tempoEstimadoDias === undefined && info.tempoEstimadoHoras === undefined && (
              <p className="text-[11px] text-txt-faint">Informado antes: {info.tempoEstimadoExecucao}</p>
            )}
          </fieldset>
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
            {info.lotacao && !(LOTACOES as readonly string[]).includes(info.lotacao) && (
              <option value={info.lotacao}>{info.lotacao} (antiga, escolha 04, 06 ou 09)</option>
            )}
          </Select>
          <Select
            label="Carteira"
            required={carteirasAtivas.length > 0}
            value={info.carteira}
            onChange={(e) => onChange({ carteira: e.target.value })}
          >
            <option value="">{carteirasAtivas.length > 0 ? 'Selecione a carteira' : 'Nenhuma carteira cadastrada'}</option>
            {carteirasAtivas.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
            {info.carteira && !carteirasAtivas.some((c) => c.nome === info.carteira) && (
              <option value={info.carteira}>{info.carteira}</option>
            )}
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
