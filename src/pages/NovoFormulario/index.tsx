import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { criarFormularioVazio } from '../../lib/factory'
import type { FormularioAvaliacao, NecessidadesExecucao } from '../../lib/types'
import { useFormsStore } from '../../store/formsStore'
import { Stepper } from '../../components/ui/Stepper'
import { Button } from '../../components/ui/Button'
import { toast } from '../../store/toastStore'
import { StepInfoGerais } from './StepInfoGerais'
import { StepNecessidades } from './StepNecessidades'
import { StepApoioAnexos } from './StepApoioAnexos'
import { StepRevisao } from './StepRevisao'

const STEPS = [
  { label: 'Informações Gerais', description: 'Dados da solicitação' },
  { label: 'Necessidades', description: 'Recursos e agendamentos' },
  { label: 'Apoio e Anexos', description: 'Fotos, GPS e assinatura' },
  { label: 'Revisão', description: 'Confirmar e enviar' },
]

export function NovoFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { obter, salvarRascunho, enviar } = useFormsStore()

  const [formulario, setFormulario] = useState<FormularioAvaliacao>(criarFormularioVazio)
  const [step, setStep] = useState(0)
  const [loaded, setLoaded] = useState(!id)
  const [enviando, setEnviando] = useState(false)
  const autosaveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    void obter(id).then((existente) => {
      if (existente) setFormulario(existente)
      setLoaded(true)
    })
  }, [id, obter])

  useEffect(() => {
    if (!loaded) return
    window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(() => {
      void salvarRascunho(formulario)
    }, 1200)
    return () => window.clearTimeout(autosaveTimer.current)
  }, [formulario, loaded, salvarRascunho])

  function patch(p: Partial<FormularioAvaliacao>) {
    setFormulario((f) => ({ ...f, ...p }))
  }

  function patchInfo(p: Partial<FormularioAvaliacao['infoGerais']>) {
    setFormulario((f) => ({ ...f, infoGerais: { ...f.infoGerais, ...p } }))
  }

  function patchNecessidades(p: Partial<NecessidadesExecucao>) {
    setFormulario((f) => ({ ...f, necessidades: { ...f.necessidades, ...p } }))
  }

  function proximaEtapa() {
    if (step === 0) {
      const info = formulario.infoGerais
      if (!info.responsavel || !info.dataAvaliacao || !info.tempoEstimadoExecucao || !info.numeroSolicitacao || !info.equipeNecessaria || !info.localAtividade) {
        toast({ variant: 'warning', title: 'Preencha todos os campos obrigatórios', description: 'Complete as Informações Gerais para continuar.' })
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function salvarRascunhoManual() {
    await salvarRascunho(formulario)
    toast({ variant: 'success', title: 'Rascunho salvo', description: 'Você pode continuar mais tarde.' })
  }

  async function enviarFormulario() {
    setEnviando(true)
    try {
      await enviar(formulario)
      toast({ variant: 'success', title: 'Formulário enviado com sucesso' })
      navigate('/historico')
    } catch {
      toast({ variant: 'error', title: 'Falha ao enviar', description: 'O formulário foi salvo e será sincronizado automaticamente.' })
      navigate('/historico')
    } finally {
      setEnviando(false)
    }
  }

  if (!loaded) return null

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-950">Nova Ficha Técnica de Avaliação</h2>
        <p className="text-sm text-brand-700/70">Preencha as etapas abaixo. Seu progresso é salvo automaticamente.</p>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white p-4 sm:p-5">
        <Stepper steps={STEPS} current={step} onStepClick={setStep} />
      </div>

      {step === 0 && <StepInfoGerais formulario={formulario} onChange={patchInfo} />}
      {step === 1 && <StepNecessidades formulario={formulario} onChange={patchNecessidades} />}
      {step === 2 && <StepApoioAnexos formulario={formulario} onPatch={patch} />}
      {step === 3 && <StepRevisao formulario={formulario} />}

      <div className="sticky bottom-16 z-20 flex items-center justify-between gap-2 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-lg shadow-brand-950/5 backdrop-blur sm:bottom-0">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={salvarRascunhoManual}>
            Salvar rascunho
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={proximaEtapa}>Avançar</Button>
          ) : (
            <Button onClick={enviarFormulario} loading={enviando}>
              Enviar formulário
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
