import { supabase } from './supabase'
import type { Cargo, StatusRegistro } from './types'
import { slugificar } from './permissoes'

export const CARGOS_TABLE = 'cargos'

/**
 * Cargos e suas permissões, no Supabase.
 *
 * Antes isto vivia no IndexedDB, e por isso a tela não funcionava: um cargo
 * criado no seu computador não existia para mais ninguém, e a contagem de
 * usuários dava sempre zero porque a lista de pessoas também era local.
 *
 * O identificador é a chave primária, e não um uuid. Ele é o que aparece nas
 * policies do banco e no campo `cargo` de cada acesso, então precisa ser
 * estável e legível: renomear "Planejador" para "Planejamento" não deve
 * derrubar a permissão de ninguém.
 */

function paraCargo(linha: Record<string, unknown>): Cargo {
  const identificador = String(linha.identificador ?? '')
  return {
    id: identificador,
    identificador,
    nome: String(linha.nome ?? ''),
    descricao: String(linha.descricao ?? ''),
    cor: String(linha.cor ?? '#0b6e4f'),
    icone: String(linha.icone ?? 'shield'),
    status: (linha.status as StatusRegistro) ?? 'ativo',
    permissoes: Array.isArray(linha.permissoes) ? (linha.permissoes as string[]) : [],
    sistema: Boolean(linha.sistema),
    criadoEm: String(linha.criadoEm ?? new Date().toISOString()),
    atualizadoEm: String(linha.atualizadoEm ?? new Date().toISOString()),
  }
}

export async function listarCargos(): Promise<Cargo[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(CARGOS_TABLE).select('*').order('nome')
  if (error) throw new Error(error.message)
  return (data ?? []).map(paraCargo)
}

/**
 * Gera um identificador livre a partir do nome.
 *
 * Acrescenta um sufixo numérico em vez de recusar o cadastro: dois cargos com
 * nomes parecidos são um caso normal, e travar a criação por isso seria pior
 * do que resolver sozinho.
 */
function identificadorLivre(nome: string, existentes: Set<string>): string {
  const base = slugificar(nome).replace(/\./g, '-') || 'cargo'
  if (!existentes.has(base)) return base
  let n = 2
  while (existentes.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export async function criarCargo(
  dados: Pick<Cargo, 'nome' | 'descricao' | 'cor' | 'icone' | 'status' | 'permissoes'>,
): Promise<void> {
  if (!supabase) throw new Error('Cadastro de cargo indisponível sem conexão com o Supabase.')
  const existentes = new Set((await listarCargos()).map((c) => c.identificador))
  const { error } = await supabase.from(CARGOS_TABLE).insert({
    identificador: identificadorLivre(dados.nome, existentes),
    nome: dados.nome.trim(),
    descricao: dados.descricao.trim(),
    cor: dados.cor,
    icone: dados.icone,
    status: dados.status,
    permissoes: dados.permissoes,
    sistema: false,
  })
  if (error) throw new Error(error.message)
}

export async function atualizarCargo(identificador: string, patch: Partial<Cargo>): Promise<void> {
  if (!supabase) throw new Error('Edição de cargo indisponível sem conexão com o Supabase.')
  // O identificador nunca entra no patch: mudá-lo desligaria de uma vez todas
  // as pessoas que estão nesse cargo, porque o vínculo é por esse campo.
  const { error } = await supabase
    .from(CARGOS_TABLE)
    .update({
      nome: patch.nome,
      descricao: patch.descricao,
      cor: patch.cor,
      icone: patch.icone,
      status: patch.status,
      permissoes: patch.permissoes,
      atualizadoEm: new Date().toISOString(),
    })
    .eq('identificador', identificador)
  if (error) throw new Error(error.message)
}

export async function removerCargo(identificador: string): Promise<void> {
  if (!supabase) throw new Error('Exclusão de cargo indisponível sem conexão com o Supabase.')
  const { error } = await supabase.from(CARGOS_TABLE).delete().eq('identificador', identificador)
  if (error) throw new Error(error.message)
}

/** Nome de exibição do cargo. Cai no identificador se o cargo sumiu. */
export async function nomeDoCargo(identificador: string): Promise<string> {
  if (!supabase || !identificador) return identificador
  const { data } = await supabase
    .from(CARGOS_TABLE)
    .select('nome')
    .eq('identificador', identificador)
    .maybeSingle()
  return String(data?.nome || identificador)
}

/** Permissões de um cargo, para a sessão saber o que a pessoa pode fazer. */
export async function permissoesDoCargo(identificador: string): Promise<string[]> {
  if (!supabase || !identificador) return []
  const { data, error } = await supabase
    .from(CARGOS_TABLE)
    .select('permissoes,status')
    .eq('identificador', identificador)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || data.status !== 'ativo') return []
  return Array.isArray(data.permissoes) ? (data.permissoes as string[]) : []
}
