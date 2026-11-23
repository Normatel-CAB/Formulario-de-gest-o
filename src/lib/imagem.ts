/**
 * Redução de foto antes de virar base64.
 *
 * POR QUE ISTO EXISTE: a foto sai do celular com 3 a 6 MB e ia inteira para o
 * banco, dentro da coluna `imagens`. Base64 ainda engorda o arquivo em cerca de
 * um terço, então uma ficha com cinco fotos passava de 25 MB — e essa ficha era
 * baixada por completo toda vez que alguém abria o Dashboard ou o Histórico.
 *
 * Uma foto de registro de campo não precisa de resolução de impressão. Ela
 * precisa mostrar o local e o que estava lá.
 */

/**
 * Mesmo padrão do Aplicativo RH (PR "Comprime fotos antes do upload"): lado
 * maior em 1920px e JPEG 0.82. Ficou legível lá em atestado com letra miúda,
 * então serve com folga pra foto de campo. O script
 * scripts/comprimir-fotos-antigas.mjs usa os mesmos números.
 */
export const LADO_MAXIMO = 1920
export const QUALIDADE = 0.82

const TIPOS_COMPRIMIVEIS = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp']

function lerComoDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Devolve a foto reduzida em data URL.
 *
 * Nunca falha de um jeito que impeça o envio: se o navegador não der conta,
 * volta o arquivo original. Perder a foto do colaborador em campo seria muito
 * pior do que gravar uma foto grande.
 */
export async function comprimirImagem(file: File): Promise<string> {
  if (!TIPOS_COMPRIMIVEIS.includes(file.type) || typeof createImageBitmap !== 'function') {
    return lerComoDataUrl(file)
  }
  try {
    // from-image respeita a orientacao que o celular grava na foto, senao foto em pe sai deitada
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) return lerComoDataUrl(file)

    // Fundo branco: JPEG não tem transparência, e sem isto um PNG com fundo
    // transparente vira preto.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, largura, altura)
    ctx.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALIDADE))
    if (!blob || blob.size >= file.size) return lerComoDataUrl(file)
    return lerComoDataUrl(blob)
  } catch {
    return lerComoDataUrl(file)
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
