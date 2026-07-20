import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

const links = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/novo', label: 'Novo Formulário', icon: PlusIcon },
  { to: '/historico', label: 'Histórico', icon: HistoryIcon },
]

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}
function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4" strokeLinecap="round" />
      <path d="M3 4v4h4M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NavBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur sm:sticky sm:top-[65px] sm:z-30 sm:border-b sm:border-t-0"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-around px-2 sm:justify-start sm:gap-2 sm:px-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors duration-150 sm:flex-none sm:flex-row sm:gap-2 sm:border-b-2 sm:border-transparent sm:px-3 sm:py-3 sm:text-sm',
                isActive ? 'text-brand-700 sm:border-brand-600' : 'text-brand-400 hover:text-brand-600',
              )
            }
          >
            <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
