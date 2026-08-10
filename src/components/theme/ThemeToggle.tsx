import { useTheme } from './ThemeProvider'
import { cn } from '../../lib/cn'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema"
      className={cn(
        'grid h-9 w-9 place-items-center rounded-md border border-hairline bg-surface text-txt-dim',
        'transition-all duration-200 hover:-translate-y-px hover:border-hairline-hi hover:text-txt',
        className,
      )}
    >
      {/* variante nativa do Tailwind: evita o flash do ícone errado antes da hidratação */}
      <svg className="block h-[15px] w-[15px] dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="hidden h-[15px] w-[15px] dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  )
}
