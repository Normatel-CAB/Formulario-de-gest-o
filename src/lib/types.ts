export type Papel = 'administrador' | 'operador' | 'visualizador'

export const PAPEL_LABELS: Record<Papel, string> = {
  administrador: 'Administrador',
  operador: 'Operador',
  visualizador: 'Visualizador',
}

export const PROJETOS_PADRAO = ['BASE UTE E TAPERA', 'ÁREAS EXTERNAS'] as const

export type StatusUsuario = 'ativo' | 'inativo'

export interface Usuario {
  id: string
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  papel: Papel
  projeto: string
  status: StatusUsuario
  criadoEm: string
  ultimoAcesso?: string
}

export type StatusRegistro = 'ativo' | 'inativo'

export interface Funcao {
  id: string
  nome: string
  identificador: string
  categoria: string
  descricao: string
  icone: string
  status: StatusRegistro
  sistema?: boolean
  criadoEm: string
}

export interface Cargo {
  id: string
  nome: string
  identificador: string
  descricao: string
  cor: string
  icone: string
  status: StatusRegistro
  permissoes: string[]
  sistema?: boolean
  criadoEm: string
  atualizadoEm: string
}

export type FormStatus = 'rascunho' | 'enviado' | 'em_analise' | 'aprovado' | 'reprovado'

export const STATUS_LABELS: Record<FormStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

export const STATUS_COLORS: Record<FormStatus, { bg: string; text: string; dot: string }> = {
  rascunho: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  enviado: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  em_analise: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  aprovado: { bg: 'bg-brand-100', text: 'text-brand-700', dot: 'bg-brand-500' },
  reprovado: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
}

export interface QtdDias {
  necessario: boolean
  dias?: number
  fimDeSemana?: boolean
}

export interface Agendamento {
  necessario: boolean
  data?: string
}

export interface AgendamentoVisitaSMS {
  necessario: boolean
  data?: string
  hora?: string
  tecnicoId?: string
  tecnicoNome?: string
  tecnicoEmail?: string
  observacoes?: string
}

export interface DescricaoItem {
  necessario: boolean
  descricao?: string
}

/** Equipamento pedido para a atividade: quantos dias e, se houver, a data em
    que precisa estar no local. */
export interface EquipamentoItem {
  necessario: boolean
  dias?: number
  data?: string
}

export type EquipamentoChave =
  | 'caminhaoCesto'
  | 'caminhaoMunck'
  | 'drone'
  | 'pemt'
  | 'retroescavadeira'

export type Equipamentos = Record<EquipamentoChave, EquipamentoItem>

export const EQUIPAMENTO_LABELS: Record<EquipamentoChave, string> = {
  caminhaoCesto: 'Caminhão cesto',
  caminhaoMunck: 'Caminhão munck',
  drone: 'Drone',
  pemt: 'PEMT',
  retroescavadeira: 'Retroescavadeira',
}

export const EQUIPAMENTO_CHAVES = Object.keys(EQUIPAMENTO_LABELS) as EquipamentoChave[]

export interface NecessidadesExecucao {
  equipamentos: Equipamentos
  limpezaArea: QtdDias
  comunicacoesOperantes: QtdDias
  visitaTecnica: Agendamento
  montagemAndaime: Agendamento
  visitaSMS: AgendamentoVisitaSMS
  veiculo: Agendamento
  libra: Agendamento
  ar2: Agendamento
  desligamentoEletrico: Agendamento
  desligamentoSDAI: Agendamento
  desligamentoFM200: Agendamento
  remanejamentoMobiliario: Agendamento
  materialEspecifico: DescricaoItem
  locacaoMaquinas: DescricaoItem
  apoioOutraEquipe: DescricaoItem
  necessidadesAdicionais?: string

  /** @deprecated Migrados para `equipamentos`. Só continuam declarados para as
      fichas gravadas antes da mudança serem lidas sem erro (ver
      `normalizarFormulario` em lib/factory.ts). */
  pemt?: QtdDias
  /** @deprecated Migrado para `equipamentos.caminhaoMunck`. */
  caminhaoMunck?: Agendamento
}

export const LOTACOES = [
  'Áreas Externas',
  'UTE',
  'Tapera',
  'Cabiúnas',
  'Barra do Furado',
  'Severina',
] as const

export type Lotacao = (typeof LOTACOES)[number]

export interface InfoGerais {
  responsavel: string
  dataAvaliacao: string
  tempoEstimadoExecucao: string
  numeroSolicitacao: string
  equipeNecessaria: string
  /** Base/unidade a que a atividade pertence (ver LOTACOES). */
  lotacao: string
  localAtividade: string
}

export interface LocalizacaoGPS {
  latitude: number
  longitude: number
  precisao?: number
  capturadaEm: string
}

export interface AnexoImagem {
  id: string
  nome: string
  dataUrl: string
  origem: 'upload' | 'camera'
  criadoEm: string
}

export interface FormularioAvaliacao {
  id: string
  createdAt: string
  updatedAt: string
  status: FormStatus
  projeto: string
  infoGerais: InfoGerais
  necessidades: NecessidadesExecucao
  descricaoApoio: string
  observacoes: string
  imagens: AnexoImagem[]
  localizacao?: LocalizacaoGPS
  assinaturaDataUrl?: string
  syncPending?: boolean
  criadoPorId?: string
  criadoPorNome?: string
}

export interface DashboardIndicadores {
  total: number
  pendentes: number
  emAnalise: number
  aprovados: number
  reprovados: number
}
