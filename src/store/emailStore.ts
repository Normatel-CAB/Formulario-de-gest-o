import { create } from 'zustand'
import type { EmailEnviado, ModeloEmail } from '../lib/types'
import {
  listarEmailsEnviadosLocais,
  listarModelosEmailLocais,
  registrarEmailEnviadoLocal,
  removerModeloEmailLocal,
  salvarModeloEmailLocal,
} from '../lib/db'

const MODELOS_PADRAO: Array<Omit<ModeloEmail, 'id' | 'criadoEm'>> = [
  {
    nome: 'Solicitação de Agendamento de Visita SMS',
    assunto: 'Solicitação de Agendamento de Visita SMS',
    corpo:
      'Olá,\n\nFoi solicitada uma Visita SMS.\n\nDados da solicitação:\n\n• Projeto:\n• Instalação:\n• Local:\n• Data:\n• Horário:\n• Responsável:\n• Observações:\n\nFavor confirmar a disponibilidade.\n\nAtenciosamente.',
  },
  {
    nome: 'Encaminhamento de Formulário',
    assunto: 'Ficha Técnica de Avaliação de Serviços',
    corpo: 'Olá,\n\nSegue em anexo a Ficha Técnica de Avaliação de Serviços para sua análise.\n\nAtenciosamente.',
  },
]

interface EmailState {
  modelos: ModeloEmail[]
  enviados: EmailEnviado[]
  loading: boolean
  carregarModelos: () => Promise<void>
  carregarEnviados: () => Promise<void>
  criarModelo: (dados: Omit<ModeloEmail, 'id' | 'criadoEm'>) => Promise<void>
  atualizarModelo: (id: string, patch: Partial<ModeloEmail>) => Promise<void>
  removerModelo: (id: string) => Promise<void>
  enviar: (dados: Omit<EmailEnviado, 'id' | 'criadoEm'>) => Promise<void>
}

let seedEmAndamento: Promise<ModeloEmail[]> | null = null

async function garantirModelosPadrao(): Promise<ModeloEmail[]> {
  if (seedEmAndamento) return seedEmAndamento

  seedEmAndamento = (async () => {
    const existentes = await listarModelosEmailLocais()
    const nomesExistentes = new Set(existentes.map((m) => m.nome))
    const faltantes = MODELOS_PADRAO.filter((m) => !nomesExistentes.has(m.nome))
    const agora = new Date().toISOString()
    for (const modelo of faltantes) {
      await salvarModeloEmailLocal({ ...modelo, id: crypto.randomUUID(), criadoEm: agora })
    }
    return faltantes.length > 0 ? listarModelosEmailLocais() : existentes
  })()

  try {
    return await seedEmAndamento
  } finally {
    seedEmAndamento = null
  }
}

export const useEmailStore = create<EmailState>((set, get) => ({
  modelos: [],
  enviados: [],
  loading: false,
  carregarModelos: async () => {
    set({ loading: true })
    const modelos = await garantirModelosPadrao()
    set({ modelos, loading: false })
  },
  carregarEnviados: async () => {
    const enviados = await listarEmailsEnviadosLocais()
    set({ enviados })
  },
  criarModelo: async (dados) => {
    const modelo: ModeloEmail = { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }
    await salvarModeloEmailLocal(modelo)
    set({ modelos: [...get().modelos, modelo].sort((a, b) => a.nome.localeCompare(b.nome)) })
  },
  atualizarModelo: async (id, patch) => {
    const atual = get().modelos.find((m) => m.id === id)
    if (!atual) return
    const atualizado = { ...atual, ...patch }
    await salvarModeloEmailLocal(atualizado)
    set({ modelos: get().modelos.map((m) => (m.id === id ? atualizado : m)) })
  },
  removerModelo: async (id) => {
    await removerModeloEmailLocal(id)
    set({ modelos: get().modelos.filter((m) => m.id !== id) })
  },
  enviar: async (dados) => {
    const email: EmailEnviado = { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }
    await registrarEmailEnviadoLocal(email)
    set({ enviados: [email, ...get().enviados] })
  },
}))
