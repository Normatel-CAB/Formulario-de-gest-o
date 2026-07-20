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
}

export interface DashboardIndicadores {
  total: number
  pendentes: number
  emAnalise: number
  aprovados: number
  reprovados: number
}
