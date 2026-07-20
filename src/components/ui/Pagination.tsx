import { Button } from './Button'

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Paginação">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>

      {pages.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-ink-subtle">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors duration-150 ${
              p === page ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-3'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Próxima página"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
    </nav>
  )
}
