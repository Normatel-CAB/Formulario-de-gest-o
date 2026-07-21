import { create } from 'zustand'
import type { Funcao } from '../lib/types'
import { listarFuncoesLocais, removerFuncaoLocal, salvarFuncaoLocal } from '../lib/db'
import { identificadorFuncao, MODULOS_PERMISSOES } from '../lib/permissoes'

interface FuncoesState {
  funcoes: Funcao[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (dados: Omit<Funcao, 'id' | 'identificador' | 'criadoEm' | 'sistema'>) => Promise<void>
  atualizar: (id: string, patch: Partial<Funcao>) => Promise<void>
  remover: (id: string) => Promise<void>
}

let seedEmAndamento: Promise<Funcao[]> | null = null

async function garantirFuncoesPadrao(): Promise<Funcao[]> {
  if (seedEmAndamento) return seedEmAndamento

  seedEmAndamento = (async () => {
    const existentes = await listarFuncoesLocais()
    const identificadoresExistentes = new Set(existentes.map((f) => f.identificador))
    const agora = new Date().toISOString()
    let inseriu = false

    for (const modulo of MODULOS_PERMISSOES) {
      for (const acao of modulo.acoes) {
        const identificador = identificadorFuncao(modulo.categoria, acao)
        if (identificadoresExistentes.has(identificador)) continue
        await salvarFuncaoLocal({
          id: crypto.randomUUID(),
          nome: acao,
          identificador,
          categoria: modulo.categoria,
          descricao: `Permite ${acao.toLowerCase()} em ${modulo.categoria.toLowerCase()}.`,
          icone: 'check-circle',
          status: 'ativo',
          sistema: true,
          criadoEm: agora,
        })
        inseriu = true
      }
    }

    return inseriu ? listarFuncoesLocais() : existentes
  })()

  try {
    return await seedEmAndamento
  } finally {
    seedEmAndamento = null
  }
}

export const useFuncoesStore = create<FuncoesState>((set, get) => ({
  funcoes: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const funcoes = await garantirFuncoesPadrao()
    set({ funcoes, loading: false })
  },
  criar: async (dados) => {
    const identificador = identificadorFuncao(dados.categoria, dados.nome)
    const funcao: Funcao = { ...dados, id: crypto.randomUUID(), identificador, criadoEm: new Date().toISOString() }
    await salvarFuncaoLocal(funcao)
    set({ funcoes: [...get().funcoes, funcao].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome)) })
  },
  atualizar: async (id, patch) => {
    const atual = get().funcoes.find((f) => f.id === id)
    if (!atual) return
    const atualizada = { ...atual, ...patch }
    await salvarFuncaoLocal(atualizada)
    set({ funcoes: get().funcoes.map((f) => (f.id === id ? atualizada : f)) })
  },
  remover: async (id) => {
    await removerFuncaoLocal(id)
    set({ funcoes: get().funcoes.filter((f) => f.id !== id) })
  },
}))
