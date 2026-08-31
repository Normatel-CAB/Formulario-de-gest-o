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
  // `syncPending` só existe no aparelho. `qtdImagens` é coluna calculada pelo
  // banco (migração 009) e mandá-la de volta faz o Postgres recusar a gravação
  // inteira, com erro de valor não padrão em coluna gerada.
  const { syncPending: _syncPending, qtdImagens: _qtdImagens, ...payload } = formulario
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

/**
 * Colunas da listagem, sem as pesadas.
 *
 * `imagens` e `assinaturaDataUrl` guardam base64 e respondem por quase todo o
 * peso de uma ficha. Nem o Dashboard nem o Histórico mostram foto: eles exibem
 * número, status, data e projeto. Trazer as fotos ali significava baixar
 * dezenas de megabytes para desenhar uma lista de texto, e era essa a lentidão.
 *
 * Quem precisa das fotos busca a ficha inteira na hora: o detalhe, ao abrir, e
 * a exportação, ao exportar (ver `baixarFormularioCompleto`).
 */
const COLUNAS_LISTA =
  'id,createdAt,updatedAt,status,projeto,infoGerais,necessidades,descricaoApoio,observacoes,localizacao,criadoPorId,criadoPorNome,criadoPorEmail,qtdImagens'

export async function baixarFormulariosDaNuvem(): Promise<FormularioAvaliacao[]> {
  if (!supabase || !isSupabaseConfigured) return listarFormulariosLocais()
  const { data, error } = await supabase
    .from(FORMS_TABLE)
    .select(COLUNAS_LISTA)
    .order('updatedAt', { ascending: false })
  if (error || !data) return listarFormulariosLocais()

  const locais = await listarFormulariosLocais()
  const porId = new Map(locais.map((f) => [f.id, f]))

  for (const linha of data as unknown as FormularioAvaliacao[]) {
    const local = porId.get(linha.id)
    await salvarFormularioLocal({
      ...linha,
      // A versão da lista não traz foto. Sem este resgate, gravar por cima
      // apagaria as imagens que já estavam no aparelho, inclusive as de uma
      // ficha ainda na fila de sincronização, que só existem aqui.
      imagens: local?.imagens ?? [],
      assinaturaDataUrl: local?.assinaturaDataUrl,
      syncPending: local?.syncPending,
    })
  }
  return listarFormulariosLocais()
}

/**
 * Ficha completa, com as fotos, direto do banco.
 *
 * Guarda o resultado no IndexedDB para a segunda abertura sair na hora e para
 * a ficha continuar disponível offline depois de vista uma vez.
 */
export async function baixarFormularioCompleto(id: string): Promise<FormularioAvaliacao | undefined> {
  if (!supabase || !isSupabaseConfigured || !navigator.onLine) return obterFormularioLocal(id)
  const { data, error } = await supabase.from(FORMS_TABLE).select('*').eq('id', id).maybeSingle()
  if (error || !data) return obterFormularioLocal(id)

  const local = await obterFormularioLocal(id)
  const completo = { ...(data as FormularioAvaliacao), syncPending: local?.syncPending }
  await salvarFormularioLocal(completo)
  return completo
}

/** As fotos de um intervalo, para a exportação em lote do histórico. */
export async function baixarImagensDoLote(ids: string[]): Promise<Map<string, FormularioAvaliacao>> {
  const mapa = new Map<string, FormularioAvaliacao>()
  if (ids.length === 0) return mapa
  if (!supabase || !isSupabaseConfigured || !navigator.onLine) {
    for (const id of ids) {
      const local = await obterFormularioLocal(id)
      if (local) mapa.set(id, local)
    }
    return mapa
  }

  // Em blocos: uma lista muito longa de ids estoura o tamanho da URL, e o
  // PostgREST manda tudo na query string.
  const TAMANHO_BLOCO = 25
  for (let i = 0; i < ids.length; i += TAMANHO_BLOCO) {
    const bloco = ids.slice(i, i + TAMANHO_BLOCO)
    const { data } = await supabase.from(FORMS_TABLE).select('*').in('id', bloco)
    for (const linha of (data ?? []) as FormularioAvaliacao[]) {
      await salvarFormularioLocal(linha)
      mapa.set(linha.id, linha)
    }
  }
  return mapa
}
