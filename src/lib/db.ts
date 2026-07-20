import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Cargo, FormularioAvaliacao, Usuario } from './types'

interface Credencial {
  usuarioId: string
  hash: string
  salt: string
}

interface CodigoRecuperacao {
  email: string
  codigo: string
  expiraEm: string
}

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
  usuarios: {
    key: string
    value: Usuario
    indexes: { 'by-email': string }
  }
  credenciais: {
    key: string
    value: Credencial
  }
  recuperacaoSenha: {
    key: string
    value: CodigoRecuperacao
  }
  cargos: {
    key: string
    value: Cargo
  }
}

let dbPromise: Promise<IDBPDatabase<GestaoDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GestaoDB>('gestao-integrada', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const formularios = db.createObjectStore('formularios', { keyPath: 'id' })
          formularios.createIndex('by-updatedAt', 'updatedAt')
          formularios.createIndex('by-status', 'status')
          db.createObjectStore('configuracoes')
          db.createObjectStore('filaSincronizacao', { keyPath: 'id' })
        }
        if (oldVersion < 2) {
          const usuarios = db.createObjectStore('usuarios', { keyPath: 'id' })
          usuarios.createIndex('by-email', 'email', { unique: true })
          db.createObjectStore('credenciais', { keyPath: 'usuarioId' })
          db.createObjectStore('recuperacaoSenha', { keyPath: 'email' })
          db.createObjectStore('cargos', { keyPath: 'id' })
        }
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

export async function salvarUsuarioLocal(usuario: Usuario) {
  const db = await getDB()
  await db.put('usuarios', usuario)
}

export async function obterUsuarioPorId(id: string) {
  const db = await getDB()
  return db.get('usuarios', id)
}

export async function obterUsuarioPorEmail(email: string) {
  const db = await getDB()
  return db.getFromIndex('usuarios', 'by-email', email.toLowerCase())
}

export async function listarUsuariosLocais() {
  const db = await getDB()
  const all = await db.getAll('usuarios')
  return all.sort((a, b) => a.nome.localeCompare(b.nome))
}

export async function removerUsuarioLocal(id: string) {
  const db = await getDB()
  await db.delete('usuarios', id)
  await db.delete('credenciais', id)
}

export async function salvarCredencial(credencial: Credencial) {
  const db = await getDB()
  await db.put('credenciais', credencial)
}

export async function obterCredencial(usuarioId: string) {
  const db = await getDB()
  return db.get('credenciais', usuarioId)
}

export async function salvarCodigoRecuperacao(codigo: CodigoRecuperacao) {
  const db = await getDB()
  await db.put('recuperacaoSenha', codigo)
}

export async function obterCodigoRecuperacao(email: string) {
  const db = await getDB()
  return db.get('recuperacaoSenha', email.toLowerCase())
}

export async function removerCodigoRecuperacao(email: string) {
  const db = await getDB()
  await db.delete('recuperacaoSenha', email.toLowerCase())
}

export async function listarCargosLocais() {
  const db = await getDB()
  const all = await db.getAll('cargos')
  return all.sort((a, b) => a.nome.localeCompare(b.nome))
}

export async function salvarCargoLocal(cargo: Cargo) {
  const db = await getDB()
  await db.put('cargos', cargo)
}

export async function removerCargoLocal(id: string) {
  const db = await getDB()
  await db.delete('cargos', id)
}
