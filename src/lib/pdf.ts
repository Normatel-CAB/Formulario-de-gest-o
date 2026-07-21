import { jsPDF } from 'jspdf'
import type { FormularioAvaliacao } from './types'
import { STATUS_LABELS } from './types'
import { formatarData, formatarDataHora } from './format'

const AGENDAMENTO_LABELS: Record<string, string> = {
  visitaTecnica: 'Visita Técnica',
  montagemAndaime: 'Montagem de Andaime',
  visitaSMS: 'Visita SMS',
  caminhaoMunck: 'Caminhão Munck',
  veiculo: 'Veículo',
  libra: 'LIBRA',
  ar2: 'AR2',
  desligamentoEletrico: 'Desligamento Elétrico',
  desligamentoSDAI: 'Desligamento SDAI',
  desligamentoFM200: 'Desligamento FM200',
  remanejamentoMobiliario: 'Remanejamento de Mobiliário',
}

const QTD_DIAS_LABELS: Record<string, string> = {
  pemt: 'PEMT',
  limpezaArea: 'Limpeza de Área',
  comunicacoesOperantes: 'Comunicações Operantes',
}

const DESCRICAO_LABELS: Record<string, string> = {
  materialEspecifico: 'Material específico',
  locacaoMaquinas: 'Locação de Máquinas/Ferramentas',
  apoioOutraEquipe: 'Apoio de outra equipe',
}

export function nomeArquivoPdf(formulario: FormularioAvaliacao) {
  const numero = formulario.infoGerais.numeroSolicitacao || formulario.id.slice(0, 8)
  return `ficha-tecnica-${numero}.pdf`
}

export function gerarPdfFormulario(formulario: FormularioAvaliacao): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margem = 40
  let y = margem
  const largura = doc.internal.pageSize.getWidth() - margem * 2

  function titulo(texto: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(11, 110, 79)
    doc.text(texto, margem, y)
    y += 18
    doc.setDrawColor(11, 110, 79)
    doc.line(margem, y - 12, margem + largura, y - 12)
  }

  function linha(rotulo: string, valor: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(90, 90, 90)
    doc.text(rotulo, margem, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    const linhas = doc.splitTextToSize(valor || '—', largura - 150)
    doc.text(linhas, margem + 150, y)
    y += Math.max(14, linhas.length * 12)
  }

  function paragrafo(texto: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(20, 20, 20)
    const linhas = doc.splitTextToSize(texto || '—', largura)
    doc.text(linhas, margem, y)
    y += linhas.length * 12 + 6
  }

  function espaco(altura = 10) {
    y += altura
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(11, 110, 79)
  doc.text('SISTEMA DE GESTÃO INTEGRADA', margem, y)
  y += 18
  doc.setFontSize(12)
  doc.setTextColor(20, 20, 20)
  doc.text('Ficha Técnica de Avaliação de Serviços', margem, y)
  y += 10
  doc.setDrawColor(11, 110, 79)
  doc.setLineWidth(1.4)
  doc.line(margem, y, margem + largura, y)
  y += 24

  titulo('Informações Gerais')
  linha('Status', STATUS_LABELS[formulario.status])
  linha('Responsável', formulario.infoGerais.responsavel)
  linha('Data da Avaliação', formulario.infoGerais.dataAvaliacao ? formatarData(formulario.infoGerais.dataAvaliacao) : '—')
  linha('Tempo Estimado', formulario.infoGerais.tempoEstimadoExecucao)
  linha('Nº da Solicitação', formulario.infoGerais.numeroSolicitacao)
  linha('Equipe Necessária', formulario.infoGerais.equipeNecessaria)
  linha('Local da Atividade', formulario.infoGerais.localAtividade)
  espaco(6)

  titulo('Necessidades da Execução')
  const n = formulario.necessidades as unknown as Record<string, { necessario: boolean; dias?: number; data?: string; descricao?: string }>
  const itens: string[] = []
  for (const [chave, rotulo] of Object.entries(QTD_DIAS_LABELS)) {
    if (n[chave]?.necessario) itens.push(`${rotulo}: ${n[chave].dias ?? 0} dia(s)`)
  }
  for (const [chave, rotulo] of Object.entries(AGENDAMENTO_LABELS)) {
    if (n[chave]?.necessario) itens.push(`${rotulo}${n[chave].data ? ` (${formatarData(n[chave].data as string)})` : ''}`)
  }
  for (const [chave, rotulo] of Object.entries(DESCRICAO_LABELS)) {
    if (n[chave]?.necessario) itens.push(`${rotulo}: ${n[chave].descricao || '—'}`)
  }
  paragrafo(itens.length > 0 ? itens.join('\n') : 'Nenhuma necessidade marcada.')
  espaco(6)

  titulo('Apoio necessário')
  paragrafo(formulario.descricaoApoio || '—')
  espaco(6)

  titulo('Observações')
  paragrafo(formulario.observacoes || '—')
  espaco(6)

  titulo('Anexos')
  linha('Imagens', `${formulario.imagens.length} imagem(ns)`)
  linha('Localização GPS', formulario.localizacao ? `${formulario.localizacao.latitude.toFixed(6)}, ${formulario.localizacao.longitude.toFixed(6)}` : 'Não capturada')
  linha('Assinatura digital', formulario.assinaturaDataUrl ? 'Registrada' : 'Não registrada')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Documento gerado em ${formatarDataHora(new Date().toISOString())}`, margem, doc.internal.pageSize.getHeight() - 24)

  return doc.output('blob')
}

export function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
