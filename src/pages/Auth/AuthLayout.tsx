import type { ReactNode } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const logoDataUrl = useSettingsStore((s) => s.logoDataUrl)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border-light bg-surface shadow-lg shadow-black/30">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Logo da empresa" className="h-full w-full object-contain" />
            ) : (
              <svg className="h-7 w-7 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 12.5l2.2 2.2L15.5 9.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">Sistema de Gestão Integrada</p>
          <h1 className="mt-1 text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/30 sm:p-8">{children}</div>
      </div>
    </div>
  )
}
