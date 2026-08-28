import { create } from 'zustand'
import type { Cargo, StatusRegistro } from '../lib/types'
import { atualizarCargo, criarCargo, listarCargos, removerCargo } from '../lib/cargos'

/**
 * Cargos, agora vindos do Supabase.
 *
 * A semente dos três cargos de sistema saiu daqui e foi para a migração 008.
 * Semear pelo navegador significava que cada aparelho criava a sua própria
 * cópia, e nenhuma delas era a que as policies do banco consultavam.
 */
interface CargosState {
  cargos: Cargo[]
  loading: boolean
  erro: string | null
  carregar: () => Promise<void>
  criar: (dados: Omit<Cargo, 'id' | 'identificador' | 'criadoEm' | 'atualizadoEm' | 'sistema'>) => Promise<void>
  atualizar: (identificador: string, patch: Partial<Cargo>) => Promise<void>
  duplicar: (identificador: string) => Promise<void>
  alternarStatus: (identificador: string, status: StatusRegistro) => Promise<void>
  remover: (identificador: string, emUso: boolean) => Promise<{ ok: boolean; motivo?: string }>
}

function mensagem(err: unknown) {
  return err instanceof Error ? err.message : 'Falha ao falar com o banco de dados.'
}

export const useCargosStore = create<CargosState>((set, get) => ({
  cargos: [],
  loading: false,
  erro: null,
  carregar: async () => {
    set({ loading: true, erro: null })
    try {
      set({ cargos: await listarCargos(), loading: false })
    } catch (err) {
      set({ erro: mensagem(err), loading: false })
    }
  },
  criar: async (dados) => {
    await criarCargo(dados)
    await get().carregar()
  },
  atualizar: async (identificador, patch) => {
    await atualizarCargo(identificador, patch)
    await get().carregar()
  },
  duplicar: async (identificador) => {
    const original = get().cargos.find((c) => c.identificador === identificador)
    if (!original) return
    let nome = `${original.nome} (cópia)`
    let contador = 2
    while (get().cargos.some((c) => c.nome === nome)) {
      nome = `${original.nome} (cópia ${contador})`
      contador += 1
    }
    // A cópia nunca herda `sistema`: ela é um cargo comum, que pode ser
    // editado e excluído como qualquer outro.
    await criarCargo({
      nome,
      descricao: original.descricao,
      cor: original.cor,
      icone: original.icone,
      status: original.status,
      permissoes: [...original.permissoes],
    })
    await get().carregar()
  },
  alternarStatus: async (identificador, status) => {
    await atualizarCargo(identificador, { status })
    await get().carregar()
  },
  remover: async (identificador, emUso) => {
    const atual = get().cargos.find((c) => c.identificador === identificador)
    if (!atual) return { ok: false, motivo: 'Cargo não encontrado.' }
    if (atual.sistema) return { ok: false, motivo: 'Cargos padrão do sistema não podem ser excluídos.' }
    if (emUso) return { ok: false, motivo: 'Este cargo está em uso por um ou mais usuários e não pode ser excluído.' }

    try {
      await removerCargo(identificador)
      await get().carregar()
      return { ok: true }
    } catch (err) {
      return { ok: false, motivo: mensagem(err) }
    }
  },
}))
