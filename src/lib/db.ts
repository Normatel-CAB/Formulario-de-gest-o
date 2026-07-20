import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { FormularioAvaliacao } from './types'

interface GestaoDB extends DBSchema {
  formularios: {
    key: string
    value: FormularioAvaliacao
    indexes: { 'by-updatedAt': string; 'by-status': string }
  }
  configuracoes: {
    key: string
    value: unknown
  }
  filaSincronizacao: {
    key: string
    value: { id: string; formularioId: string; criadoEm: string; tentativas: number }
  }
}

let dbPromise: Promise<IDBPDatabase<GestaoDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GestaoDB>('gestao-integrada', 1, {
      upgrade(db) {
        const formularios = db.createObjectStore('formularios', { keyPath: 'id' })
        formularios.createIndex('by-updatedAt', 'updatedAt')
        formularios.createIndex('by-status', 'status')
        db.createObjectStore('configuracoes')
        db.createObjectStore('filaSincronizacao', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function salvarFormularioLocal(formulario: FormularioAvaliacao) {
  const db = await getDB()
  await db.put('formularios', formulario)
}

export async function obterFormularioLocal(id: string) {
  const db = await getDB()
  return db.get('formularios', id)
}

export async function listarFormulariosLocais() {
  const db = await getDB()
  const all = await db.getAll('formularios')
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function removerFormularioLocal(id: string) {
  const db = await getDB()
  await db.delete('formularios', id)
}

export async function enfileirarSincronizacao(formularioId: string) {
  const db = await getDB()
  await db.put('filaSincronizacao', {
    id: formularioId,
    formularioId,
    criadoEm: new Date().toISOString(),
    tentativas: 0,
  })
}

export async function removerDaFila(formularioId: string) {
  const db = await getDB()
  await db.delete('filaSincronizacao', formularioId)
}

export async function listarFila() {
  const db = await getDB()
  return db.getAll('filaSincronizacao')
}

export async function salvarConfiguracao(chave: string, valor: unknown) {
  const db = await getDB()
  await db.put('configuracoes', valor, chave)
}

export async function obterConfiguracao<T>(chave: string): Promise<T | undefined> {
  const db = await getDB()
  return db.get('configuracoes', chave) as Promise<T | undefined>
}
