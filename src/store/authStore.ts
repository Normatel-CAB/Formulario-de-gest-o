import { create } from 'zustand'
import type { Papel, Usuario } from '../lib/types'
import {
  autenticar,
  cadastrarUsuario,
  encerrarSessao,
  garantirAdministradorPadrao,
  iniciarLoginMicrosoft,
  iniciarSessao,
  obterUsuarioDaSessao,
  sincronizarSessaoMicrosoft,
  type DadosCadastro,
} from '../lib/auth'

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

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  carregando: true,
  inicializado: false,
  inicializar: async () => {
    await garantirAdministradorPadrao()
    let usuario = await obterUsuarioDaSessao()
    if (!usuario) {
      try {
        usuario = await sincronizarSessaoMicrosoft()
        if (usuario) iniciarSessao(usuario.id)
      } catch {
        usuario = null
      }
    }
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
