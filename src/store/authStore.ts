import { create } from 'zustand'
import type { Papel, Usuario } from '../lib/types'
import {
  autenticar,
  cadastrarUsuario,
  encerrarSessao,
  garantirAdministradorPadrao,
  iniciarSessao,
  obterUsuarioDaSessao,
  type DadosCadastro,
} from '../lib/auth'

interface AuthState {
  usuario: Usuario | null
  carregando: boolean
  inicializado: boolean
  inicializar: () => Promise<void>
  entrar: (email: string, senha: string, lembrar?: boolean) => Promise<void>
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
    const usuario = await obterUsuarioDaSessao()
    set({ usuario, carregando: false, inicializado: true })
  },
  entrar: async (email, senha, lembrar = true) => {
    const usuario = await autenticar(email, senha)
    iniciarSessao(usuario.id, lembrar)
    set({ usuario })
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
