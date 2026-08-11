import { jsPDF } from 'jspdf'
import type { FormularioAvaliacao, FormStatus } from './types'
import { EQUIPAMENTO_CHAVES, EQUIPAMENTO_LABELS, STATUS_LABELS } from './types'
import { formatarData, formatarDataHora } from './format'

const AGENDAMENTO_LABELS: Record<string, string> = {
  visitaTecnica: 'Visita Técnica',
  montagemAndaime: 'Montagem de Andaime',
  visitaSMS: 'Visita SMS',
  veiculo: 'Veículo',
  libra: 'LIBRA',
  ar2: 'AR2',
  desligamentoEletrico: 'Desligamento Elétrico',
  desligamentoSDAI: 'Desligamento SDAI',
  desligamentoFM200: 'Desligamento FM200',
  remanejamentoMobiliario: 'Remanejamento de Mobiliário',
}

const QTD_DIAS_LABELS: Record<string, string> = {
  limpezaArea: 'Limpeza de Área',
  comunicacoesOperantes: 'Comunicações Operantes',
}

const DESCRICAO_LABELS: Record<string, string> = {
  materialEspecifico: 'Material específico',
  locacaoMaquinas: 'Locação de Máquinas/Ferramentas',
  apoioOutraEquipe: 'Apoio de outra equipe',
}

const STATUS_PDF_STYLES: Record<FormStatus, { bg: [number, number, number]; text: [number, number, number] }> = {
  rascunho: { bg: [228, 232, 240], text: [55, 65, 81] },
  enviado: { bg: [219, 234, 254], text: [30, 64, 175] },
  em_analise: { bg: [254, 243, 199], text: [120, 53, 15] },
  aprovado: { bg: [220, 252, 231], text: [4, 120, 87] },
  reprovado: { bg: [254, 226, 226], text: [153, 27, 27] },
}

export function nomeArquivoPdf(formulario: FormularioAvaliacao) {
  const numero = formulario.infoGerais.numeroSolicitacao || formulario.id.slice(0, 8)
  return `ficha-tecnica-${numero}.pdf`
}

async function carregarLogoNormatel(): Promise<string | undefined> {
  try {
    const logoUrl = new URL('/Normatel Engenharia Vazado (2).png', window.location.origin).href
    const response = await fetch(logoUrl)
    if (!response.ok) return undefined
    const blob = await response.blob()
    const dataUrl = await blobParaDataUrl(blob)
    return dataUrl
  } catch {
    return undefined
  }
}

