import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTecnicosStore } from '../../store/tecnicosStore'
import { useSmsStore } from '../../store/smsStore'
import { useAuthStore } from '../../store/authStore'
import { useEmailDraftStore } from '../../store/emailDraftStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../store/toastStore'
import { formatarData } from '../../lib/format'
import type { Tecnico } from '../../lib/types'
import { cn } from '../../lib/cn'

function montarCorpoEmail(dados: {
  instalacao: string
  local: string
  data: string
  horario: string
  responsavel: string
  observacoes: string
}) {
  return `Olá,

Gostaríamos de solicitar um agendamento para acompanhamento técnico.

Dados:

• Instalação: ${dados.instalacao || '—'}
• Local: ${dados.local || '—'}
• Data: ${dados.data ? formatarData(dados.data) : '—'}
• Horário: ${dados.horario || '—'}
• Responsável: ${dados.responsavel || '—'}
• Observações: ${dados.observacoes || '—'}

Favor confirmar a disponibilidade.

Atenciosamente.`
}

export function SolicitacaoSMS() {
  const { tecnicos, carregar } = useTecnicosStore()
  const { solicitar } = useSmsStore()
  const usuario = useAuthStore((s) => s.usuario)
  const definirRascunho = useEmailDraftStore((s) => s.definir)
  const navigate = useNavigate()

  const [buscaTecnico, setBuscaTecnico] = useState('')
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<Tecnico | null>(null)
  const [dataDesejada, setDataDesejada] = useState('')
  const [horaDesejada, setHoraDesejada] = useState('')
  const [local, setLocal] = useState('')
  const [instalacao, setInstalacao] = useState('')
  const [responsavel, setResponsavel] = useState(usuario?.nome ?? '')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    void carregar()
  }, [carregar])

  const tecnicosFiltrados = useMemo(() => {
    const termo = buscaTecnico.trim().toLowerCase()
    return tecnicos.filter(
      (t) => t.status === 'ativo' && (!termo || t.nome.toLowerCase().includes(termo) || t.empresa.toLowerCase().includes(termo)),
    )
  }, [tecnicos, buscaTecnico])

  async function solicitarAgendamento() {
    if (!tecnicoSelecionado) {
      toast({ variant: 'warning', title: 'Selecione um técnico de segurança' })
      return
    }
    if (!dataDesejada || !horaDesejada) {
      toast({ variant: 'warning', title: 'Informe a data e o horário desejados' })
      return
    }
    setEnviando(true)
    try {
      await solicitar(
        {
          tecnicoId: tecnicoSelecionado.id,
          tecnicoNome: tecnicoSelecionado.nome,
          tecnicoEmail: tecnicoSelecionado.email,
          dataDesejada,
          horaDesejada,
          local,
          instalacao,
          responsavel,
          observacoes,
          criadoPorId: usuario?.id ?? '',
          criadoPorNome: usuario?.nome ?? '',
        },
        usuario,
      )

      definirRascunho({
        destinatarios: [tecnicoSelecionado.email],
        assunto: 'Solicitação de Agendamento',
        corpo: montarCorpoEmail({ instalacao, local, data: dataDesejada, horario: horaDesejada, responsavel, observacoes }),
      })

      toast({ variant: 'success', title: 'Solicitação registrada', description: 'Revise o e-mail antes de enviar.' })
      navigate('/emails')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Solicitação de SMS</h2>
        <p className="text-sm text-ink-muted">Solicite o agendamento de acompanhamento com o Supervisor/Técnico de Segurança.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Técnico de Segurança</CardTitle>
            <CardDescription>Pesquise e selecione o técnico responsável pelo acompanhamento.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Pesquisar técnico por nome ou empresa" value={buscaTecnico} onChange={(e) => setBuscaTecnico(e.target.value)} />
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border p-1.5">
            {tecnicosFiltrados.length === 0 ? (
              <p className="p-3 text-sm text-ink-muted">Nenhum técnico encontrado.</p>
            ) : (
              tecnicosFiltrados.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTecnicoSelecionado(t)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors',
                    tecnicoSelecionado?.id === t.id ? 'bg-brand-500/15' : 'hover:bg-surface-2',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.nome}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      {t.empresa} · {t.email}
                    </p>
                  </div>
                  {tecnicoSelecionado?.id === t.id && <Badge tone="brand">Selecionado</Badge>}
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do agendamento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input label="Data desejada" required type="date" value={dataDesejada} onChange={(e) => setDataDesejada(e.target.value)} />
          <Input label="Hora desejada" required type="time" value={horaDesejada} onChange={(e) => setHoraDesejada(e.target.value)} />
          <Input label="Local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: Bloco A - Térreo" />
          <Input label="Instalação" value={instalacao} onChange={(e) => setInstalacao(e.target.value)} placeholder="Ex.: Subestação 02" />
          <Input label="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          <Textarea label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="sm:col-span-2" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={solicitarAgendamento} loading={enviando}>
          Solicitar Agendamento
        </Button>
      </div>
    </div>
  )
}
