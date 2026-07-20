import { AnimatePresence, motion } from 'framer-motion'
import type { Agendamento, DescricaoItem, QtdDias } from '../../lib/types'
import { SimNaoField } from '../../components/ui/Switch'
import { Input, Textarea } from '../../components/ui/Field'

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
