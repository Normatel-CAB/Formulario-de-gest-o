import { useEffect, useState, type ReactElement } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/authStore'
import type { Papel } from '../../lib/types'
import { ChevronIcon, CollapseIcon, DashboardIcon, HistoryIcon, MailIcon, PlusIcon, ShieldIcon } from './navIcons'

interface NavChild {
  to: string
  label: string
}

interface NavItem {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  roles?: Papel[]
  children?: NavChild[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/novo', label: 'Novo Formulário', icon: PlusIcon, roles: ['administrador', 'operador'] },
  { to: '/historico', label: 'Histórico', icon: HistoryIcon },
  { to: '/emails', label: 'E-mails', icon: MailIcon, roles: ['administrador', 'operador'] },
  {
    to: '/administracao',
    label: 'Administração',
    icon: ShieldIcon,
    roles: ['administrador'],
    children: [
      { to: '/usuarios', label: 'Usuários' },
      { to: '/administracao/cargos', label: 'Cargos' },
      { to: '/administracao/permissoes', label: 'Permissões' },
      { to: '/configuracoes', label: 'Configurações' },
    ],
  },
]

const COLLAPSE_STORAGE_KEY = 'gestao-integrada:sidebar-recolhida'

export function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario)
  const location = useLocation()
  const [recolhida, setRecolhida] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const visiveis = NAV.filter((l) => !l.roles || (usuario && l.roles.includes(usuario.papel)))

  useEffect(() => {
    const abertos = new Set<string>()
    for (const item of visiveis) {
      if (item.children?.some((c) => location.pathname === c.to || location.pathname === item.to)) {
        abertos.add(item.to)
      }
    }
    setExpandidos((prev) => new Set([...prev, ...abertos]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  function alternarColapso() {
    setRecolhida((v) => {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, !v ? '1' : '0')
      return !v
    })
  }

  function alternarExpansao(to: string) {
    if (recolhida) {
      setRecolhida(false)
      localStorage.setItem(COLLAPSE_STORAGE_KEY, '0')
    }
    setExpandidos((prev) => {
      const novo = new Set(prev)
      if (novo.has(to)) novo.delete(to)
      else novo.add(to)
      return novo
    })
  }

  return (
    <aside
      className={cn(
        'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 sm:flex',
        recolhida ? 'w-16' : 'w-64',
      )}
      aria-label="Navegação principal"
    >
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {visiveis.map((item) => {
            const Icon = item.icon
            const temFilhos = Boolean(item.children?.length)
            const expandido = expandidos.has(item.to)
            const ativo = location.pathname === item.to || (item.children?.some((c) => location.pathname === c.to) ?? false)

            return (
              <li key={item.to}>
                <div
                  className={cn(
                    'group relative flex items-center rounded-lg transition-colors duration-150',
                    ativo ? 'bg-brand-500/15 text-brand-300' : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={recolhida ? item.label : undefined}
                    className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!recolhida && <span className="truncate">{item.label}</span>}
                  </NavLink>
                  {temFilhos && !recolhida && (
                    <button
                      type="button"
                      onClick={() => alternarExpansao(item.to)}
                      className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-surface-3"
                      aria-label={expandido ? `Recolher ${item.label}` : `Expandir ${item.label}`}
                      aria-expanded={expandido}
                    >
                      <ChevronIcon className={cn('h-3.5 w-3.5 transition-transform duration-150', expandido && 'rotate-90')} />
                    </button>
                  )}
                  {temFilhos && recolhida && (
                    <button
                      type="button"
                      onClick={() => alternarExpansao(item.to)}
                      className="absolute inset-0"
                      aria-label={`Expandir ${item.label}`}
                    />
                  )}
                </div>

                {temFilhos && !recolhida && expandido && (
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children!.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          className={({ isActive }) =>
                            cn(
                              'block rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                              isActive ? 'bg-brand-500/15 font-medium text-brand-300' : 'text-ink-subtle hover:bg-surface-2 hover:text-ink',
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={alternarColapso}
        className="flex items-center gap-2 border-t border-border px-3 py-3 text-sm font-medium text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
        aria-label={recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      >
        <CollapseIcon className={cn('h-4 w-4 shrink-0 transition-transform duration-200', recolhida && 'rotate-180')} />
        {!recolhida && <span>Recolher menu</span>}
      </button>
    </aside>
  )
}
