import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { obterConfiguracao, salvarConfiguracao } from '../lib/db'

export interface Carteira {
  id: string
  nome: string
  ativo: boolean
}

const TABELA = 'carteiras'
const CHAVE_CACHE = 'carteiras'

interface CarteirasState {
  carteiras: Carteira[]
  carregar: () => Promise<void>
  criar: (nome: string) => Promise<void>
  atualizar: (id: string, patch: Partial<Pick<Carteira, 'nome' | 'ativo'>>) => Promise<void>
  remover: (id: string) => Promise<void>
}

function semSupabase(): never {
  throw new Error('Carteiras só podem ser alteradas com conexão ao Supabase.')
}

export const useCarteirasStore = create<CarteirasState>((set, get) => ({
  carteiras: [],
  // a ficha e preenchida em campo sem sinal, por isso a lista fica guardada no aparelho
  carregar: async () => {
    const cache = await obterConfiguracao<Carteira[]>(CHAVE_CACHE)
    if (cache) set({ carteiras: cache })
    if (!supabase || !navigator.onLine) return
    const { data, error } = await supabase.from(TABELA).select('id,nome,ativo').order('nome')
    if (error || !data) return
    await salvarConfiguracao(CHAVE_CACHE, data)
    set({ carteiras: data as Carteira[] })
  },
  criar: async (nome) => {
    if (!supabase) semSupabase()
    const { error } = await supabase.from(TABELA).insert({ nome: nome.trim() })
    if (error) throw new Error(error.code === '23505' ? 'Já existe uma carteira com esse nome.' : error.message)
    await get().carregar()
  },
  atualizar: async (id, patch) => {
    if (!supabase) semSupabase()
    const { error } = await supabase.from(TABELA).update(patch).eq('id', id)
    if (error) throw new Error(error.code === '23505' ? 'Já existe uma carteira com esse nome.' : error.message)
    await get().carregar()
  },
  remover: async (id) => {
    if (!supabase) semSupabase()
    const { error } = await supabase.from(TABELA).delete().eq('id', id)
    if (error) throw new Error(error.message)
    await get().carregar()
  },
}))
