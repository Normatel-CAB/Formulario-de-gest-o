import { create } from 'zustand'

export interface EmailDraft {
  destinatarios: string[]
  assunto: string
  corpo: string
  formularioId?: string
}

interface EmailDraftState {
  rascunho: EmailDraft | null
  definir: (rascunho: EmailDraft) => void
  limpar: () => void
}

export const useEmailDraftStore = create<EmailDraftState>((set) => ({
  rascunho: null,
  definir: (rascunho) => set({ rascunho }),
  limpar: () => set({ rascunho: null }),
}))
