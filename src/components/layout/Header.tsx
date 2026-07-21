import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { useSyncState } from '../../hooks/useSyncState'
import { cn } from '../../lib/cn'
import { toast } from '../../store/toastStore'
import { PAPEL_LABELS } from '../../lib/types'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  const primeiras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '')
  return primeiras.join('') || 'U'
}

export function Header() {
  const { logoDataUrl, setLogo } = useSettingsStore()
  const sync = useSyncState()
  const { usuario, sair } = useAuthStore()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const podeEditarLogo = usuario?.papel === 'administrador'

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', onClickFora)
    return () => document.removeEventListener('mousedown', onClickFora)
  }, [])

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    await setLogo(dataUrl)
    toast({ variant: 'success', title: 'Logo atualizada com sucesso' })
  }

  function sairDoSistema() {
    sair()
    setMenuAberto(false)
    navigate('/login', { replace: true })
    toast({ variant: 'success', title: 'Sessão encerrada' })
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 shadow-lg shadow-black/30">
      <div className="mx-auto flex max-w-7xl items-center gap-4 pl-2 pr-4 py-2 sm:pl-3 sm:pr-6">
        <button
          type="button"
          onClick={() => podeEditarLogo && inputRef.current?.click()}
          className={cn(
            'group relative flex h-10 shrink-0 items-center sm:h-11',
            !podeEditarLogo && 'cursor-default',
          )}
          title={podeEditarLogo ? 'Clique para alterar a logo da empresa' : 'Logo da empresa'}
          aria-label="Logo da empresa"
        >
          <img
            src={logoDataUrl || '/Normatel Engenharia_BRANCO.svg'}
            alt="Logo da empresa"
            className="h-full w-auto max-w-[10rem] object-contain object-left"
          />
          {podeEditarLogo && (
            <span className="absolute inset-0 hidden items-center justify-center rounded-lg bg-black/50 text-[9px] font-medium text-white group-hover:flex">
              Alterar
            </span>
          )}
        </button>
        {podeEditarLogo && <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-white/80 sm:text-sm">
            Sistema de Gestão Integrada
          </p>
          <h1 className="truncate text-sm font-bold text-white sm:text-base">
            Formulário de Gestão · Ficha Técnica de Avaliação de Serviços
          </h1>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              sync.online ? 'bg-white/15 text-white' : 'bg-amber-400/20 text-amber-200',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', sync.online ? 'bg-brand-300' : 'bg-amber-400')} />
            {sync.online ? 'Online' : 'Offline'}
          </span>
          {sync.pending > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-sky-400/20 px-2.5 py-1 text-xs font-medium text-sky-100">
              {sync.syncing ? 'Sincronizando…' : `${sync.pending} pendente(s)`}
            </span>
          )}
        </div>

        {usuario && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/15"
              aria-haspopup="menu"
              aria-expanded={menuAberto}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-semibold text-white">
                {iniciais(usuario.nome)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-white">{usuario.nome}</span>
                <span className="block text-xs leading-tight text-white/70">{PAPEL_LABELS[usuario.papel]}</span>
              </span>
              <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuAberto && (
              <div
                role="menu"
                className="animate-scale-in absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-xl shadow-black/40"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate('/perfil')
                    setMenuAberto(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-3"
                >
                  Meu Perfil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={sairDoSistema}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
