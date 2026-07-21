import { create } from 'zustand'
import type { SolicitacaoSMS, Usuario } from '../lib/types'
import { listarSolicitacoesSMSLocais, registrarSolicitacaoSMSLocal } from '../lib/db'
import { registrarAuditoria } from '../lib/auditoria'

interface SmsState {
  solicitacoes: SolicitacaoSMS[]
  loading: boolean
  carregar: () => Promise<void>
  solicitar: (dados: Omit<SolicitacaoSMS, 'id' | 'criadoEm'>, usuario: Usuario | null) => Promise<SolicitacaoSMS>
}

export const useSmsStore = create<SmsState>((set, get) => ({
  solicitacoes: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const solicitacoes = await listarSolicitacoesSMSLocais()
    set({ solicitacoes, loading: false })
  },
  solicitar: async (dados, usuario) => {
    const solicitacao: SolicitacaoSMS = { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }
    await registrarSolicitacaoSMSLocal(solicitacao)
    set({ solicitacoes: [solicitacao, ...get().solicitacoes] })
    await registrarAuditoria({
      acao: 'sms_solicitado',
      entidade: 'sms',
      entidadeNome: solicitacao.tecnicoNome,
      detalhes: `Agendamento solicitado ao técnico "${solicitacao.tecnicoNome}" para ${solicitacao.dataDesejada || 'data a definir'}.`,
      usuario,
    })
    return solicitacao
  },
}))
