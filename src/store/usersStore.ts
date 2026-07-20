import { create } from 'zustand'
import type { Papel, StatusUsuario, Usuario } from '../lib/types'
import { listarUsuariosLocais, obterUsuarioPorEmail, removerUsuarioLocal, salvarUsuarioLocal } from '../lib/db'
import { cadastrarUsuario, AuthError, type DadosCadastro } from '../lib/auth'

interface UsersState {
  usuarios: Usuario[]
  loading: boolean
  carregar: () => Promise<void>
  criar: (dados: DadosCadastro & { papel: Papel }) => Promise<void>
  atualizar: (id: string, patch: Partial<Usuario>) => Promise<void>
  alternarStatus: (id: string, status: StatusUsuario) => Promise<void>
  remover: (id: string) => Promise<void>
}

export const useUsersStore = create<UsersState>((set, get) => ({
  usuarios: [],
  loading: false,
  carregar: async () => {
    set({ loading: true })
    const usuarios = await listarUsuariosLocais()
    set({ usuarios, loading: false })
  },
  criar: async (dados) => {
    const usuario = await cadastrarUsuario(dados, dados.papel)
    set({ usuarios: [...get().usuarios, usuario].sort((a, b) => a.nome.localeCompare(b.nome)) })
  },
  atualizar: async (id, patch) => {
    const atual = get().usuarios.find((u) => u.id === id)
    if (!atual) return
    if (patch.email && patch.email.toLowerCase() !== atual.email) {
      const existente = await obterUsuarioPorEmail(patch.email)
      if (existente) throw new AuthError('Já existe uma conta com este e-mail.')
    }
    const atualizado: Usuario = { ...atual, ...patch, email: (patch.email ?? atual.email).toLowerCase() }
    await salvarUsuarioLocal(atualizado)
    set({ usuarios: get().usuarios.map((u) => (u.id === id ? atualizado : u)) })
  },
  alternarStatus: async (id, status) => {
    await get().atualizar(id, { status })
  },
  remover: async (id) => {
    await removerUsuarioLocal(id)
    set({ usuarios: get().usuarios.filter((u) => u.id !== id) })
  },
}))
