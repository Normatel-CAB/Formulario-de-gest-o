import type { FormularioAvaliacao } from './types'
import { criarZip, dataUrlParaBytes, type ArquivoZip } from './zip'

/**
 * Exportação do registro fotográfico em .zip.
 *
 * Roda inteiramente no navegador: o zip é montado em memória a partir das fotos
 * que já vieram do Supabase, e o download é um Blob local. Não há passo de
 * servidor, nem nada a instalar na máquina de quem baixa — abrir o site basta.
 *
 * Só fotos entram no pacote. A assinatura fica fora de propósito: quem pede o
 * zip quer o registro fotográfico da atividade, e a assinatura já consta no PDF
 * da ficha.
 */

/**
 * Nome de pasta/arquivo derivado do número da solicitação.
 *
 * O número é digitado à mão em campo, então pode vir com barra, dois-pontos ou
 * acento, caracteres que o Windows recusa em nome de arquivo. Aqui ele é
 * normalizado antes de virar nome de pasta e de .zip.
 */
export function nomeBaseFotos(formulario: FormularioAvaliacao) {
  const numero = formulario.infoGerais.numeroSolicitacao?.trim()
  return sanitizar(numero || `ficha-${formulario.id.slice(0, 8)}`) || `ficha-${formulario.id.slice(0, 8)}`
}

function sanitizar(bruto: string) {
  return bruto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function nomeArquivoFotos(formulario: FormularioAvaliacao) {
  return `${nomeBaseFotos(formulario)}.zip`
}

/** Quantas fotos a ficha tem. É o que habilita ou não o botão de exportar. */
export function totalFotos(formulario: FormularioAvaliacao) {
  return formulario.imagens?.length ?? 0
}

export class SemFotosError extends Error {
  constructor(mensagem = 'Nenhuma foto encontrada para exportar.') {
    super(mensagem)
  }
}

/** Converte as fotos de uma ficha em entradas do zip, dentro de `pasta`. */
function entradasDaFicha(formulario: FormularioAvaliacao, pasta: string): ArquivoZip[] {
  const entradas: ArquivoZip[] = []
  formulario.imagens.forEach((imagem, i) => {
    const convertida = dataUrlParaBytes(imagem.dataUrl)
    if (!convertida) return
    const sequencia = String(i + 1).padStart(2, '0')
    entradas.push({
      nome: `${pasta}/${pasta}-foto-${sequencia}.${convertida.extensao}`,
      dados: convertida.dados,
    })
  })
  return entradas
}

/** Zip de uma única ficha: as fotos dentro de uma pasta com o nº da solicitação. */
export function montarZipFotos(formulario: FormularioAvaliacao): Blob {
  const entradas = entradasDaFicha(formulario, nomeBaseFotos(formulario))
  if (entradas.length === 0) throw new SemFotosError('Esta ficha não tem fotos anexadas.')
  return criarZip(entradas)
}

/**
 * Zip de várias fichas: uma pasta por ficha, nomeada pelo nº da solicitação.
 *
 * Duas fichas podem trazer o mesmo número (digitação repetida em campo). Sem
 * tratar isso, as fotos da segunda cairiam na pasta da primeira e ficaria
 * parecendo que uma ficha tem o dobro de fotos, então o repetido ganha sufixo.
 */
export function montarZipFotosLote(formularios: FormularioAvaliacao[]): Blob {
  const usados = new Map<string, number>()
  const entradas: ArquivoZip[] = []

  for (const formulario of formularios) {
    if (totalFotos(formulario) === 0) continue
    const base = nomeBaseFotos(formulario)
    const repeticoes = usados.get(base) ?? 0
    usados.set(base, repeticoes + 1)
    const pasta = repeticoes === 0 ? base : `${base}-${repeticoes + 1}`
    entradas.push(...entradasDaFicha(formulario, pasta))
  }

  if (entradas.length === 0) throw new SemFotosError('Nenhuma das fichas filtradas tem fotos.')
  return criarZip(entradas)
}

/** Nome do zip em lote, com o intervalo de datas quando houver. */
export function nomeArquivoLote(de?: string, ate?: string) {
  if (de && ate) return `fotos-${de}_a_${ate}.zip`
  if (de) return `fotos-desde-${de}.zip`
  if (ate) return `fotos-ate-${ate}.zip`
  return `fotos-${new Date().toISOString().slice(0, 10)}.zip`
}

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  // Revogar na hora cancelaria o download em alguns navegadores.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function baixarZipFotos(formulario: FormularioAvaliacao) {
  baixarBlob(montarZipFotos(formulario), nomeArquivoFotos(formulario))
}

export function baixarZipFotosLote(formularios: FormularioAvaliacao[], de?: string, ate?: string) {
  baixarBlob(montarZipFotosLote(formularios), nomeArquivoLote(de, ate))
}

/** Soma das fotos de uma lista, para rotular o botão de exportação em lote. */
export function resumoLote(formularios: FormularioAvaliacao[]) {
  const comFotos = formularios.filter((f) => totalFotos(f) > 0)
  return {
    fichas: comFotos.length,
    fotos: comFotos.reduce((s, f) => s + totalFotos(f), 0),
  }
}
