import { create } from 'zustand'
import type { FormularioAvaliacao, FormStatus } from '../lib/types'
import {
  listarFormulariosLocais,
  obterFormularioLocal,
  removerFormularioLocal,
  salvarFormularioLocal,
  enfileirarSincronizacao,
} from '../lib/db'
import { enviarFormularioParaNuvem, sincronizarPendentes, baixarFormulariosDaNuvem } from '../lib/sync'
import { isSupabaseConfigured } from '../lib/supabase'
import { normalizarFormulario } from '../lib/factory'

interface FormsState {
  formularios: FormularioAvaliacao[]
  loading: boolean
  carregar: () => Promise<void>
  obter: (id: string) => Promise<FormularioAvaliacao | undefined>
  salvarRascunho: (formulario: FormularioAvaliacao) => Promise<void>
  enviar: (formulario: FormularioAvaliacao) => Promise<void>
  atualizarStatus: (id: string, status: FormStatus) => Promise<void>
  remover: (id: string) => Promise<void>
}

export const useFormsStore = create<FormsState>((set, get) => ({
  formularios: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const locais = await listarFormulariosLocais()
    set({ formularios: locais.map(normalizarFormulario), loading: false })
    if (isSupabaseConfigured && navigator.onLine) {
      const remotos = await baixarFormulariosDaNuvem()
      set({ formularios: remotos.map(normalizarFormulario) })
    }
  },
  obter: async (id) => {
    const emMemoria = get().formularios.find((f) => f.id === id)
    if (emMemoria) return normalizarFormulario(emMemoria)
    const local = await obterFormularioLocal(id)
    return local ? normalizarFormulario(local) : undefined
  },
  salvarRascunho: async (formulario) => {
    const atualizado: FormularioAvaliacao = {
      ...formulario,
      status: 'rascunho',
      updatedAt: new Date().toISOString(),
    }
    await salvarFormularioLocal(atualizado)
    set((s) => ({
      formularios: [atualizado, ...s.formularios.filter((f) => f.id !== atualizado.id)],
    }))
  },
  enviar: async (formulario) => {
    const atualizado: FormularioAvaliacao = {
      ...formulario,
      status: 'enviado',
      updatedAt: new Date().toISOString(),
      syncPending: true,
    }
    await salvarFormularioLocal(atualizado)
    set((s) => ({
      formularios: [atualizado, ...s.formularios.filter((f) => f.id !== atualizado.id)],
    }))

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await enviarFormularioParaNuvem(atualizado)
        atualizado.syncPending = false
        await salvarFormularioLocal(atualizado)
        set((s) => ({
          formularios: s.formularios.map((f) => (f.id === atualizado.id ? atualizado : f)),
        }))
        return
      } catch {
        await enfileirarSincronizacao(atualizado.id)
      }
    } else {
      await enfileirarSincronizacao(atualizado.id)
    }
  },
  atualizarStatus: async (id, status) => {
    const formulario = await obterFormularioLocal(id)
    if (!formulario) return
    const atualizado = { ...formulario, status, updatedAt: new Date().toISOString() }
    await salvarFormularioLocal(atualizado)
    set((s) => ({ formularios: s.formularios.map((f) => (f.id === id ? atualizado : f)) }))
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await enviarFormularioParaNuvem(atualizado)
      } catch {
        await enfileirarSincronizacao(id)
      }
    }
  },
  remover: async (id) => {
    await removerFormularioLocal(id)
    set((s) => ({ formularios: s.formularios.filter((f) => f.id !== id) }))
  },
}))

export async function forcarSincronizacao() {
  await sincronizarPendentes()
}
