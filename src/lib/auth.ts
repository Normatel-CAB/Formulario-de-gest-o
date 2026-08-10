import type { Papel, Usuario } from './types'
import { PROJETOS_PADRAO } from './types'
import { supabase } from './supabase'
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

let seedAdminEmAndamento: Promise<void> | null = null

export function garantirAdministradorPadrao() {
  if (!seedAdminEmAndamento) {
    seedAdminEmAndamento = (async () => {
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
        projeto: PROJETOS_PADRAO[0],
        status: 'ativo',
        criadoEm: new Date().toISOString(),
      }
      await salvarUsuarioLocal(usuario)
      await salvarCredencial({ usuarioId: id, hash, salt })
    })()
  }
  return seedAdminEmAndamento
}

export interface DadosCadastro {
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  projeto: string
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
    projeto: dados.projeto,
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

/** Para onde a Microsoft devolve o navegador depois do consentimento.
    Precisa estar na lista de "Redirect URLs" do Supabase (Authentication →
    URL Configuration) e nas "Redirect URIs" do app no Azure. */
export function urlRetornoMicrosoft() {
  return `${window.location.origin}/dashboard`
}

export async function iniciarLoginMicrosoft(): Promise<void> {
  if (!supabase) {
    throw new AuthError(
      'Login com Microsoft indisponível: o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foi carregado.',
    )
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: urlRetornoMicrosoft(),
      // `offline_access` é o que garante o refresh token; sem ele a sessão
      // morre em minutos e o usuário é jogado de volta para o login.
      scopes: 'openid profile email offline_access',
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw new AuthError(traduzirErroOAuth(error.message))
}

/** Mensagens do provedor são em inglês e técnicas; aqui viram algo acionável. */
function traduzirErroOAuth(mensagem: string) {
  const m = mensagem.toLowerCase()
  if (m.includes('provider is not enabled')) {
    return 'O provedor Azure/Microsoft não está habilitado no Supabase. Ative-o em Authentication → Providers.'
  }
  if (m.includes('redirect') || m.includes('not allowed')) {
    return 'Este endereço não está autorizado a receber o retorno do login. Cadastre-o em Authentication → URL Configuration no Supabase.'
  }
  return mensagem
}

/** Erro devolvido pelo provedor na própria URL de retorno (?error=…). */
export function lerErroRetornoOAuth(): string | null {
  const busca = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const erro = busca.get('error_description') || busca.get('error') || hash.get('error_description') || hash.get('error')
  return erro ? traduzirErroOAuth(decodeURIComponent(erro.replace(/\+/g, ' '))) : null
}

/**
 * Reage ao término do login Microsoft.
 *
 * Não basta chamar getSession() uma vez na inicialização: quando o navegador
 * volta da Microsoft, o supabase-js ainda está trocando o código pela sessão.
 * Quem esperava só pelo getSession via a tela de login de novo. Aqui ficamos
 * ouvindo o SIGNED_IN e avisamos o app quando a sessão realmente existir.
 */
export function observarSessaoMicrosoft(ao: (usuario: Usuario | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento !== 'SIGNED_IN' && evento !== 'INITIAL_SESSION' && evento !== 'TOKEN_REFRESHED') return
    void sincronizarSessaoMicrosoft()
      .then(ao)
      .catch(() => ao(null))
  })
  return () => data.subscription.unsubscribe()
}

export async function sincronizarSessaoMicrosoft(): Promise<Usuario | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const conta = data.session?.user
  const email = conta?.email?.toLowerCase()
  if (!email) return null

  const existente = await obterUsuarioPorEmail(email)
  if (existente) {
    if (existente.status === 'inativo') throw new AuthError('Este usuário está desativado. Contate o administrador.')
    const atualizado: Usuario = { ...existente, ultimoAcesso: new Date().toISOString() }
    await salvarUsuarioLocal(atualizado)
    return atualizado
  }

  const meta = (conta?.user_metadata ?? {}) as Record<string, string>
  const usuario: Usuario = {
    id: crypto.randomUUID(),
    nome: meta.name || meta.full_name || email.split('@')[0],
    email,
    cpf: '',
    matricula: '',
    cargo: 'Conta Microsoft',
    papel: 'visualizador',
    projeto: PROJETOS_PADRAO[0],
    status: 'ativo',
    criadoEm: new Date().toISOString(),
    ultimoAcesso: new Date().toISOString(),
  }
  await salvarUsuarioLocal(usuario)
  return usuario
}

export function iniciarSessao(usuarioId: string, lembrar = true) {
  const storage = lembrar ? localStorage : sessionStorage
  storage.setItem(SESSAO_STORAGE_KEY, usuarioId)
}

export function encerrarSessao() {
  localStorage.removeItem(SESSAO_STORAGE_KEY)
  sessionStorage.removeItem(SESSAO_STORAGE_KEY)
  // Sem isso a sessão do Supabase sobrevive ao logout e o próximo carregamento
  // reautentica o usuário sozinho pela conta Microsoft.
  void supabase?.auth.signOut()
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

export async function resetarSenhaAdmin(usuarioId: string, novaSenha: string): Promise<void> {
  const salt = await gerarSalt()
  const hash = await hashSenha(novaSenha, salt)
  await salvarCredencial({ usuarioId, hash, salt })
}

export { ADMIN_SEED_EMAIL, ADMIN_SEED_SENHA }
