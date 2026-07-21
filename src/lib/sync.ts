import { supabase, FORMS_TABLE, isSupabaseConfigured } from './supabase'
import {
  listarFila,
  obterFormularioLocal,
  removerDaFila,
  salvarFormularioLocal,
  listarFormulariosLocais,
} from './db'
import type { FormularioAvaliacao } from './types'

type Listener = (state: SyncState) => void

export interface SyncState {
  syncing: boolean
  pending: number
  lastSyncAt: string | null
  online: boolean
}

const state: SyncState = {
  syncing: false,
  pending: 0,
  lastSyncAt: null,
  online: navigator.onLine,
}

const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l(state)
}

export function subscribeSync(listener: Listener) {
  listeners.add(listener)
  listener(state)
  return () => {
    listeners.delete(listener)
  }
}

async function refreshPendingCount() {
  const fila = await listarFila()
  state.pending = fila.length
  emit()
}

export async function enviarFormularioParaNuvem(formulario: FormularioAvaliacao) {
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase não configurado')
  const { syncPending: _syncPending, ...payload } = formulario
  const { error } = await supabase.from(FORMS_TABLE).upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function sincronizarPendentes() {
  if (!isSupabaseConfigured || !navigator.onLine || state.syncing) return
  state.syncing = true
  emit()
  try {
    const fila = await listarFila()
    for (const item of fila) {
      const formulario = await obterFormularioLocal(item.formularioId)
      if (!formulario) {
        await removerDaFila(item.formularioId)
        continue
      }
      try {
        await enviarFormularioParaNuvem(formulario)
        formulario.syncPending = false
        await salvarFormularioLocal(formulario)
        await removerDaFila(item.formularioId)
      } catch {
        // mantém na fila para nova tentativa
      }
    }
    state.lastSyncAt = new Date().toISOString()
  } finally {
    state.syncing = false
    await refreshPendingCount()
  }
}

export function iniciarSincronizacaoAutomatica() {
  const onOnline = () => {
    state.online = true
    emit()
    void sincronizarPendentes()
  }
  const onOffline = () => {
    state.online = false
    emit()
  }
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  void refreshPendingCount()
  if (navigator.onLine) void sincronizarPendentes()
  const interval = window.setInterval(() => {
    if (navigator.onLine) void sincronizarPendentes()
  }, 60_000)
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    window.clearInterval(interval)
  }
}

export async function baixarFormulariosDaNuvem(): Promise<FormularioAvaliacao[]> {
  if (!supabase || !isSupabaseConfigured) return listarFormulariosLocais()
  const { data, error } = await supabase
    .from(FORMS_TABLE)
    .select('*')
    .order('updatedAt', { ascending: false })
  if (error || !data) return listarFormulariosLocais()
  for (const formulario of data as FormularioAvaliacao[]) {
    await salvarFormularioLocal(formulario)
  }
  return listarFormulariosLocais()
}
