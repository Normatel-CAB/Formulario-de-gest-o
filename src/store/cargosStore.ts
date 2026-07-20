import { create } from 'zustand'
import type { Cargo } from '../lib/types'
import { listarCargosLocais, removerCargoLocal, salvarCargoLocal } from '../lib/db'

const CARGOS_PADRAO = ['Técnico', 'Engenheiro', 'Supervisor', 'Coordenador', 'Administrador do Sistema']

interface CargosState {
  cargos: Cargo[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (nome: string) => Promise<void>
  renomear: (id: string, nome: string) => Promise<void>
  remover: (id: string) => Promise<void>
}

let seedEmAndamento: Promise<Cargo[]> | null = null

async function garantirCargosPadrao(): Promise<Cargo[]> {
  if (seedEmAndamento) return seedEmAndamento

  seedEmAndamento = (async () => {
    const existentes = await listarCargosLocais()
    const nomesExistentes = new Set(existentes.map((c) => c.nome))
    const faltantes = CARGOS_PADRAO.filter((nome) => !nomesExistentes.has(nome))
    for (const nome of faltantes) {
      await salvarCargoLocal({ id: crypto.randomUUID(), nome })
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
    const cargos = await garantirCargosPadrao()
    set({ cargos, loading: false })
  },
  criar: async (nome) => {
    const cargo: Cargo = { id: crypto.randomUUID(), nome }
    await salvarCargoLocal(cargo)
    set({ cargos: [...get().cargos, cargo].sort((a, b) => a.nome.localeCompare(b.nome)) })
  },
  renomear: async (id, nome) => {
    const cargo = { id, nome }
    await salvarCargoLocal(cargo)
    set({ cargos: get().cargos.map((c) => (c.id === id ? cargo : c)) })
  },
  remover: async (id) => {
    await removerCargoLocal(id)
    set({ cargos: get().cargos.filter((c) => c.id !== id) })
  },
}))
