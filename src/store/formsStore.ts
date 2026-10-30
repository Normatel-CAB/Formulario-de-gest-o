import { create } from 'zustand'
import type { FormularioAvaliacao, FormStatus } from '../lib/types'
import {
  listarFormulariosLocais,
  obterFormularioLocal,
  removerFormularioLocal,
  salvarFormularioLocal,
  enfileirarSincronizacao,
  removerDaFila,
} from '../lib/db'
import {
  enviarFormularioParaNuvem,
  atualizarStatusNaNuvem,
  excluirFormularioDaNuvem,
  RecusaDoServidor,
  sincronizarPendentes,
  baixarFormulariosDaNuvem,
  baixarFormularioCompleto,
} from '../lib/sync'
import { isSupabaseConfigured } from '../lib/supabase'
import { normalizarFormulario } from '../lib/factory'

interface FormsState {
  formularios: FormularioAvaliacao[]
  loading: boolean
  carregar: () => Promise<void>
  obter: (id: string) => Promise<FormularioAvaliacao | undefined>
  salvarRascunho: (formulario: FormularioAvaliacao) => Promise<void>
  enviar: (formulario: FormularioAvaliacao, manterStatus?: boolean) => Promise<void>
  atualizarStatus: (id: string, status: FormStatus, justificativaCompras?: string) => Promise<void>
  remover: (id: string) => Promise<void>
}

export const useFormsStore = create<FormsState>((set) => ({
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
  /**
   * Ficha completa, com as fotos.
   *
   * A listagem não traz `imagens` de propósito (ver COLUNAS_LISTA em sync.ts),
   * então a cópia em memória quase sempre vem sem foto. Aqui a ficha é buscada
   * inteira, e só aqui: é a tela que realmente mostra as imagens.
   */
  obter: async (id) => {
    const local = await obterFormularioLocal(id)
    const temFotoLocal = Boolean(local?.imagens?.length) || Boolean(local?.assinaturaDataUrl)

    // Rascunho ainda não sincronizado só existe no aparelho: buscar na nuvem
    // devolveria uma versão antiga ou nada.
    if (local?.syncPending) return normalizarFormulario(local)
    if (temFotoLocal && local) return normalizarFormulario(local)

    const completo = await baixarFormularioCompleto(id)
    return completo ? normalizarFormulario(completo) : local ? normalizarFormulario(local) : undefined
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
  enviar: async (formulario, manterStatus = false) => {
    const atualizado: FormularioAvaliacao = {
      ...formulario,
      status: manterStatus ? formulario.status : 'enviado',
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
      } catch (err) {
        if (err instanceof RecusaDoServidor) {
          const devolvido = { ...formulario, syncPending: false }
          await salvarFormularioLocal(devolvido)
          set((s) => ({ formularios: s.formularios.map((f) => (f.id === devolvido.id ? devolvido : f)) }))
          throw err
        }
        await enfileirarSincronizacao(atualizado.id)
      }
    } else {
      await enfileirarSincronizacao(atualizado.id)
    }
  },
  atualizarStatus: async (id, status, justificativaCompras) => {
    const formulario = await obterFormularioLocal(id)
    if (!formulario) throw new Error('Ficha não encontrada neste aparelho.')
    const updatedAt = new Date().toISOString()
    if (isSupabaseConfigured) {
      if (!navigator.onLine) throw new Error('Sem conexão. Conecte-se para alterar o status.')
      await atualizarStatusNaNuvem(id, status, updatedAt, justificativaCompras)
    }
    const atualizado = {
      ...formulario,
      status,
      updatedAt,
      ...(justificativaCompras === undefined ? {} : { justificativaCompras }),
    }
    await salvarFormularioLocal(atualizado)
    set((s) => ({ formularios: s.formularios.map((f) => (f.id === id ? atualizado : f)) }))
  },
  remover: async (id) => {
    const local = await obterFormularioLocal(id)
    const soNoAparelho = local?.status === 'rascunho' || (local?.syncPending && local.status === 'enviado')
    if (isSupabaseConfigured) {
      if (!navigator.onLine && !soNoAparelho) throw new Error('Sem conexão. Conecte-se para excluir a ficha.')
      if (navigator.onLine) {
        const apagadas = await excluirFormularioDaNuvem(id)
        if (apagadas === 0 && !soNoAparelho) throw new RecusaDoServidor('Você não tem permissão para excluir esta ficha.')
      }
    }
    await removerDaFila(id)
    await removerFormularioLocal(id)
    set((s) => ({ formularios: s.formularios.filter((f) => f.id !== id) }))
  },
}))

export async function forcarSincronizacao() {
  await sincronizarPendentes()
}
