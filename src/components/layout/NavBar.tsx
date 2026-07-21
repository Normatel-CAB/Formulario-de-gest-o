import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/authStore'
import type { Papel } from '../../lib/types'
import { DashboardIcon, HistoryIcon, MailIcon, PlusIcon, ShieldIcon } from './navIcons'

interface NavItem {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  roles?: Papel[]
}

const links: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/novo', label: 'Novo Formulário', icon: PlusIcon, roles: ['administrador', 'operador'] },
  { to: '/historico', label: 'Histórico', icon: HistoryIcon },
  { to: '/emails', label: 'E-mails', icon: MailIcon, roles: ['administrador', 'operador'] },
  { to: '/administracao', label: 'Administração', icon: ShieldIcon, roles: ['administrador'] },
]

export function NavBar() {
  const usuario = useAuthStore((s) => s.usuario)
  const visiveis = links.filter((l) => !l.roles || (usuario && l.roles.includes(usuario.papel)))

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur sm:hidden"
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch justify-around px-2">
        {visiveis.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150',
                isActive ? 'text-brand-400' : 'text-ink-subtle hover:text-ink',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
