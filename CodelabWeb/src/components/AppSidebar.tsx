import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export type SidebarItem = {
  key: string
  label: string
  icon: string
  href?: string
  onClick?: () => void
}

type AppSidebarProps = {
  items: SidebarItem[]
  activeKey: string
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const STORAGE_KEY = 'codelab-sidebar-collapsed'
const EXPANDED_WIDTH = '16rem'
const COLLAPSED_WIDTH = '4rem'

export function AppSidebar({ items, activeKey, onLogout, mobileOpen, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH)
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* armazenamento indisponível */
    }
  }, [collapsed])

  useEffect(() => {
    if (!mobileOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onMobileClose])

  const toggle = useCallback(() => setCollapsed((value) => !value), [])

  const itemClass = (active: boolean) =>
    [
      'flex w-full items-center gap-3 rounded border-[0.5px] px-3 py-2.5 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background',
      collapsed ? 'md:justify-center md:gap-0 md:px-0' : '',
      active
        ? 'border-transparent bg-white text-neutral-950'
        : 'border-transparent text-trail-muted hover:border-trail-line hover:bg-trail-surface hover:text-white',
    ].join(' ')

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 touch-none bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-label="Fechar menu de navegação"
          tabIndex={-1}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r-[0.5px] border-trail-line bg-trail-background/80 backdrop-blur-xl transition-[width,transform] duration-200 md:translate-x-0 ${
          collapsed ? 'md:w-16' : 'md:w-64'
        } ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full md:visible'}`}
        aria-label="Barra lateral"
      >
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b-[0.5px] border-trail-line px-4 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <a
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-white transition-colors hover:border-trail-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="CodeLab — página inicial"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              terminal
            </span>
          </a>
          <span className={`font-serif text-xl tracking-wide text-white ${collapsed ? 'md:hidden' : ''}`}>
            CodeLab
          </span>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded text-trail-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegação principal">
          {items.map((item) => {
            const active = item.key === activeKey
            const content = (
              <>
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span className={collapsed ? 'md:sr-only' : ''}>{item.label}</span>
              </>
            )

            return item.href ? (
              <a
                key={item.key}
                href={item.href}
                className={itemClass(active)}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                onClick={onMobileClose}
              >
                {content}
              </a>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  item.onClick?.()
                  onMobileClose()
                }}
                className={itemClass(active)}
                title={item.label}
              >
                {content}
              </button>
            )
          })}
        </nav>

        <div className={`border-t-[0.5px] border-trail-line p-3 ${collapsed ? 'md:flex md:justify-center' : ''}`}>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded border-[0.5px] border-trail-line bg-trail-surface px-3 py-2.5 text-sm font-medium text-trail-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trail-background"
            aria-label="Sair da conta"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
            <span className={collapsed ? 'md:sr-only' : ''}>Sair</span>
          </button>
        </div>

        <button
          type="button"
          onClick={toggle}
          className={`hidden shrink-0 items-center border-t-[0.5px] border-trail-line py-3 text-trail-muted transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white md:flex ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span className="text-sm">Recolher menu</span>}
        </button>
      </aside>
    </>
  )
}
