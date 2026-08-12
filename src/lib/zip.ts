/**
 * Escritor de ZIP mínimo, sem dependência externa.
 *
 * POR QUE À MÃO: o conteúdo que exportamos são fotos (JPEG/PNG), que já estão
 * comprimidas. Passá-las por deflate gastaria CPU do celular para economizar
 * quase nada, então usamos o método "store" (cópia direta) — que é justamente a
 * parte simples do formato. Trazer uma biblioteca de zip só para isso pesaria no
 * bundle de um app que roda offline em campo.
 *
 * Não implementa Zip64: o limite é 4 GB por arquivo e no total, folgado para
 * registro fotográfico.
 */

export interface ArquivoZip {
  /** Caminho dentro do zip. Use "/" para criar pastas (ex.: "SOL-1/foto.jpg"). */
  nome: string
  /** O parâmetro de tipo é necessário: `Blob` não aceita view sobre
      SharedArrayBuffer, e `Uint8Array` sem argumento inclui essa possibilidade. */
  dados: Uint8Array<ArrayBuffer>
}

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[i] = c >>> 0
  }
  return tabela
})()

function crc32(dados: Uint8Array<ArrayBuffer>) {
  let c = 0xffffffff
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Data/hora no formato MS-DOS que o cabeçalho do zip espera. */
function dataHoraDos(d = new Date()) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const data = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { hora, data }
}

export function criarZip(arquivos: ArquivoZip[]): Blob {
  const codificador = new TextEncoder()
  const { hora, data } = dataHoraDos()

  const partes: BlobPart[] = []
  const central: Uint8Array<ArrayBuffer>[] = []
  let deslocamento = 0

  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.nome)
    const soma = crc32(arquivo.dados)
    const tamanho = arquivo.dados.length

    // --- Cabeçalho local ---
    const local = new Uint8Array(30 + nome.length)
    const vl = new DataView(local.buffer)
    vl.setUint32(0, 0x04034b50, true)
    vl.setUint16(4, 20, true) // versão necessária
    // 0x0800 marca o nome do arquivo como UTF-8; sem isso acentos viram lixo no
    // Explorer do Windows.
    vl.setUint16(6, 0x0800, true)
    vl.setUint16(8, 0, true) // método: store
    vl.setUint16(10, hora, true)
    vl.setUint16(12, data, true)
    vl.setUint32(14, soma, true)
    vl.setUint32(18, tamanho, true)
    vl.setUint32(22, tamanho, true)
    vl.setUint16(26, nome.length, true)
    vl.setUint16(28, 0, true) // extra
    local.set(nome, 30)

    partes.push(local, arquivo.dados)

    // --- Entrada do diretório central ---
    const entrada = new Uint8Array(46 + nome.length)
    const vc = new DataView(entrada.buffer)
    vc.setUint32(0, 0x02014b50, true)
    vc.setUint16(4, 20, true) // versão de quem criou
    vc.setUint16(6, 20, true) // versão necessária
    vc.setUint16(8, 0x0800, true)
    vc.setUint16(10, 0, true)
    vc.setUint16(12, hora, true)
    vc.setUint16(14, data, true)
    vc.setUint32(16, soma, true)
    vc.setUint32(20, tamanho, true)
    vc.setUint32(24, tamanho, true)
    vc.setUint16(28, nome.length, true)
    vc.setUint16(30, 0, true)
    vc.setUint16(32, 0, true)
    vc.setUint16(34, 0, true)
    vc.setUint16(36, 0, true)
    vc.setUint32(38, 0, true)
    vc.setUint32(42, deslocamento, true)
    entrada.set(nome, 46)
    central.push(entrada)

    deslocamento += local.length + tamanho
  }

  const tamanhoCentral = central.reduce((s, e) => s + e.length, 0)

  // --- Fim do diretório central ---
  const fim = new Uint8Array(22)
  const vf = new DataView(fim.buffer)
  vf.setUint32(0, 0x06054b50, true)
  vf.setUint16(4, 0, true)
  vf.setUint16(6, 0, true)
  vf.setUint16(8, arquivos.length, true)
  vf.setUint16(10, arquivos.length, true)
  vf.setUint32(12, tamanhoCentral, true)
  vf.setUint32(16, deslocamento, true)
  vf.setUint16(20, 0, true)

  return new Blob([...partes, ...central, fim], { type: 'application/zip' })
}

/** Converte uma data URL (`data:image/jpeg;base64,...`) em bytes + extensão. */
export function dataUrlParaBytes(dataUrl: string): { dados: Uint8Array<ArrayBuffer>; extensao: string } | null {
  const separador = dataUrl.indexOf(',')
  if (separador === -1) return null

  const cabecalho = dataUrl.slice(0, separador)
  const corpo = dataUrl.slice(separador + 1)
  const tipo = /data:([^;,]+)/.exec(cabecalho)?.[1] ?? 'application/octet-stream'

  const EXTENSOES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/gif': 'gif',
  }
  const extensao = EXTENSOES[tipo] ?? 'bin'

  try {
    if (!cabecalho.includes('base64')) {
      return { dados: new TextEncoder().encode(decodeURIComponent(corpo)), extensao }
    }
    const binario = atob(corpo)
    const dados = new Uint8Array(binario.length)
    for (let i = 0; i < binario.length; i++) dados[i] = binario.charCodeAt(i)
    return { dados, extensao }
  } catch {
    return null
  }
}
