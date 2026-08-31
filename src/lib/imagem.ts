/**
 * Redução de foto antes de virar base64.
 *
 * POR QUE ISTO EXISTE: a foto sai do celular com 3 a 6 MB e ia inteira para o
 * banco, dentro da coluna `imagens`. Base64 ainda engorda o arquivo em cerca de
 * um terço, então uma ficha com cinco fotos passava de 25 MB — e essa ficha era
 * baixada por completo toda vez que alguém abria o Dashboard ou o Histórico.
 *
 * Uma foto de registro de campo não precisa de resolução de impressão. Ela
 * precisa mostrar o local e o que estava lá. 1600px no lado maior com qualidade
 * 0.72 cobre isso com folga e derruba o arquivo para algo entre 150 e 400 KB.
 */

/** Lado maior da imagem depois da redução, em pixels. */
const LADO_MAXIMO = 1600

/** Qualidade do JPEG. Abaixo de 0.7 começa a borrar texto de placa e etiqueta. */
const QUALIDADE = 0.72

/** Abaixo disto não vale reprocessar: já está pequena. */
const TAMANHO_MINIMO_PARA_COMPRIMIR = 300 * 1024

function lerComoDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Devolve a foto reduzida em data URL.
 *
 * Nunca falha de um jeito que impeça o envio: se o navegador não der conta do
 * canvas, volta o arquivo original. Perder a foto do colaborador em campo seria
 * muito pior do que gravar uma foto grande.
 */
export async function comprimirImagem(file: File): Promise<string> {
  const original = await lerComoDataUrl(file)

  if (!file.type.startsWith('image/')) return original
  // PNG costuma ser captura de tela ou desenho, onde recomprimir para JPEG
  // borra texto. Só passa pela redução se estiver realmente grande.
  if (file.size <= TAMANHO_MINIMO_PARA_COMPRIMIR) return original

  try {
    const img = await carregarImagem(original)
    const maior = Math.max(img.width, img.height)
    const escala = maior > LADO_MAXIMO ? LADO_MAXIMO / maior : 1

    const largura = Math.round(img.width * escala)
    const altura = Math.round(img.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) return original

    // Fundo branco: JPEG não tem transparência, e sem isto um PNG com fundo
    // transparente vira preto.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, largura, altura)
    ctx.drawImage(img, 0, 0, largura, altura)

    const reduzida = canvas.toDataURL('image/jpeg', QUALIDADE)
    // Se por algum motivo a versão reduzida ficou maior, fica com a original.
    return reduzida.length < original.length ? reduzida : original
  } catch {
    return original
  }
}

/** Tamanho aproximado em bytes de uma data URL base64, para exibir na tela. */
export function pesoAproximado(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((base64.length * 3) / 4)
}

export function formatarPeso(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
