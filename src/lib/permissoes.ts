export interface ModuloPermissao {
  categoria: string
  acoes: string[]
}

export const MODULOS_PERMISSOES: ModuloPermissao[] = [
  { categoria: 'Dashboard', acoes: ['Visualizar'] },
  {
    categoria: 'Formulários',
    acoes: ['Criar', 'Editar', 'Excluir', 'Aprovar', 'Reprovar', 'Reabrir', 'Exportar PDF', 'Baixar imagens', 'Enviar Outlook'],
  },
  // "Ver de todos" é a permissão que separa quem acompanha o próprio trabalho
  // de quem coordena o dos outros. Sem ela, um cargo com direito de aprovar
  // aprovaria apenas as fichas que ele mesmo preencheu, o que não faz sentido.
  // O alcance ainda passa pelo projeto do acesso: projeto em branco vê todos,
  // projeto nomeado vê só aquele.
  { categoria: 'Histórico', acoes: ['Visualizar', 'Ver de todos', 'Editar', 'Excluir', 'Exportar'] },
  { categoria: 'Usuários', acoes: ['Criar', 'Editar', 'Excluir', 'Ativar', 'Desativar', 'Resetar senha'] },
  { categoria: 'Administração', acoes: ['Gerenciar cargos', 'Gerenciar permissões', 'Configurações', 'Auditoria', 'Logs'] },
]

export function slugificar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

export function identificadorFuncao(categoria: string, acao: string): string {
  return `${slugificar(categoria)}.${slugificar(acao)}`
}

export const CORES_CARGO = [
  '#0b6e4f',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#d97706',
  '#dc2626',
  '#0891b2',
  '#4b5563',
  '#65a30d',
  '#9333ea',
]

export const ICONES_DISPONIVEIS = [
  'shield',
  'crown',
  'eye',
  'wrench',
  'user',
  'users',
  'star',
  'check-circle',
  'settings',
  'lock',
  'briefcase',
  'clipboard',
] as const

export type IconeCargo = (typeof ICONES_DISPONIVEIS)[number]

export const PERMISSOES_ADMINISTRADOR_PADRAO = MODULOS_PERMISSOES.flatMap((m) => m.acoes.map((a) => identificadorFuncao(m.categoria, a)))

export const PERMISSOES_OPERADOR_PADRAO = [
  identificadorFuncao('Dashboard', 'Visualizar'),
  identificadorFuncao('Formulários', 'Criar'),
  identificadorFuncao('Formulários', 'Editar'),
  identificadorFuncao('Formulários', 'Baixar imagens'),
  identificadorFuncao('Histórico', 'Visualizar'),
  identificadorFuncao('Histórico', 'Exportar'),
]

export const PERMISSOES_VISUALIZADOR_PADRAO = [
  identificadorFuncao('Dashboard', 'Visualizar'),
  identificadorFuncao('Histórico', 'Visualizar'),
]

/**
 * Reduz um cargo aos três papéis antigos.
 *
 * A coluna `papel` continua existindo no banco com um CHECK de três valores, e
 * algumas telas ainda decidem por ela. Isto mantém as duas visões coerentes
 * sem obrigar a reescrever tudo de uma vez.
 *
 * Só o cargo de identificador `administrador` vira `administrador`. Um cargo
 * novo, mesmo com permissões amplas, fica como operador de propósito: `papel
 * administrador` é tratado como curinga em vários pontos do app, e deixar um
 * cargo personalizado escorregar para lá daria mais poder do que foi marcado
 * na tela de permissões.
 */
export function papelEquivalente(identificadorCargo: string, permissoes: string[]): 'administrador' | 'operador' | 'visualizador' {
  if (identificadorCargo === 'administrador') return 'administrador'
  if (permissoes.includes(identificadorFuncao('Formulários', 'Criar'))) return 'operador'
  return 'visualizador'
}
