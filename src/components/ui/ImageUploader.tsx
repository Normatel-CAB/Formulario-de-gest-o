import { useRef, useState } from 'react'
import type { AnexoImagem } from '../../lib/types'
import { Button } from './Button'
import { comprimirImagem, formatarPeso, pesoAproximado } from '../../lib/imagem'


export function ImageUploader({
  imagens,
  onChange,
}: {
  imagens: AnexoImagem[]
  onChange: (imagens: AnexoImagem[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [processando, setProcessando] = useState(false)

  async function handleFiles(files: FileList | null, origem: 'upload' | 'camera') {
    if (!files || files.length === 0) return
    setProcessando(true)
    try {
      const novas: AnexoImagem[] = []
      for (const file of Array.from(files)) {
        // Reduz antes de guardar. A foto crua do celular tem alguns megabytes e
        // ia inteira para o banco, o que deixava o Histórico pesadíssimo.
        const dataUrl = await comprimirImagem(file)
        novas.push({
          id: crypto.randomUUID(),
          nome: file.name,
          dataUrl,
          origem,
          criadoEm: new Date().toISOString(),
        })
      }
      onChange([...imagens, ...novas])
    } finally {
      setProcessando(false)
    }
  }

  function remove(id: string) {
    onChange(imagens.filter((img) => img.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={processando} onClick={() => fileInputRef.current?.click()}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M7 9l5-5 5 5M12 4v13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Enviar imagens
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={processando} onClick={() => cameraInputRef.current?.click()}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M4 8h2l1.5-2h9L18 8h2a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Capturar com câmera
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, 'upload')}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, 'camera')}
        />
      </div>

      {processando && (
        <p className="mt-2 text-[11.5px] text-txt-dim">Reduzindo as imagens…</p>
      )}

      {imagens.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {imagens.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
              <img src={img.dataUrl} alt={img.nome} className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute bottom-1 left-1 rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {formatarPeso(pesoAproximado(img.dataUrl))}
              </span>
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Remover ${img.nome}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
