import { create } from 'zustand'
import { obterConfiguracao, salvarConfiguracao } from '../lib/db'

interface SettingsState {
  logoDataUrl: string | null
  empresaNome: string
  loaded: boolean
  init: () => Promise<void>
  setLogo: (dataUrl: string | null) => Promise<void>
  setEmpresaNome: (nome: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  logoDataUrl: null,
  empresaNome: '',
  loaded: false,
  init: async () => {
    const [logo, nome] = await Promise.all([
      obterConfiguracao<string>('logoDataUrl'),
      obterConfiguracao<string>('empresaNome'),
    ])
    set({ logoDataUrl: logo ?? null, empresaNome: nome ?? '', loaded: true })
  },
  setLogo: async (dataUrl) => {
    await salvarConfiguracao('logoDataUrl', dataUrl)
    set({ logoDataUrl: dataUrl })
  },
  setEmpresaNome: async (nome) => {
    await salvarConfiguracao('empresaNome', nome)
    set({ empresaNome: nome })
  },
}))
