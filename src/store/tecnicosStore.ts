import { create } from 'zustand'
import type { Tecnico, Usuario } from '../lib/types'
import { listarTecnicosLocais, removerTecnicoLocal, salvarTecnicoLocal } from '../lib/db'
import { registrarAuditoria } from '../lib/auditoria'

const TECNICOS_PADRAO: Array<Omit<Tecnico, 'id' | 'criadoEm'>> = [
  {
    nome: 'Carlos Almeida',
    empresa: 'SegTrab Engenharia',
    email: 'carlos.almeida@segtrab.com.br',
    telefone: '(11) 98888-1234',
    cargo: 'Técnico de Segurança do Trabalho',
    regiao: 'São Paulo - Capital',
    status: 'ativo',
    observacoes: '',
  },
  {
    nome: 'Fernanda Lima',
    empresa: 'Normatel Engenharia',
    email: 'fernanda.lima@normatel.com.br',
    telefone: '(11) 97777-5678',
    cargo: 'Supervisora de Segurança',
    regiao: 'Grande São Paulo',
    status: 'ativo',
    observacoes: '',
  },
]

interface TecnicosState {
  tecnicos: Tecnico[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (dados: Omit<Tecnico, 'id' | 'criadoEm'>, usuario: Usuario | null) => Promise<Tecnico>
  atualizar: (id: string, patch: Partial<Tecnico>, usuario: Usuario | null) => Promise<void>
  remover: (id: string, usuario: Usuario | null) => Promise<void>
}

let seedEmAndamento: Promise<Tecnico[]> | null = null

async function garantirTecnicosPadrao(): Promise<Tecnico[]> {
  if (seedEmAndamento) return seedEmAndamento

  seedEmAndamento = (async () => {
    const existentes = await listarTecnicosLocais()
    if (existentes.length > 0) return existentes
    const agora = new Date().toISOString()
    for (const tecnico of TECNICOS_PADRAO) {
      await salvarTecnicoLocal({ ...tecnico, id: crypto.randomUUID(), criadoEm: agora })
    }
    return listarTecnicosLocais()
  })()

  try {
    return await seedEmAndamento
  } finally {
    seedEmAndamento = null
  }
}

export const useTecnicosStore = create<TecnicosState>((set, get) => ({
  tecnicos: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const tecnicos = await garantirTecnicosPadrao()
    set({ tecnicos, loading: false })
  },
  criar: async (dados, usuario) => {
    const tecnico: Tecnico = { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }
    await salvarTecnicoLocal(tecnico)
    set({ tecnicos: [...get().tecnicos, tecnico].sort((a, b) => a.nome.localeCompare(b.nome)) })
    await registrarAuditoria({
      acao: 'tecnico_criado',
      entidade: 'tecnico',
      entidadeNome: tecnico.nome,
      detalhes: `Técnico de segurança "${tecnico.nome}" cadastrado.`,
      usuario,
    })
    return tecnico
  },
  atualizar: async (id, patch, usuario) => {
    const atual = get().tecnicos.find((t) => t.id === id)
    if (!atual) return
    const atualizado = { ...atual, ...patch }
    await salvarTecnicoLocal(atualizado)
    set({ tecnicos: get().tecnicos.map((t) => (t.id === id ? atualizado : t)) })
    await registrarAuditoria({
      acao: 'tecnico_editado',
      entidade: 'tecnico',
      entidadeNome: atualizado.nome,
      detalhes: `Técnico de segurança "${atualizado.nome}" atualizado.`,
      usuario,
    })
  },
  remover: async (id, usuario) => {
    const atual = get().tecnicos.find((t) => t.id === id)
    await removerTecnicoLocal(id)
    set({ tecnicos: get().tecnicos.filter((t) => t.id !== id) })
    if (atual) {
      await registrarAuditoria({
        acao: 'tecnico_excluido',
        entidade: 'tecnico',
        entidadeNome: atual.nome,
        detalhes: `Técnico de segurança "${atual.nome}" excluído.`,
        usuario,
      })
    }
  },
}))
