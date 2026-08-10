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
import { toast } from './toastStore'

interface AuthState {
  usuario: Usuario | null
  carregando: boolean
  inicializado: boolean
  inicializar: () => Promise<void>
  entrar: (email: string, senha: string, lembrar?: boolean) => Promise<void>
  entrarComMicrosoft: () => Promise<void>
  cadastrar: (dados: DadosCadastro, papel?: Papel) => Promise<void>
  sair: () => void
  definirUsuario: (usuario: Usuario) => void
}

/** Garante que o listener do OAuth seja registrado uma única vez, mesmo com o
    StrictMode do React montando os efeitos duas vezes em desenvolvimento. */
let observadorRegistrado = false

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  carregando: true,
  inicializado: false,
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
    if (!usuario) {
      try {
        usuario = await sincronizarSessaoMicrosoft()
        if (usuario) iniciarSessao(usuario.id)
      } catch (err) {
        toast({
          variant: 'error',
          title: 'Não foi possível concluir o login',
          description: err instanceof Error ? err.message : undefined,
        })
        usuario = null
      }
    }

    if (!observadorRegistrado) {
      observadorRegistrado = true
      // A troca do código pela sessão termina depois deste ponto: o listener
      // pega o SIGNED_IN atrasado e completa o login sem recarregar a página.
      observarSessaoMicrosoft((usuarioMicrosoft) => {
        if (!usuarioMicrosoft || get().usuario) return
        iniciarSessao(usuarioMicrosoft.id)
        set({ usuario: usuarioMicrosoft })
        limparParametrosDaUrl()
      })
    }

    if (usuario) limparParametrosDaUrl()
    set({ usuario, carregando: false, inicializado: true })
  },
  entrar: async (email, senha, lembrar = true) => {
    const usuario = await autenticar(email, senha)
    iniciarSessao(usuario.id, lembrar)
    set({ usuario })
  },
  entrarComMicrosoft: async () => {
    await iniciarLoginMicrosoft()
  },
  cadastrar: async (dados, papel) => {
    const usuario = await cadastrarUsuario(dados, papel)
    iniciarSessao(usuario.id)
    set({ usuario })
  },
  sair: () => {
    encerrarSessao()
    set({ usuario: null })
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
