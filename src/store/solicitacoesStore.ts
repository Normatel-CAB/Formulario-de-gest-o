import { create } from 'zustand'
import type { Papel } from '../lib/types'
import {
  cadastrarAcessoAprovado,
  decidirSolicitacao,
  listarSolicitacoes,
  reabrirSolicitacao,
  type SolicitacaoAcesso,
} from '../lib/acesso'

interface SolicitacoesState {
  solicitacoes: SolicitacaoAcesso[]
  loading: boolean
  erro: string | null
  carregar: () => Promise<void>
  aprovar: (id: string, papel: Papel, projeto: string, decididoPor: string) => Promise<void>
  rejeitar: (id: string, observacao: string, decididoPor: string) => Promise<void>
  reabrir: (id: string) => Promise<void>
  cadastrar: (email: string, papel: Papel, projeto: string, decididoPor: string) => Promise<void>
}

export const useSolicitacoesStore = create<SolicitacoesState>((set, get) => ({
  solicitacoes: [],
  loading: false,
  erro: null,
  carregar: async () => {
    set({ loading: true, erro: null })
    try {
      set({ solicitacoes: await listarSolicitacoes(), loading: false })
    } catch (err) {
      // A causa mais comum é a migração 002 não ter sido rodada; a mensagem
      // aparece na tela em vez de deixar uma lista vazia enganosa.
      set({ loading: false, erro: err instanceof Error ? err.message : 'Falha ao carregar solicitações.' })
    }
  },
  aprovar: async (id, papel, projeto, decididoPor) => {
    await decidirSolicitacao(id, { status: 'aprovado', papel, projeto }, decididoPor)
    await get().carregar()
  },
  rejeitar: async (id, observacao, decididoPor) => {
    await decidirSolicitacao(id, { status: 'rejeitado', observacao }, decididoPor)
    await get().carregar()
  },
  reabrir: async (id) => {
    await reabrirSolicitacao(id)
    await get().carregar()
  },
  cadastrar: async (email, papel, projeto, decididoPor) => {
    await cadastrarAcessoAprovado(email, papel, projeto, decididoPor)
    await get().carregar()
  },
}))
