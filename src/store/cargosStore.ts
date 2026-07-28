import { create } from 'zustand'
import type { Cargo, StatusRegistro } from '../lib/types'
import { listarCargosLocais, removerCargoLocal, salvarCargoLocal } from '../lib/db'
import { PERMISSOES_ADMINISTRADOR_PADRAO, PERMISSOES_OPERADOR_PADRAO, PERMISSOES_VISUALIZADOR_PADRAO, slugificar } from '../lib/permissoes'

const CARGOS_PADRAO: Array<Omit<Cargo, 'id' | 'criadoEm' | 'atualizadoEm'>> = [
  {
    nome: 'Administrador',
    identificador: 'administrador',
    descricao: 'Acesso total ao sistema, incluindo administração, usuários e cargos.',
    cor: '#0b6e4f',
    icone: 'crown',
    status: 'ativo',
    permissoes: PERMISSOES_ADMINISTRADOR_PADRAO,
    sistema: true,
  },
  {
    nome: 'Operador',
    identificador: 'operador',
    descricao: 'Cria e acompanha formulários de avaliação de serviços.',
    cor: '#2563eb',
    icone: 'user',
    status: 'ativo',
    permissoes: PERMISSOES_OPERADOR_PADRAO,
    sistema: true,
  },
  {
    nome: 'Visualizador',
    identificador: 'visualizador',
    descricao: 'Consulta o dashboard e o histórico em modo somente leitura.',
    cor: '#4b5563',
    icone: 'eye',
    status: 'ativo',
    permissoes: PERMISSOES_VISUALIZADOR_PADRAO,
    sistema: true,
  },
  {
    nome: 'Técnico de Segurança',
    identificador: 'tecnico-de-seguranca',
    descricao: 'Realiza visitas SMS e acompanhamentos técnicos de segurança do trabalho.',
    cor: '#d97706',
    icone: 'wrench',
    status: 'ativo',
    permissoes: PERMISSOES_VISUALIZADOR_PADRAO,
    sistema: false,
  },
]

interface CargosState {
  cargos: Cargo[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (dados: Omit<Cargo, 'id' | 'identificador' | 'criadoEm' | 'atualizadoEm' | 'sistema'>) => Promise<Cargo>
  atualizar: (id: string, patch: Partial<Cargo>) => Promise<void>
  duplicar: (id: string) => Promise<void>
  alternarStatus: (id: string, status: StatusRegistro) => Promise<void>
  remover: (id: string, emUso: boolean) => Promise<{ ok: boolean; motivo?: string }>
}

let seedEmAndamento: Promise<Cargo[]> | null = null

async function garantirCargosPadrao(): Promise<Cargo[]> {
  if (seedEmAndamento) return seedEmAndamento

  seedEmAndamento = (async () => {
    const existentes = await listarCargosLocais()
    const nomesExistentes = new Set(existentes.map((c) => c.nome))
    const faltantes = CARGOS_PADRAO.filter((c) => !nomesExistentes.has(c.nome))
    const agora = new Date().toISOString()
    for (const cargo of faltantes) {
      await salvarCargoLocal({ ...cargo, id: crypto.randomUUID(), criadoEm: agora, atualizadoEm: agora })
    }
    return faltantes.length > 0 ? listarCargosLocais() : existentes
  })()

  try {
    return await seedEmAndamento
  } finally {
    seedEmAndamento = null
  }
}

export const useCargosStore = create<CargosState>((set, get) => ({
  cargos: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const cargos = (await garantirCargosPadrao()).map((c) => ({ ...c, permissoes: c.permissoes ?? [] }))
    set({ cargos, loading: false })
  },
  criar: async (dados) => {
    const agora = new Date().toISOString()
    const cargo: Cargo = {
      ...dados,
      id: crypto.randomUUID(),
      identificador: slugificar(dados.nome),
      criadoEm: agora,
      atualizadoEm: agora,
    }
    await salvarCargoLocal(cargo)
    set({ cargos: [...get().cargos, cargo].sort((a, b) => a.nome.localeCompare(b.nome)) })
    return cargo
  },
  atualizar: async (id, patch) => {
    const atual = get().cargos.find((c) => c.id === id)
    if (!atual) return
    const atualizado: Cargo = { ...atual, ...patch, atualizadoEm: new Date().toISOString() }
    await salvarCargoLocal(atualizado)
    set({ cargos: get().cargos.map((c) => (c.id === id ? atualizado : c)) })
  },
  duplicar: async (id) => {
    const original = get().cargos.find((c) => c.id === id)
    if (!original) return
    const agora = new Date().toISOString()
    let nome = `${original.nome} (cópia)`
    let contador = 2
    while (get().cargos.some((c) => c.nome === nome)) {
      nome = `${original.nome} (cópia ${contador})`
      contador += 1
    }
    const copia: Cargo = {
      ...original,
      id: crypto.randomUUID(),
      nome,
      identificador: slugificar(nome),
      sistema: false,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    await salvarCargoLocal(copia)
    set({ cargos: [...get().cargos, copia].sort((a, b) => a.nome.localeCompare(b.nome)) })
  },
  alternarStatus: async (id, status) => {
    const atual = get().cargos.find((c) => c.id === id)
    if (!atual) return
    const atualizado = { ...atual, status, atualizadoEm: new Date().toISOString() }
    await salvarCargoLocal(atualizado)
    set({ cargos: get().cargos.map((c) => (c.id === id ? atualizado : c)) })
  },
  remover: async (id, emUso) => {
    const atual = get().cargos.find((c) => c.id === id)
    if (!atual) return { ok: false, motivo: 'Cargo não encontrado.' }
    if (atual.sistema) return { ok: false, motivo: 'Cargos padrão do sistema não podem ser excluídos.' }
    if (emUso) return { ok: false, motivo: 'Este cargo está em uso por um ou mais usuários e não pode ser excluído.' }

    await removerCargoLocal(id)
    set({ cargos: get().cargos.filter((c) => c.id !== id) })
    return { ok: true }
  },
}))
