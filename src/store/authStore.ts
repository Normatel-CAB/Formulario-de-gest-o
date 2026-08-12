import { create } from 'zustand'
import type { Papel, Usuario } from '../lib/types'
import {
  autenticar,
  cadastrarUsuario,
  encerrarSessao,
  garantirAdministradorPadrao,
  iniciarLoginMicrosoft,
  iniciarSessao,
  lerErroRetornoOAuth,
  observarSessaoMicrosoft,
  obterUsuarioDaSessao,
  sincronizarSessaoMicrosoft,
  type DadosCadastro,
} from '../lib/auth'
import { AcessoPendenteError, AcessoRejeitadoError } from '../lib/acesso'
import { toast } from './toastStore'

/** Situação do acesso quando a conta Microsoft autenticou mas não pode entrar. */
export interface EstadoAcesso {
  estado: 'pendente' | 'rejeitado'
  email?: string
  mensagem: string
}

interface AuthState {
  usuario: Usuario | null
  carregando: boolean
  inicializado: boolean
  /** Preenchido quando a conta autenticou mas aguarda (ou perdeu) aprovação. */
  acesso: EstadoAcesso | null
  inicializar: () => Promise<void>
  entrar: (email: string, senha: string, lembrar?: boolean) => Promise<void>
  entrarComMicrosoft: () => Promise<void>
  reverificarAcesso: () => Promise<void>
  cadastrar: (dados: DadosCadastro, papel?: Papel) => Promise<void>
  sair: () => void
  definirUsuario: (usuario: Usuario) => void
}

/** Garante que o listener do OAuth seja registrado uma única vez, mesmo com o
    StrictMode do React montando os efeitos duas vezes em desenvolvimento. */
let observadorRegistrado = false

/** Traduz o erro do login Microsoft no estado que a interface precisa mostrar. */
function classificar(erro: unknown): EstadoAcesso | null {
  if (erro instanceof AcessoPendenteError) return { estado: 'pendente', mensagem: erro.message }
  if (erro instanceof AcessoRejeitadoError) return { estado: 'rejeitado', mensagem: erro.message }
  return null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  carregando: true,
  inicializado: false,
  acesso: null,
  inicializar: async () => {
    await garantirAdministradorPadrao()

    // Se a Microsoft devolveu um erro na própria URL, mostramos em vez de
    // simplesmente cair de volta na tela de login sem explicação.
    const erroRetorno = lerErroRetornoOAuth()
    if (erroRetorno) {
      toast({ variant: 'error', title: 'Falha no login Microsoft', description: erroRetorno })
      limparParametrosDaUrl()
    }

    let usuario = await obterUsuarioDaSessao()
    let acesso: EstadoAcesso | null = null

    if (!usuario) {
      try {
        usuario = await sincronizarSessaoMicrosoft()
        if (usuario) iniciarSessao(usuario.id)
      } catch (err) {
        acesso = classificar(err)
        if (!acesso) {
          toast({
            variant: 'error',
            title: 'Não foi possível concluir o login',
            description: err instanceof Error ? err.message : undefined,
          })
        }
        usuario = null
      }
    }

    if (!observadorRegistrado) {
      observadorRegistrado = true
      // A troca do código pela sessão termina depois deste ponto: o listener
      // pega o SIGNED_IN atrasado e completa o login sem recarregar a página.
      observarSessaoMicrosoft(({ usuario: usuarioMicrosoft, erro }) => {
        if (erro) {
          const classificado = classificar(erro)
          if (classificado) set({ acesso: classificado, usuario: null })
          return
        }
        if (!usuarioMicrosoft || get().usuario) return
        iniciarSessao(usuarioMicrosoft.id)
        set({ usuario: usuarioMicrosoft, acesso: null })
        limparParametrosDaUrl()
      })
    }

    if (usuario) limparParametrosDaUrl()
    set({ usuario, acesso, carregando: false, inicializado: true })
  },
  entrar: async (email, senha, lembrar = true) => {
    const usuario = await autenticar(email, senha)
    iniciarSessao(usuario.id, lembrar)
    set({ usuario, acesso: null })
  },
  entrarComMicrosoft: async () => {
    await iniciarLoginMicrosoft()
  },
  /** Botão "Verificar novamente" da tela de espera: reconsulta a fila. */
  reverificarAcesso: async () => {
    try {
      const usuario = await sincronizarSessaoMicrosoft()
      if (usuario) {
        iniciarSessao(usuario.id)
        set({ usuario, acesso: null })
        toast({ variant: 'success', title: 'Acesso aprovado', description: `Bem-vindo, ${usuario.nome}.` })
        return
      }
      set({ acesso: null })
    } catch (err) {
      const classificado = classificar(err)
      if (classificado) {
        set({ acesso: classificado })
        if (classificado.estado === 'pendente') {
          toast({ variant: 'info', title: 'Ainda aguardando aprovação' })
        }
        return
      }
      toast({
        variant: 'error',
        title: 'Não foi possível verificar',
        description: err instanceof Error ? err.message : undefined,
      })
    }
  },
  cadastrar: async (dados, papel) => {
    const usuario = await cadastrarUsuario(dados, papel)
    iniciarSessao(usuario.id)
    set({ usuario, acesso: null })
  },
  sair: () => {
    encerrarSessao()
    set({ usuario: null, acesso: null })
  },
  definirUsuario: (usuario) => set({ usuario }),
}))

/** Tira `code`, `error` e os tokens do endereço para o usuário não ver (nem
    compartilhar) uma URL cheia de parâmetros de autenticação. */
function limparParametrosDaUrl() {
  if (!window.location.search && !window.location.hash) return
  const temParametrosDeAuth = /(?:code|error|access_token|refresh_token)=/.test(
    window.location.search + window.location.hash,
  )
  if (!temParametrosDeAuth) return
  window.history.replaceState({}, '', window.location.pathname)
}
