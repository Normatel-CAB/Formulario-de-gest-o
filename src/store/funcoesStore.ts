import { create } from 'zustand'
import type { Funcao, Usuario } from '../lib/types'
import { listarFuncoesLocais, removerFuncaoLocal, salvarFuncaoLocal } from '../lib/db'
import { identificadorFuncao, MODULOS_PERMISSOES } from '../lib/permissoes'
import { registrarAuditoria } from '../lib/auditoria'

interface FuncoesState {
  funcoes: Funcao[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (dados: Omit<Funcao, 'id' | 'identificador' | 'criadoEm' | 'sistema'>, usuario: Usuario | null) => Promise<void>
  atualizar: (id: string, patch: Partial<Funcao>, usuario: Usuario | null) => Promise<void>
  remover: (id: string, usuario: Usuario | null) => Promise<void>
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
  criar: async (dados, usuario) => {
    const identificador = identificadorFuncao(dados.categoria, dados.nome)
    const funcao: Funcao = { ...dados, id: crypto.randomUUID(), identificador, criadoEm: new Date().toISOString() }
    await salvarFuncaoLocal(funcao)
    set({ funcoes: [...get().funcoes, funcao].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome)) })
    await registrarAuditoria({
      acao: 'funcao_criada',
      entidade: 'funcao',
      entidadeNome: funcao.nome,
      detalhes: `Função "${funcao.nome}" criada na categoria "${funcao.categoria}".`,
      usuario,
    })
  },
  atualizar: async (id, patch, usuario) => {
    const atual = get().funcoes.find((f) => f.id === id)
    if (!atual) return
    const atualizada = { ...atual, ...patch }
    await salvarFuncaoLocal(atualizada)
    set({ funcoes: get().funcoes.map((f) => (f.id === id ? atualizada : f)) })
    await registrarAuditoria({
      acao: 'funcao_editada',
      entidade: 'funcao',
      entidadeNome: atualizada.nome,
      detalhes: `Função "${atualizada.nome}" atualizada.`,
      usuario,
    })
  },
  remover: async (id, usuario) => {
    const atual = get().funcoes.find((f) => f.id === id)
    await removerFuncaoLocal(id)
    set({ funcoes: get().funcoes.filter((f) => f.id !== id) })
    if (atual) {
      await registrarAuditoria({
        acao: 'funcao_excluida',
        entidade: 'funcao',
        entidadeNome: atual.nome,
        detalhes: `Função "${atual.nome}" excluída.`,
        usuario,
      })
    }
  },
}))
