import { useCallback, useEffect, useState } from 'react'

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
}

const STORAGE_KEY = 'codelab-sidebar-collapsed'
const EXPANDED_WIDTH = '16rem'
const COLLAPSED_WIDTH = '4rem'

export function AppSidebar({ items, activeKey, onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch (error) {
      console.warn('Não foi possível ler o estado da barra lateral.', error)
      return false
    }
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH)
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch (error) {
      console.warn('Não foi possível salvar o estado da barra lateral.', error)
    }
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed((value) => !value), [])

  const itemClass = (active: boolean) =>
    [
      'flex w-full items-center border text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      active
        ? 'border-primary bg-primary text-on-primary'
        : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:text-primary',
    ].join(' ')

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-outline-variant bg-background transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center border-b border-outline-variant ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'}`}>
        <a
          href="/"
          className="flex h-8 w-8 shrink-0 items-center justify-center border border-outline-variant transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="CodeLab — página inicial"
        >
          <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            terminal
          </span>
        </a>
        {!collapsed && <span className="font-serif text-xl font-normal tracking-tight text-primary">CodeLab</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação principal">
        {items.map((item) => {
          const active = item.key === activeKey
          const content = (
            <>
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                {item.icon}
              </span>
              {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
            </>
          )

          return item.href ? (
            <a key={item.key} href={item.href} className={itemClass(active)} aria-current={active ? 'page' : undefined} title={item.label}>
              {content}
            </a>
          ) : (
            <button key={item.key} type="button" onClick={item.onClick} className={itemClass(active)} title={item.label}>
              {content}
            </button>
          )
        })}
      </nav>

      <div className={`border-t border-outline-variant p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={onLogout}
          className={`btn-danger ${collapsed ? '' : 'w-full'}`}
          aria-label="Sair da conta"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className={`flex shrink-0 items-center border-t border-outline-variant text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
          collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'
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
  )
}
