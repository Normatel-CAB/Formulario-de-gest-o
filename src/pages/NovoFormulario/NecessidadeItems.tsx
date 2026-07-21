import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Agendamento, AgendamentoVisitaSMS, DescricaoItem, FormularioAvaliacao, QtdDias } from '../../lib/types'
import { SimNaoField } from '../../components/ui/Switch'
import { Input, Select, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useUsersStore } from '../../store/usersStore'
import { useEmailDraftStore } from '../../store/emailDraftStore'
import { formatarData } from '../../lib/format'

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
          <div className="mt-3 rounded-xl bg-surface-2 p-3">{children}</div>
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
    <div className="border-b border-border py-2 last:border-none">
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
    <div className="border-b border-border py-2 last:border-none">
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
    <div className="border-b border-border py-2 last:border-none">
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

function montarCorpoVisitaSMS(dados: {
  projeto: string
  local: string
  data: string
  hora: string
  responsavel: string
  observacoes: string
}) {
  return `Olá,

Foi solicitada uma Visita SMS.

Dados da solicitação:

• Projeto: ${dados.projeto || '—'}
• Instalação:
• Local: ${dados.local || '—'}
• Data: ${dados.data ? formatarData(dados.data) : '—'}
• Horário: ${dados.hora || '—'}
• Responsável: ${dados.responsavel || '—'}
• Observações: ${dados.observacoes || '—'}

Favor confirmar a disponibilidade.

Atenciosamente.`
}

export function VisitaSMSField({
  value,
  onChange,
  formulario,
}: {
  value: AgendamentoVisitaSMS
  onChange: (v: AgendamentoVisitaSMS) => void
  formulario: FormularioAvaliacao
}) {
  const { usuarios, carregar } = useUsersStore()
  const definirRascunho = useEmailDraftStore((s) => s.definir)
  const navigate = useNavigate()

  useEffect(() => {
    void carregar()
  }, [carregar])

  const tecnicos = useMemo(
    () => usuarios.filter((u) => u.cargo === 'Técnico de Segurança' && u.status === 'ativo'),
    [usuarios],
  )

  function selecionarTecnico(tecnicoId: string) {
    const tecnico = tecnicos.find((t) => t.id === tecnicoId)
    onChange({ ...value, tecnicoId, tecnicoNome: tecnico?.nome, tecnicoEmail: tecnico?.email })
  }

  function gerarEmailSolicitacao() {
    definirRascunho({
      destinatarios: value.tecnicoEmail ? [value.tecnicoEmail] : [],
      assunto: 'Solicitação de Agendamento de Visita SMS',
      corpo: montarCorpoVisitaSMS({
        projeto: formulario.projeto,
        local: formulario.infoGerais.localAtividade,
        data: value.data ?? '',
        hora: value.hora ?? '',
        responsavel: formulario.infoGerais.responsavel,
        observacoes: value.observacoes ?? '',
      }),
      formularioId: formulario.id,
    })
    navigate(`/emails?formularioId=${formulario.id}`)
  }

  return (
    <div className="border-b border-border py-2 last:border-none">
      <SimNaoField
        label="Visita SMS Necessária"
        checked={value.necessario}
        onChange={(necessario) => onChange({ ...value, necessario })}
      />
      <CondicionalWrapper show={value.necessario}>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Agendamento da Visita SMS</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Data" type="date" value={value.data ?? ''} onChange={(e) => onChange({ ...value, data: e.target.value })} />
            <Input label="Hora" type="time" value={value.hora ?? ''} onChange={(e) => onChange({ ...value, hora: e.target.value })} />
          </div>
          <Select label="Técnico de Segurança" value={value.tecnicoId ?? ''} onChange={(e) => selecionarTecnico(e.target.value)}>
            <option value="">Selecione um técnico</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
          <Textarea
            label="Observações"
            value={value.observacoes ?? ''}
            onChange={(e) => onChange({ ...value, observacoes: e.target.value })}
          />
          {value.tecnicoId && (
            <Button type="button" variant="outline" size="sm" onClick={gerarEmailSolicitacao}>
              Gerar E-mail de Solicitação
            </Button>
          )}
        </div>
      </CondicionalWrapper>
    </div>
  )
}
