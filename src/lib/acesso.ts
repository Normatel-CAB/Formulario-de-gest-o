import { supabase } from './supabase'
import type { Papel } from './types'

export const SOLICITACOES_TABLE = 'solicitacoes_acesso'

export type StatusSolicitacao = 'pendente' | 'aprovado' | 'rejeitado'

export interface SolicitacaoAcesso {
  id: string
  email: string
  nome: string
  status: StatusSolicitacao
  papel: Papel
  projeto: string
  observacao?: string
  criadoEm: string
  decididoEm?: string | null
  decididoPor?: string | null
}

/**
 * Fila de solicitações de acesso, no Supabase.
 *
 * A base de usuários do app é local (IndexedDB), então ela não serve para isso:
 * um pedido aberto no celular do colaborador nunca apareceria no computador do
 * administrador. Só esta tabela é compartilhada.
 */

export class AcessoPendenteError extends Error {
  constructor() {
    super('Seu acesso está aguardando aprovação de um administrador.')
  }
}

export class AcessoRejeitadoError extends Error {
  constructor(observacao?: string) {
    super(observacao?.trim() || 'Seu acesso foi recusado por um administrador.')
  }
}

function paraSolicitacao(linha: Record<string, unknown>): SolicitacaoAcesso {
  return {
    id: String(linha.id),
    email: String(linha.email ?? ''),
    nome: String(linha.nome ?? ''),
    status: (linha.status as StatusSolicitacao) ?? 'pendente',
    papel: (linha.papel as Papel) ?? 'visualizador',
    projeto: String(linha.projeto ?? ''),
    observacao: (linha.observacao as string) ?? '',
    criadoEm: String(linha.criadoEm ?? new Date().toISOString()),
    decididoEm: (linha.decididoEm as string) ?? null,
    decididoPor: (linha.decididoPor as string) ?? null,
  }
}

export async function obterSolicitacao(email: string): Promise<SolicitacaoAcesso | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(SOLICITACOES_TABLE)
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? paraSolicitacao(data) : null
}

/**
 * Abre a solicitação do próprio usuário logado.
 *
 * O papel vai fixo em `visualizador` porque a policy do banco exige isso na
 * inserção: se o app pudesse escolher o papel aqui, bastaria editar o
 * JavaScript no navegador para entrar como administrador.
 */
export async function criarSolicitacao(email: string, nome: string): Promise<SolicitacaoAcesso | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(SOLICITACOES_TABLE)
    .insert({ email: email.trim().toLowerCase(), nome: nome.trim(), status: 'pendente', papel: 'visualizador' })
    .select()
    .maybeSingle()

  // Corrida entre duas abas ou dois cliques: o índice único barra a segunda
  // inserção. Nesse caso a solicitação existe, e é ela que interessa.
  if (error) {
    if (error.code === '23505' || /duplicate key/i.test(error.message)) return obterSolicitacao(email)
    throw new Error(error.message)
  }
  return data ? paraSolicitacao(data) : null
}

/**
 * Cadastra um acesso já aprovado, pelo administrador.
 *
 * Serve para liberar quem entrou antes de a fila existir: essas contas foram
 * criadas no IndexedDB do próprio aparelho da pessoa e nunca apareceram aqui.
 * Sem isto, a única saída seria pedir para cada um logar de novo só para o
 * pedido aparecer.
 */
export async function cadastrarAcessoAprovado(
  email: string,
  papel: Papel,
  projeto: string,
  decididoPor: string,
): Promise<void> {
  if (!supabase) throw new Error('Cadastro indisponível sem conexão com o Supabase.')
  const limpo = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo)) throw new Error('E-mail inválido.')

  const existente = await obterSolicitacao(limpo)
  if (existente) {
    // Já está na lista: em vez de recusar, aplica a decisão na linha existente.
    await decidirSolicitacao(existente.id, { status: 'aprovado', papel, projeto }, decididoPor)
    return
  }

  const { error } = await supabase.from(SOLICITACOES_TABLE).insert({
    email: limpo,
    nome: '',
    status: 'aprovado',
    papel,
    projeto,
    decididoEm: new Date().toISOString(),
    decididoPor,
  })
  if (error) throw new Error(error.message)
}

export async function listarSolicitacoes(): Promise<SolicitacaoAcesso[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from(SOLICITACOES_TABLE)
    .select('*')
    .order('criadoEm', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(paraSolicitacao)
}

export async function decidirSolicitacao(
  id: string,
  decisao: { status: Exclude<StatusSolicitacao, 'pendente'>; papel?: Papel; projeto?: string; observacao?: string },
  decididoPor: string,
): Promise<void> {
  if (!supabase) throw new Error('Aprovação indisponível sem conexão com o Supabase.')
  const { error } = await supabase
    .from(SOLICITACOES_TABLE)
    .update({
      status: decisao.status,
      papel: decisao.papel ?? 'visualizador',
      projeto: decisao.projeto ?? '',
      observacao: decisao.observacao ?? '',
      decididoEm: new Date().toISOString(),
      decididoPor,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reabrirSolicitacao(id: string): Promise<void> {
  if (!supabase) throw new Error('Ação indisponível sem conexão com o Supabase.')
  const { error } = await supabase
    .from(SOLICITACOES_TABLE)
    .update({ status: 'pendente', decididoEm: null, decididoPor: null, observacao: '' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
