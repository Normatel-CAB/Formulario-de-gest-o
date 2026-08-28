import { useEffect, useRef, useState, type ReactElement } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSyncState } from '../../hooks/useSyncState'
import { toast } from '../../store/toastStore'
import { PAPEL_LABELS, type Papel } from '../../lib/types'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Logo } from '../ui/Logo'
import { BotaoInstalar } from '../pwa/InstalarApp'
import {
  ChevronIcon,
  CloseIcon,
  CollapseIcon,
  DashboardIcon,
  FormsIcon,
  HistoryIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from './navIcons'

interface NavChild {
  to: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  roles?: Papel[]
}

interface NavGroup {
  key: string
  label: string
  icon: (props: { className?: string }) => ReactElement
  roles?: Papel[]
  to?: string
  children?: NavChild[]
}

const NAV: NavGroup[] = [
  { key: 'dashboard', to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  {
    key: 'formularios',
    label: 'Formulários',
    icon: FormsIcon,
    children: [
      { to: '/novo', label: 'Nova Ficha', icon: PlusIcon, roles: ['administrador', 'operador'] },
      { to: '/historico', label: 'Histórico', icon: HistoryIcon },
    ],
  },
  {
    key: 'administracao',
    label: 'Administração',
    icon: ShieldIcon,
    roles: ['administrador'],
    children: [
      { to: '/usuarios', label: 'Usuários', icon: UsersIcon },
      { to: '/administracao/cargos', label: 'Cargos', icon: ShieldIcon },
      { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
    ],
  },
]

const COLLAPSE_STORAGE_KEY = 'gestao-integrada:sidebar-recolhida'

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

export function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario)
  const sair = useAuthStore((s) => s.sair)
  const setLogo = useSettingsStore((s) => s.setLogo)
  const sync = useSyncState()
  const location = useLocation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [recolhida, setRecolhida] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [mobileOpen, setMobileOpen] = useState(false)

  const visiveis = NAV.filter((l) => !l.roles || (usuario && l.roles.includes(usuario.papel)))
  const podeEditarLogo = usuario?.papel === 'administrador'

  useEffect(() => {
    const abertos = new Set<string>()
    for (const item of visiveis) {
      if (item.children?.some((c) => location.pathname === c.to)) abertos.add(item.key)
    }
    setExpandidos((prev) => new Set([...prev, ...abertos]))
    setMobileOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  function alternarColapso() {
    setRecolhida((v) => {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, !v ? '1' : '0')
      return !v
    })
  }

  function alternarExpansao(key: string) {
    if (recolhida) {
      setRecolhida(false)
      localStorage.setItem(COLLAPSE_STORAGE_KEY, '0')
    }
    setExpandidos((prev) => {
      const novo = new Set(prev)
      if (novo.has(key)) novo.delete(key)
      else novo.add(key)
      return novo
    })
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    await setLogo(dataUrl)
    toast({ variant: 'success', title: 'Logo atualizada com sucesso' })
  }

  function sairDoSistema() {
    sair()
    navigate('/login', { replace: true })
    toast({ variant: 'success', title: 'Sessão encerrada' })
  }

  function renderNav(compacta: boolean) {
    return (
      <ul className="space-y-0.5 px-2">
        {visiveis.map((item) => {
          const Icon = item.icon
          const temFilhos = Boolean(item.children?.length)
          const expandido = expandidos.has(item.key)
          const filhosVisiveis = item.children?.filter((c) => !c.roles || (usuario && c.roles.includes(usuario.papel))) ?? []
          const ativo =
            (item.to && location.pathname === item.to) || filhosVisiveis.some((c) => location.pathname === c.to)

          return (
            <li key={item.key}>
              {item.to && !temFilhos ? (
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[12.5px] font-medium transition-all duration-200 ease-smooth',
                      compacta && 'justify-center px-0',
                      isActive
                        ? 'bg-gradient-to-r from-brand to-[#3D9142] font-semibold text-white shadow-brand-sm ring-1 ring-inset ring-white/10'
                        : 'text-txt-dim hover:translate-x-0.5 hover:bg-surface-2 hover:text-txt',
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!compacta && <span className="truncate">{item.label}</span>}
                  {compacta && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-surface-solid px-2.5 py-1.5 text-[11.5px] font-medium text-txt opacity-0 shadow-glass transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ) : (
                <button
                  type="button"
                  onClick={() => alternarExpansao(item.key)}
                  aria-expanded={expandido}
                  className={cn(
                    'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[12.5px] font-semibold transition-colors duration-200',
                    compacta && 'justify-center px-0',
                    ativo ? 'bg-surface-2 text-txt' : 'text-txt-dim hover:bg-surface-2 hover:text-txt',
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!compacta && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      <ChevronIcon className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', expandido && 'rotate-90')} />
                    </>
                  )}
                  {compacta && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-surface-solid px-2.5 py-1.5 text-[11.5px] font-medium text-txt opacity-0 shadow-glass transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </button>
              )}

              {temFilhos && !compacta && (
                <div
                  className={cn(
                    'grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out',
                    expandido ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <ul className="ml-3.5 min-h-0 space-y-0.5 border-l border-hairline py-1 pl-3">
                    {filhosVisiveis.map((child) => {
                      const ChildIcon = child.icon
                      return (
                        <li key={child.to}>
                          <NavLink
                            to={child.to}
                            className={({ isActive }) =>
                              cn(
                                'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] transition-all duration-200',
                                isActive
                                  ? 'bg-gradient-to-r from-brand to-[#3D9142] font-semibold text-white shadow-brand-sm ring-1 ring-inset ring-white/10'
                                  : 'text-txt-dim hover:translate-x-0.5 hover:bg-surface-2 hover:text-txt',
                              )
                            }
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  function renderFooter(compacta: boolean) {
    if (!usuario) return null
    return (
      <div className="border-t border-hairline p-2">
        <div className={cn('mb-1.5 flex items-center gap-2 rounded-xl px-2 py-1.5', compacta && 'justify-center px-0')}>
          <span
            className={cn(
              'flex h-2.5 w-2.5 shrink-0 rounded-full',
              sync.online ? 'bg-brand animate-brand-pulse' : 'bg-viz-amber',
            )}
            title={sync.online ? 'Online' : 'Offline'}
          />
          {!compacta && (
            <span className="truncate text-xs font-medium text-ink-subtle">
              {sync.online ? (sync.syncing ? 'Sincronizando…' : sync.pending > 0 ? `${sync.pending} pendente(s)` : 'Online') : 'Offline'}
            </span>
          )}
        </div>

        <div className={cn('flex items-center gap-2.5 rounded-xl px-2 py-2', compacta && 'justify-center px-0')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-viz-teal to-brand text-[11px] font-bold text-[#06210B]">
            {iniciais(usuario.nome)}
          </span>
          {!compacta && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight text-ink">{usuario.nome}</span>
              {/* Mostra o cargo, que é o que a pessoa reconhece e o que o
                  administrador escolheu. O papel antigo é detalhe interno. */}
              <span className="block truncate text-xs leading-tight text-ink-subtle">
                {usuario.cargoNome || PAPEL_LABELS[usuario.papel]}
              </span>
            </span>
          )}
        </div>

        <div className={cn('mt-1 flex items-center gap-1', compacta && 'flex-col')}>
          <ThemeToggle className="h-8 w-8 shrink-0" />
          {!compacta && <BotaoInstalar className="shrink-0" />}
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            title="Meu perfil"
            className={cn(
              'group relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink',
              compacta && 'w-full flex-none',
            )}
          >
            <UserIcon className="h-4 w-4" />
            {!compacta && <span>Perfil</span>}
          </button>
          <button
            type="button"
            onClick={sairDoSistema}
            title="Sair"
            className={cn(
              'group relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-viz-red transition-colors hover:bg-viz-red/10',
              compacta && 'w-full flex-none',
            )}
          >
            <LogoutIcon className="h-4 w-4" />
            {!compacta && <span>Sair</span>}
          </button>
        </div>
      </div>
    )
  }

  function renderLogo(compacta: boolean) {
    return (
      <div className={cn('flex h-16 shrink-0 items-center gap-2 border-b border-hairline px-3', compacta && 'justify-center px-2')}>
        <button
          type="button"
          onClick={() => podeEditarLogo && inputRef.current?.click()}
          className={cn('group relative flex items-center', !podeEditarLogo && 'cursor-default')}
          title={podeEditarLogo ? 'Clique para alterar a logo da empresa' : 'Logo da empresa'}
        >
          <Logo className="h-9 w-9 shrink-0" withWordmark={!compacta} wordmarkClassName="text-left" />
          {podeEditarLogo && (
            <span className="absolute inset-0 hidden items-center justify-center rounded-lg bg-black/60 text-[8px] font-medium text-white group-hover:flex">
              Alterar
            </span>
          )}
        </button>
        {podeEditarLogo && <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />}
      </div>
    )
  }

  return (
    <>
      <div style={{ background: 'var(--sidebar-bg)' }} className="safe-top sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="tap-target flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-txt-dim transition-colors hover:bg-surface-2 hover:text-txt"
          aria-label="Abrir menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Logo className="h-8 w-8" withWordmark />
        <ThemeToggle className="ml-auto" />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="safe-top safe-bottom animate-slide-up absolute inset-y-0 left-0 flex w-[268px] flex-col border-r border-hairline shadow-glass backdrop-blur-xl" style={{ background: 'var(--sidebar-bg)' }}>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline px-4">
              <Logo className="h-9 w-9" withWordmark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="tap-target flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-txt-dim hover:bg-surface-2 hover:text-txt"
                aria-label="Fechar menu"
              >
                <CloseIcon className="h-4.5 w-4.5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3" aria-label="Navegação principal">
              {renderNav(false)}
            </nav>
            {renderFooter(false)}
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'safe-top safe-bottom sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-hairline backdrop-blur-xl transition-[width] duration-300 ease-smooth lg:flex',
          recolhida ? 'w-[4.5rem]' : 'w-64',
        )}
        style={{ background: 'var(--sidebar-bg)' }}
        aria-label="Navegação principal"
      >
        {renderLogo(recolhida)}
        <nav className="flex-1 overflow-y-auto py-3">{renderNav(recolhida)}</nav>
        {renderFooter(recolhida)}
        <button
          type="button"
          onClick={alternarColapso}
          className="flex items-center justify-center gap-2 border-t border-hairline px-3 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-txt-faint transition-colors hover:bg-surface-2 hover:text-txt"
          aria-label={recolhida ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          <CollapseIcon className={cn('h-4 w-4 shrink-0 transition-transform duration-200', recolhida && 'rotate-180')} />
          {!recolhida && <span>Recolher menu</span>}
        </button>
      </aside>
    </>
  )
}
