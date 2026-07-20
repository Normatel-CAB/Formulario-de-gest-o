import { useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useSyncState } from '../../hooks/useSyncState'
import { cn } from '../../lib/cn'
import { toast } from '../../store/toastStore'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function Header() {
  const { logoDataUrl, setLogo } = useSettingsStore()
  const sync = useSyncState()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    await setLogo(dataUrl)
    toast({ variant: 'success', title: 'Logo atualizada com sucesso' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-200 bg-brand-50"
          title="Clique para alterar a logo da empresa"
          aria-label="Inserir logo da empresa"
        >
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Logo da empresa" className="h-full w-full object-contain" />
          ) : (
            <svg className="h-5 w-5 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M7 9l5-5 5 5M12 4v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="absolute inset-0 hidden items-center justify-center bg-brand-950/50 text-[9px] font-medium text-white group-hover:flex">
            Alterar
          </span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-brand-600 sm:text-sm">
            Sistema de Gestão Integrada
          </p>
          <h1 className="truncate text-sm font-bold text-brand-950 sm:text-base">
            Formulário de Gestão · Ficha Técnica de Avaliação de Serviços
          </h1>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              sync.online ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', sync.online ? 'bg-brand-500' : 'bg-amber-500')} />
            {sync.online ? 'Online' : 'Offline'}
          </span>
          {sync.pending > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
              {sync.syncing ? 'Sincronizando…' : `${sync.pending} pendente(s)`}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
