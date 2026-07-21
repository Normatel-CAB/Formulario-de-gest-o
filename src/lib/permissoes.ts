export interface ModuloPermissao {
  categoria: string
  acoes: string[]
}

export const MODULOS_PERMISSOES: ModuloPermissao[] = [
  { categoria: 'Dashboard', acoes: ['Visualizar'] },
  {
    categoria: 'Formulários',
    acoes: ['Criar', 'Editar', 'Excluir', 'Aprovar', 'Rejeitar', 'Reabrir', 'Exportar', 'Importar', 'Baixar imagens', 'Enviar Outlook'],
  },
  { categoria: 'Histórico', acoes: ['Visualizar', 'Editar', 'Excluir', 'Exportar'] },
  { categoria: 'Usuários', acoes: ['Criar', 'Editar', 'Excluir', 'Alterar senha', 'Ativar', 'Desativar'] },
  { categoria: 'Cargos', acoes: ['Criar', 'Editar', 'Excluir', 'Duplicar', 'Gerenciar permissões'] },
  { categoria: 'Administração', acoes: ['Configurações', 'Logs', 'Auditoria', 'Backup', 'Restaurar Backup'] },
  { categoria: 'Sistema', acoes: ['Alterar aparência', 'Alterar logo', 'Alterar nome do sistema', 'Configurar e-mail', 'Configurar banco'] },
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
