import { create } from 'zustand'
import type { RegistroAuditoria } from '../lib/types'
import { listarAuditoriaLocal } from '../lib/db'

interface AuditoriaState {
  registros: RegistroAuditoria[]
  loading: boolean
  carregar: () => Promise<void>
}

export const useAuditoriaStore = create<AuditoriaState>((set) => ({
  registros: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const registros = await listarAuditoriaLocal(50)
    set({ registros, loading: false })
  },
}))
