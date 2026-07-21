import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/authStore'
import type { Papel } from '../../lib/types'

interface NavItem {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  roles?: Papel[]
}

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
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" strokeLinecap="round" />
      <path d="M16 8.5a2.8 2.8 0 100 5.6M18.5 19c0-2.4-1.6-4.4-3.8-5" strokeLinecap="round" />
    </svg>
  )
}
function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.4-2.4.6a7.7 7.7 0 00-1.7-1L15 3h-4l-.3 2.6a7.7 7.7 0 00-1.7 1l-2.4-.6-2 3.4L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.4 2.4-.6c.5.4 1.1.8 1.7 1L11 21h4l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4.6 2-3.4L19.4 13z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 6.5l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
    </svg>
  )
}
function HardHatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 16a8 8 0 0116 0" strokeLinecap="round" />
      <path d="M2.5 16h19M12 8V4" strokeLinecap="round" />
    </svg>
  )
}

const links: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/novo', label: 'Novo Formulário', icon: PlusIcon, roles: ['administrador', 'operador'] },
  { to: '/historico', label: 'Histórico', icon: HistoryIcon },
  { to: '/emails', label: 'E-mails', icon: MailIcon, roles: ['administrador', 'operador'] },
  { to: '/sms', label: 'Solicitação de SMS', icon: CalendarIcon, roles: ['administrador', 'operador'] },
  { to: '/tecnicos', label: 'Técnicos', icon: HardHatIcon, roles: ['administrador'] },
  { to: '/administracao', label: 'Administração', icon: ShieldIcon, roles: ['administrador'] },
  { to: '/usuarios', label: 'Usuários', icon: UsersIcon, roles: ['administrador'] },
  { to: '/administracao/cargos', label: 'Cargos', icon: ShieldIcon, roles: ['administrador'] },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon, roles: ['administrador'] },
]

export function NavBar() {
  const usuario = useAuthStore((s) => s.usuario)
  const visiveis = links.filter((l) => !l.roles || (usuario && l.roles.includes(usuario.papel)))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur sm:sticky sm:top-[65px] sm:z-30 sm:border-b sm:border-t-0"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-around overflow-x-auto px-2 sm:justify-start sm:gap-2 sm:px-6">
        {visiveis.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 sm:flex-none sm:flex-row sm:gap-2 sm:whitespace-nowrap sm:border-b-2 sm:border-transparent sm:px-3 sm:py-3 sm:text-sm',
                isActive ? 'text-brand-400 sm:border-brand-500' : 'text-ink-subtle hover:text-ink',
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
