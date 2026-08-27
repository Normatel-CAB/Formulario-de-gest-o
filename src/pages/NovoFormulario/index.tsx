import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { criarFormularioVazio, formularioTemConteudo, normalizarFormulario } from '../../lib/factory'
import type { FormularioAvaliacao, NecessidadesExecucao } from '../../lib/types'
import { useFormsStore } from '../../store/formsStore'
import { useAuthStore } from '../../store/authStore'
import { Stepper } from '../../components/ui/Stepper'
import { Reveal } from '../../components/ui/Reveal'
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
  const usuario = useAuthStore((s) => s.usuario)

  const [formulario, setFormulario] = useState<FormularioAvaliacao>(() => {
    const vazio = criarFormularioVazio()
    if (usuario)
      return {
        ...vazio,
        projeto: usuario.projeto,
        criadoPorId: usuario.id,
        criadoPorNome: usuario.nome,
        criadoPorEmail: usuario.email,
      }
    return vazio
  })
  const [step, setStep] = useState(0)
  const [loaded, setLoaded] = useState(!id)
  const [enviando, setEnviando] = useState(false)
  const autosaveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    void obter(id).then((existente) => {
      if (existente) setFormulario(normalizarFormulario(existente))
      setLoaded(true)
    })
  }, [id, obter])

  useEffect(() => {
    if (!loaded) return
    window.clearTimeout(autosaveTimer.current)
    if (!formularioTemConteudo(formulario)) return
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
      if (
        !info.responsavel ||
        !info.dataAvaliacao ||
        !info.tempoEstimadoExecucao ||
        !info.numeroSolicitacao ||
        !info.equipeNecessaria ||
        !info.lotacao ||
        !info.localAtividade
      ) {
        toast({ variant: 'warning', title: 'Preencha todos os campos obrigatórios', description: 'Complete as Informações Gerais para continuar.' })
        return
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function salvarRascunhoManual() {
    if (!formularioTemConteudo(formulario)) {
      toast({ variant: 'warning', title: 'Nada para salvar', description: 'Preencha ao menos um campo para salvar o rascunho.' })
      return
    }
    await salvarRascunho(formulario)
    toast({ variant: 'success', title: 'Rascunho salvo', description: 'Você pode continuar mais tarde.' })
  }

  async function enviarFormulario() {
    setEnviando(true)
    try {
      await enviar(formulario)
      toast({ variant: 'success', title: 'Formulário enviado com sucesso' })
      finalizarEnvio()
    } catch {
      toast({ variant: 'error', title: 'Falha ao enviar', description: 'O formulário foi salvo e será sincronizado automaticamente.' })
      finalizarEnvio()
    } finally {
      setEnviando(false)
    }
  }

  function finalizarEnvio() {
    if (usuario) {
      navigate('/historico')
      return
    }
    const vazio = criarFormularioVazio()
    setFormulario(vazio)
    setStep(0)
  }

  if (!loaded) return null

  return (
    <div className="space-y-5">
      <Reveal index={0}>
        <div>
          <span className="chip">Ficha Técnica de Avaliação</span>
          <h2 className="mt-3 text-[21px] font-bold leading-tight tracking-[-0.025em] text-txt sm:text-[27px]">
            Nova Ficha Técnica de Avaliação
          </h2>
          <p className="mt-1 text-[13px] text-txt-dim">
            Preencha as etapas abaixo. Seu progresso é salvo automaticamente, mesmo sem internet.
          </p>
        </div>
      </Reveal>

      <Reveal index={1}>
        <div className="glass p-4 sm:p-5">
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </div>
      </Reveal>

      {step === 0 && <StepInfoGerais formulario={formulario} onChange={patchInfo} />}
      {step === 1 && <StepNecessidades formulario={formulario} onChange={patchNecessidades} />}
      {step === 2 && <StepApoioAnexos formulario={formulario} onPatch={patch} />}
      {step === 3 && <StepRevisao formulario={formulario} />}

      <div className="glass safe-bottom sticky bottom-0 z-20 flex items-center gap-2 p-3 sm:bottom-4">
        <Button
          variant="ghost"
          size="md"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className="shrink-0"
        >
          Voltar
        </Button>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <Button variant="outline" onClick={salvarRascunhoManual} className="shrink-0">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 4h11l3 3v13H5z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 4v5h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Salvar rascunho</span>
            <span className="sm:hidden">Rascunho</span>
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={proximaEtapa} className="shrink-0">
              Avançar
            </Button>
          ) : (
            <Button onClick={enviarFormulario} loading={enviando} className="shrink-0">
              <span className="hidden sm:inline">Enviar formulário</span>
              <span className="sm:hidden">Enviar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
