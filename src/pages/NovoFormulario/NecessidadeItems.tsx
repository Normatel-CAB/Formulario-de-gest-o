import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type {
  Agendamento,
  AgendamentoVisitaSMS,
  DescricaoItem,
  EquipamentoItem,
  FormularioAvaliacao,
  QtdDias,
} from '../../lib/types'
import { SimNaoField } from '../../components/ui/Switch'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { listarSolicitacoes } from '../../lib/acesso'

function CondicionalWrapper({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-md border border-hairline bg-surface-2 p-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function QtdDiasField({
  label,
  value,
  onChange,
  fimDeSemana,
}: {
  label: string
  value: QtdDias
  onChange: (v: QtdDias) => void
  fimDeSemana?: boolean
}) {
  return (
    <div className="border-b border-hairline py-2 last:border-none">
      <SimNaoField label={label} checked={value.necessario} onChange={(necessario) => onChange({ ...value, necessario })} />
      <CondicionalWrapper show={value.necessario}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Quantidade de dias"
            type="number"
            min={1}
            value={value.dias ?? ''}
            onChange={(e) => onChange({ ...value, dias: Number(e.target.value) })}
          />
          {fimDeSemana && (
            <div className="flex items-end pb-2.5">
              <SimNaoField
                label="Inclui fim de semana?"
                checked={Boolean(value.fimDeSemana)}
                onChange={(fds) => onChange({ ...value, fimDeSemana: fds })}
              />
            </div>
          )}
        </div>
      </CondicionalWrapper>
    </div>
  )
}

/**
 * Item do bloco de equipamentos. Ao marcar "Sim" pede quantos dias o
 * equipamento fica em campo e a data em que precisa estar no local — as duas
 * informações que a mobilização precisa para reservar máquina e operador.
 */
export function EquipamentoField({
  label,
  value,
  onChange,
}: {
  label: string
  value: EquipamentoItem
  onChange: (v: EquipamentoItem) => void
}) {
  return (
    <div className="border-b border-hairline py-2 last:border-none">
      <SimNaoField label={label} checked={value.necessario} onChange={(necessario) => onChange({ ...value, necessario })} />
      <CondicionalWrapper show={value.necessario}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Quantidade de dias"
            type="number"
            min={1}
            value={value.dias ?? ''}
            onChange={(e) => onChange({ ...value, dias: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Ex.: 2"
          />
          <Input
            label="Data prevista"
            type="date"
            value={value.data ?? ''}
            onChange={(e) => onChange({ ...value, data: e.target.value })}
          />
        </div>
      </CondicionalWrapper>
    </div>
  )
}

export function AgendamentoField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Agendamento
  onChange: (v: Agendamento) => void
}) {
  return (
    <div className="border-b border-hairline py-2 last:border-none">
      <SimNaoField label={label} checked={value.necessario} onChange={(necessario) => onChange({ ...value, necessario })} />
      <CondicionalWrapper show={value.necessario}>
        <Input
          label="Data de agendamento"
          type="date"
          value={value.data ?? ''}
          onChange={(e) => onChange({ ...value, data: e.target.value })}
        />
      </CondicionalWrapper>
    </div>
  )
}

export function DescricaoItemField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: DescricaoItem
  onChange: (v: DescricaoItem) => void
}) {
  return (
    <div className="border-b border-hairline py-2 last:border-none">
      <SimNaoField label={label} checked={value.necessario} onChange={(necessario) => onChange({ ...value, necessario })} />
      <CondicionalWrapper show={value.necessario}>
        <Textarea
          label="Quais?"
          placeholder={placeholder}
          value={value.descricao ?? ''}
          onChange={(e) => onChange({ ...value, descricao: e.target.value })}
        />
      </CondicionalWrapper>
    </div>
  )
}

export function VisitaSMSField({
  value,
  onChange,
}: {
  value: AgendamentoVisitaSMS
  onChange: (v: AgendamentoVisitaSMS) => void
  formulario: FormularioAvaliacao
}) {
  /**
   * A lista vem dos acessos liberados no Supabase.
   *
   * Antes lia as contas locais (IndexedDB), filtrando por cargo "Técnico de
   * Segurança". Com o login só por Microsoft essas contas deixaram de existir e
   * o seletor ficaria vazio em qualquer aparelho novo. Aqui vem quem tem acesso
   * de verdade, que é a mesma lista em todo lugar.
   *
   * A ficha é pública: quem preenche sem login não consegue ler a tabela pelas
   * policies. Nesse caso o campo aceita o nome digitado à mão, senão o passo
   * ficaria intransponível para quem está em campo.
   */
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string; email: string }[]>([])
  const [podeListar, setPodeListar] = useState(true)

  useEffect(() => {
    let ativo = true
    void listarSolicitacoes()
      .then((lista) => {
        if (!ativo) return
        const aprovados = lista
          .filter((s) => s.status === 'aprovado')
          .map((s) => ({ id: s.id, nome: s.nome || s.email.split('@')[0], email: s.email }))
          .sort((a, b) => a.nome.localeCompare(b.nome))
        setTecnicos(aprovados)
        setPodeListar(aprovados.length > 0)
      })
      .catch(() => {
        if (ativo) setPodeListar(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  function selecionarTecnico(tecnicoId: string) {
    const tecnico = tecnicos.find((t) => t.id === tecnicoId)
    onChange({ ...value, tecnicoId, tecnicoNome: tecnico?.nome, tecnicoEmail: tecnico?.email })
  }

  return (
    <div className="border-b border-hairline py-2 last:border-none">
      <SimNaoField
        label="Visita SMS Necessária"
        checked={value.necessario}
        onChange={(necessario) => onChange({ ...value, necessario })}
      />
      <CondicionalWrapper show={value.necessario}>
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-txt-faint">Agendamento da Visita SMS</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Data" type="date" value={value.data ?? ''} onChange={(e) => onChange({ ...value, data: e.target.value })} />
            <Input label="Hora" type="time" value={value.hora ?? ''} onChange={(e) => onChange({ ...value, hora: e.target.value })} />
          </div>
          {podeListar ? (
            <Select
              label="Técnico de Segurança"
              value={value.tecnicoId ?? ''}
              onChange={(e) => selecionarTecnico(e.target.value)}
            >
              <option value="">Selecione um técnico</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label="Técnico de Segurança"
              hint="Digite o nome de quem vai acompanhar a visita."
              value={value.tecnicoNome ?? ''}
              onChange={(e) => onChange({ ...value, tecnicoNome: e.target.value, tecnicoId: '' })}
              placeholder="Nome do técnico"
            />
          )}
          <Textarea
            label="Observações"
            value={value.observacoes ?? ''}
            onChange={(e) => onChange({ ...value, observacoes: e.target.value })}
          />
        </div>
      </CondicionalWrapper>
    </div>
  )
}
