import type { Papel, Usuario } from './types'
import {
  obterCodigoRecuperacao,
  obterCredencial,
  obterUsuarioPorEmail,
  obterUsuarioPorId,
  listarUsuariosLocais,
  removerCodigoRecuperacao,
  salvarCodigoRecuperacao,
  salvarCredencial,
  salvarUsuarioLocal,
}
from './db'

const SESSAO_STORAGE_KEY = 'gestao-integrada:sessao-usuario-id'
const ADMIN_SEED_EMAIL = 'admin@empresa.com'
const ADMIN_SEED_SENHA = 'Admin@123'

async function gerarSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashSenha(senha: string, salt: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${salt}:${senha}`)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

export class AuthError extends Error {}

export async function garantirAdministradorPadrao() {
  const existentes = await listarUsuariosLocais()
  if (existentes.length > 0) return
  const id = crypto.randomUUID()
  const salt = await gerarSalt()
  const hash = await hashSenha(ADMIN_SEED_SENHA, salt)
  const usuario: Usuario = {
    id,
    nome: 'Administrador',
    email: ADMIN_SEED_EMAIL,
    cpf: '',
    matricula: 'ADM-0001',
    cargo: 'Administrador do Sistema',
    papel: 'administrador',
    status: 'ativo',
    criadoEm: new Date().toISOString(),
  }
  await salvarUsuarioLocal(usuario)
  await salvarCredencial({ usuarioId: id, hash, salt })
}

export interface DadosCadastro {
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  senha: string
}

export async function cadastrarUsuario(dados: DadosCadastro, papel: Papel = 'operador'): Promise<Usuario> {
  const existente = await obterUsuarioPorEmail(dados.email)
  if (existente) throw new AuthError('Já existe uma conta com este e-mail.')

  const id = crypto.randomUUID()
  const salt = await gerarSalt()
  const hash = await hashSenha(dados.senha, salt)
  const usuario: Usuario = {
    id,
    nome: dados.nome,
    email: dados.email.toLowerCase(),
    cpf: dados.cpf,
    matricula: dados.matricula,
    cargo: dados.cargo,
    papel,
    status: 'ativo',
    criadoEm: new Date().toISOString(),
  }
  await salvarUsuarioLocal(usuario)
  await salvarCredencial({ usuarioId: id, hash, salt })
  return usuario
}

export async function autenticar(email: string, senha: string): Promise<Usuario> {
  const usuario = await obterUsuarioPorEmail(email)
  if (!usuario) throw new AuthError('E-mail ou senha inválidos.')
  if (usuario.status === 'inativo') throw new AuthError('Este usuário está desativado. Contate o administrador.')

  const credencial = await obterCredencial(usuario.id)
  if (!credencial) throw new AuthError('E-mail ou senha inválidos.')

  const hash = await hashSenha(senha, credencial.salt)
  if (hash !== credencial.hash) throw new AuthError('E-mail ou senha inválidos.')

  const atualizado: Usuario = { ...usuario, ultimoAcesso: new Date().toISOString() }
  await salvarUsuarioLocal(atualizado)
  return atualizado
}

export function iniciarSessao(usuarioId: string, lembrar = true) {
  const storage = lembrar ? localStorage : sessionStorage
  storage.setItem(SESSAO_STORAGE_KEY, usuarioId)
}

export function encerrarSessao() {
  localStorage.removeItem(SESSAO_STORAGE_KEY)
  sessionStorage.removeItem(SESSAO_STORAGE_KEY)
}

export async function obterUsuarioDaSessao(): Promise<Usuario | null> {
  const id = localStorage.getItem(SESSAO_STORAGE_KEY) ?? sessionStorage.getItem(SESSAO_STORAGE_KEY)
  if (!id) return null
  const usuario = await obterUsuarioPorId(id)
  return usuario ?? null
}

function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function solicitarRecuperacaoSenha(email: string): Promise<string> {
  const usuario = await obterUsuarioPorEmail(email)
  if (!usuario) throw new AuthError('Não encontramos uma conta com este e-mail.')
  const codigo = gerarCodigo()
  const expiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await salvarCodigoRecuperacao({ email: email.toLowerCase(), codigo, expiraEm })
  return codigo
}

export async function validarCodigoRecuperacao(email: string, codigo: string): Promise<void> {
  const registro = await obterCodigoRecuperacao(email)
  if (!registro || registro.codigo !== codigo) throw new AuthError('Código inválido.')
  if (new Date(registro.expiraEm).getTime() < Date.now()) throw new AuthError('Código expirado. Solicite um novo.')
}

export async function redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void> {
  await validarCodigoRecuperacao(email, codigo)
  const usuario = await obterUsuarioPorEmail(email)
  if (!usuario) throw new AuthError('Não encontramos uma conta com este e-mail.')
  const salt = await gerarSalt()
  const hash = await hashSenha(novaSenha, salt)
  await salvarCredencial({ usuarioId: usuario.id, hash, salt })
  await removerCodigoRecuperacao(email)
}

export async function alterarSenha(usuarioId: string, senhaAtual: string, novaSenha: string): Promise<void> {
  const credencial = await obterCredencial(usuarioId)
  if (!credencial) throw new AuthError('Usuário não encontrado.')
  const hashAtual = await hashSenha(senhaAtual, credencial.salt)
  if (hashAtual !== credencial.hash) throw new AuthError('Senha atual incorreta.')
  const salt = await gerarSalt()
  const hash = await hashSenha(novaSenha, salt)
  await salvarCredencial({ usuarioId, hash, salt })
}

export { ADMIN_SEED_EMAIL, ADMIN_SEED_SENHA }