export async function gerarPdfFormulario(formulario: FormularioAvaliacao): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const footerHeight = 32
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin
  let page = 1
  const logoDataUrl = await carregarLogoNormatel()

  function ensurePageSpace(space: number) {
    if (y + space > pageHeight - margin - footerHeight) {
      drawFooter()
      doc.addPage()
      page += 1
      y = margin
      drawHeader()
    }
  }

  function drawHeader() {
    const titleColor = [21, 86, 66] as const
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, y, 100, 34)
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...titleColor)
    const reportTitle = 'Relatório de Avaliação de Serviço'
    doc.text(reportTitle, margin + (logoDataUrl ? 116 : 0), y + 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(98, 105, 113)
    doc.text('Ficha técnica', margin + (logoDataUrl ? 116 : 0), y + 36)
    const metaX = pageWidth - margin
    doc.setFontSize(9)
    doc.text(`ID: ${formulario.id}`, metaX, y + 34, { align: 'right' })
    doc.text(`Gerado: ${formatarDataHora(new Date().toISOString())}`, metaX, y + 50, { align: 'right' })
    doc.setDrawColor(210, 214, 218)
    doc.setLineWidth(1)
    doc.line(margin, y + 56, pageWidth - margin, y + 56)
    y += 68
  }

  function drawFooter() {
    const footerY = pageHeight - margin + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(142, 149, 157)
    doc.text(`Emitido em ${formatarDataHora(new Date().toISOString())}`, margin, footerY)
    doc.text(`Página ${page}`, pageWidth - margin, footerY, { align: 'right' })
  }

  function sectionHeader(title: string) {
    ensurePageSpace(42)
    doc.setFillColor(244, 247, 247)
    doc.roundedRect(margin, y, contentWidth, 28, 6, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(19, 78, 64)
    doc.text(title, margin + 12, y + 18)
    y += 40
  }

  function drawField(label: string, value: string, x: number, width: number) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(97, 104, 111)
    doc.text(label, x, y)
    const valueLines = doc.splitTextToSize(value || 'Não informado', width)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(26, 32, 39)
    doc.text(valueLines, x, y + 14)
    return valueLines.length * 12 + 20
  }

  function drawTwoColumns(label1: string, value1: string, label2: string, value2: string) {
    const columnWidth = (contentWidth - 16) / 2
    const startY = y
    const height1 = drawField(label1, value1, margin, columnWidth)
    y = startY
    const height2 = drawField(label2, value2, margin + columnWidth + 16, columnWidth)
    y = startY + Math.max(height1, height2)
  }

  function drawStatusBadge(status: FormStatus) {
    const style = STATUS_PDF_STYLES[status]
    const label = STATUS_LABELS[status]
    const badgeWidth = doc.getTextWidth(label) + 18
    const badgeHeight = 16
    doc.setFillColor(...style.bg)
    doc.roundedRect(margin, y - 4, badgeWidth, badgeHeight, 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...style.text)
    doc.text(label, margin + 9, y + 8)
  }

  function drawMetricRow(label: string, value: string) {
    const currentY = y
    const lines = doc.splitTextToSize(value || 'Não informado', contentWidth - 120)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(97, 104, 111)
    doc.text(label, margin, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(26, 32, 39)
    doc.text(lines, margin + 120, currentY)
    y += Math.max(lines.length * 12, 16) + 12
  }

  function imageFormat(dataUrl: string) {
    const match = dataUrl.match(/^data:image\/(\w+);base64,/) || dataUrl.match(/^data:image\/(\w+);/)
    const type = match ? match[1].toLowerCase() : 'png'
    if (type === 'jpg') return 'JPEG'
    if (type === 'jpeg') return 'JPEG'
    if (type === 'png') return 'PNG'
    if (type === 'webp') return 'WEBP'
    return 'PNG'
  }

  function drawImagesSection(images: { dataUrl: string; nome?: string }[]) {
    if (images.length === 0) return
    sectionHeader('Anexos Fotográficos')
    const perRow = 3
    const spacing = 10
    const imageWidth = (contentWidth - spacing * (perRow - 1)) / perRow
    const maxHeight = 120

    for (let index = 0; index < images.length; index += perRow) {
      const row = images.slice(index, index + perRow)
      const previews = row.map((image) => {
        const props = doc.getImageProperties(image.dataUrl)
        const ratio = props.width / props.height
        const width = imageWidth
        const height = Math.min(maxHeight, width / ratio)
        const captionLines = doc.splitTextToSize(image.nome || 'Imagem', width)
        return { image, width, height, captionLines }
      })
      const rowHeight = Math.max(...previews.map((item) => item.height + item.captionLines.length * 9 + 14))
      ensurePageSpace(rowHeight + 10)
      let x = margin
      for (const preview of previews) {
        doc.setDrawColor(206, 212, 218)
        doc.setLineWidth(0.5)
        doc.rect(x, y, preview.width, preview.height)
        const format = imageFormat(preview.image.dataUrl)
        try {
          doc.addImage(preview.image.dataUrl, format as any, x, y, preview.width, preview.height)
        } catch {
          // fallback, continue drawing caption only
        }
        const captionY = y + preview.height + 12
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(89, 97, 104)
        doc.text(preview.captionLines, x, captionY)
        x += preview.width + spacing
      }
      y += rowHeight + 10
    }
  }

  drawHeader()

  sectionHeader('Informações Gerais')
  drawStatusBadge(formulario.status)
  y += 14
  drawTwoColumns('Responsável', formulario.infoGerais.responsavel || 'Não informado', 'Nº da Solicitação', formulario.infoGerais.numeroSolicitacao || 'Sem número')
  drawTwoColumns('Data da Avaliação', formulario.infoGerais.dataAvaliacao ? formatarData(formulario.infoGerais.dataAvaliacao) : 'Não informada', 'Tempo Estimado', formulario.infoGerais.tempoEstimadoExecucao || 'Não informado')
  drawTwoColumns('Equipe Necessária', formulario.infoGerais.equipeNecessaria || 'Não informada', 'Lotação', formulario.infoGerais.lotacao || 'Não informada')
  drawTwoColumns('Local da Atividade', formulario.infoGerais.localAtividade || 'Não informado', 'Status', STATUS_LABELS[formulario.status])
  drawTwoColumns('Projeto', formulario.projeto || 'Não informado', 'Atualizado em', formatarDataHora(formulario.updatedAt || formulario.createdAt || new Date().toISOString()))

  sectionHeader('Necessidades da Execução')
  const necessidades = formulario.necessidades as unknown as Record<string, { necessario: boolean; dias?: number; data?: string; descricao?: string }>
  const itens: string[] = []
  // Equipamentos primeiro, na mesma ordem em que aparecem no formulário.
  for (const chave of EQUIPAMENTO_CHAVES) {
    const equipamento = formulario.necessidades.equipamentos?.[chave]
    if (!equipamento?.necessario) continue
    const detalhes = [
      equipamento.dias ? `${equipamento.dias} dia(s)` : null,
      equipamento.data ? formatarData(equipamento.data) : null,
    ].filter(Boolean)
    itens.push(`${EQUIPAMENTO_LABELS[chave]}${detalhes.length ? `: ${detalhes.join(', ')}` : ''}`)
  }
  for (const [chave, rotulo] of Object.entries(QTD_DIAS_LABELS)) {
    if (necessidades[chave]?.necessario) itens.push(`${rotulo}: ${necessidades[chave].dias ?? 0} dia(s)`)
  }
  for (const [chave, rotulo] of Object.entries(AGENDAMENTO_LABELS)) {
    if (necessidades[chave]?.necessario) itens.push(`${rotulo}${necessidades[chave].data ? ` (${formatarData(necessidades[chave].data as string)})` : ''}`)
  }
  for (const [chave, rotulo] of Object.entries(DESCRICAO_LABELS)) {
    if (necessidades[chave]?.necessario) itens.push(`${rotulo}: ${necessidades[chave].descricao || 'sem descrição'}`)
  }
  if (itens.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(26, 32, 39)
    doc.text('Nenhuma necessidade marcada.', margin, y)
    y += 18
  } else {
    for (const item of itens) {
      ensurePageSpace(26)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(26, 32, 39)
      const lines = doc.splitTextToSize(item, contentWidth)
      doc.text(lines, margin, y)
      y += lines.length * 12 + 8
    }
  }

  sectionHeader('Observações e Apoio')
  const observacoes = formulario.observacoes || 'Sem observações.'
  const apoio = formulario.descricaoApoio || 'Sem descrição de apoio.'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  doc.text('Apoio necessário', margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(26, 32, 39)
  doc.text(doc.splitTextToSize(apoio, contentWidth), margin, y)
  y += doc.splitTextToSize(apoio, contentWidth).length * 12 + 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  doc.text('Observações', margin, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(26, 32, 39)
  doc.text(doc.splitTextToSize(observacoes, contentWidth), margin, y)
  y += doc.splitTextToSize(observacoes, contentWidth).length * 12 + 16

  sectionHeader('Anexos')
  drawMetricRow('Localização GPS', formulario.localizacao ? `${formulario.localizacao.latitude.toFixed(6)}, ${formulario.localizacao.longitude.toFixed(6)}` : 'Não capturada')
  drawMetricRow('Colaborador', formulario.criadoPorNome || formulario.infoGerais.responsavel || 'Não informado')
  if (formulario.assinaturaDataUrl) {
    ensurePageSpace(140)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    doc.text('Assinatura', margin, y)
    const assinaturaWidth = 220
    const assinaturaHeight = 80
    const assinaturaY = y + 12
    doc.setDrawColor(206, 212, 218)
    doc.setLineWidth(0.5)
    doc.rect(margin, assinaturaY, assinaturaWidth, assinaturaHeight)
    try {
      const format = imageFormat(formulario.assinaturaDataUrl)
      doc.addImage(formulario.assinaturaDataUrl, format as any, margin + 4, assinaturaY + 4, assinaturaWidth - 8, assinaturaHeight - 8)
    } catch {
      // continue without image
    }
    y = assinaturaY + assinaturaHeight + 18
  } else {
    drawMetricRow('Assinatura digital', 'Não registrada')
  }

  if (formulario.imagens.length > 0) {
    drawImagesSection(formulario.imagens.map((imagem) => ({ dataUrl: imagem.dataUrl, nome: imagem.nome || '' })))
  }

  drawFooter()
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
