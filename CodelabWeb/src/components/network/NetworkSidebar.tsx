import { AreaSwitch } from './AreaSwitch'
import { resolvePhotoUrl } from '../../utils'
import type { UserProfile } from '../../types'

type Props = {
  user: UserProfile
  active: 'trail' | 'lab'
  onProfile: () => void
  onLogout: () => void
}

export function NetworkSidebar({ user, active, onProfile, onLogout }: Props) {
  return (
    <aside className="fixed left-0 top-0 z-[60] flex h-full w-64 flex-col border-r border-outline-variant bg-surface-container-low px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
          <span className="material-symbols-outlined text-on-primary">lan</span>
        </div>
        <div>
          <h1 className="font-h2 text-lg font-bold tracking-tight text-primary">CodeLab</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
            Redes
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Navegação de redes">
        <a
          href="/trilha/redes"
          aria-current={active === 'trail' ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-semibold transition-all ${
            active === 'trail'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined">map</span>
          Trilha de Redes
        </a>
        <button
          type="button"
          onClick={onProfile}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
        >
          <span className="material-symbols-outlined">account_circle</span>
          Meu Perfil
        </button>
        <AreaSwitch area="network" />
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <img
            alt=""
            className="h-8 w-8 rounded-full border border-outline-variant object-cover"
            src={resolvePhotoUrl(user.photo, user.name)}
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-on-surface">{user.name}</p>
            <p className="truncate text-[10px] text-on-surface-variant">{user.email}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className="btn-danger !h-10 w-full">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
