export type Papel = 'administrador' | 'operador' | 'visualizador'

export const PAPEL_LABELS: Record<Papel, string> = {
  administrador: 'Administrador',
  operador: 'Operador',
  visualizador: 'Visualizador',
}

export type StatusUsuario = 'ativo' | 'inativo'

export interface Usuario {
  id: string
  nome: string
  email: string
  cpf: string
  matricula: string
  cargo: string
  papel: Papel
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

export type AcaoAuditoria =
  | 'cargo_criado'
  | 'cargo_editado'
  | 'cargo_excluido'
  | 'cargo_duplicado'
  | 'cargo_status_alterado'
  | 'funcao_criada'
  | 'funcao_editada'
  | 'funcao_excluida'
  | 'permissoes_alteradas'
  | 'email_enviado'
  | 'modelo_email_criado'
  | 'modelo_email_editado'
  | 'modelo_email_excluido'
  | 'sms_solicitado'
  | 'tecnico_criado'
  | 'tecnico_editado'
  | 'tecnico_excluido'

export interface RegistroAuditoria {
  id: string
  acao: AcaoAuditoria
  entidade: string
  entidadeNome: string
  detalhes: string
  usuarioId: string
  usuarioNome: string
  criadoEm: string
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

export interface DescricaoItem {
  necessario: boolean
  descricao?: string
}

export interface NecessidadesExecucao {
  pemt: QtdDias
  limpezaArea: QtdDias
  comunicacoesOperantes: QtdDias
  visitaTecnica: Agendamento
  montagemAndaime: Agendamento
  visitaSMS: Agendamento
  caminhaoMunck: Agendamento
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
}

export interface InfoGerais {
  responsavel: string
  dataAvaliacao: string
  tempoEstimadoExecucao: string
  numeroSolicitacao: string
  equipeNecessaria: string
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

export interface ModeloEmail {
  id: string
  nome: string
  assunto: string
  corpo: string
  criadoEm: string
}

export interface AnexoEmail {
  id: string
  nome: string
  dataUrl: string
}

export interface EmailEnviado {
  id: string
  destinatarios: string[]
  cc: string[]
  cco: string[]
  assunto: string
  corpo: string
  anexos: { nome: string }[]
  formularioId?: string
  enviadoPorId: string
  enviadoPorNome: string
  criadoEm: string
}

export type StatusTecnico = StatusRegistro

export interface Tecnico {
  id: string
  nome: string
  empresa: string
  email: string
  telefone: string
  cargo: string
  regiao: string
  status: StatusTecnico
  observacoes: string
  criadoEm: string
}

export interface SolicitacaoSMS {
  id: string
  tecnicoId: string
  tecnicoNome: string
  tecnicoEmail: string
  dataDesejada: string
  horaDesejada: string
  local: string
  instalacao: string
  responsavel: string
  observacoes: string
  criadoPorId: string
  criadoPorNome: string
  criadoEm: string
}
