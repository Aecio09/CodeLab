import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { apiLogout } from '../lib/api'
import { resolvePhotoUrl } from '../utils'
import type { UserProfile } from '../types'
import { AppSidebar } from './AppSidebar'
import { AuthBackground } from './AuthBackground'
import { EditProfileModal } from './EditProfileModal'
import { PlaygroundCodeEditor } from './PlaygroundCodeEditor'
import { codelabSandpackTheme } from '../lib/sandpackTheme'
import { playgroundPrimaryButtonClass, playgroundSecondaryButtonClass } from '../lib/playground'

type PlaygroundAction = {
  label: string
  onClick: () => void
  icon?: string
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

type StatBadgeProps = {
  icon: string
  value: string | number
  accent: string
  label: string
}

function StatBadge({ icon, value, accent, label }: StatBadgeProps) {
  return (
    <div
      className="flex items-center gap-1.5 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1.5 sm:gap-2 sm:px-3"
      title={label}
    >
      <span
        className={`material-symbols-outlined text-[16px] ${accent}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="font-mono text-xs font-bold text-white">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

function formatElapsed(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
  const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
  const secs = (totalSeconds % 60).toString().padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

function RunCodeButton() {
  const { sandpack } = useSandpack()
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    try {
      await sandpack.runSandpack()
    } catch {
      // Os erros de execução aparecem no console do Sandpack.
    } finally {
      setRunning(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleRun()}
      disabled={running}
      className={`${playgroundSecondaryButtonClass} !h-8 !px-3 !text-[10px]`}
      aria-label={running ? 'Executando código' : 'Executar código'}
    >
      <span
        className={`material-symbols-outlined text-[15px] ${running ? 'animate-spin' : ''}`}
        aria-hidden="true"
      >
        {running ? 'progress_activity' : 'play_arrow'}
      </span>
      <span className="hidden sm:inline">{running ? 'Executando' : 'Executar'}</span>
    </button>
  )
}

function ProfileAvatar({ user }: { user: UserProfile }) {
  const [failed, setFailed] = useState(false)

  if (!user.photo || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
        <span className="material-symbols-outlined text-lg text-trail-muted">person</span>
      </span>
    )
  }

  return (
    <img
      alt=""
      className="h-full w-full object-cover"
      src={resolvePhotoUrl(user.photo, user.name)}
      onError={() => setFailed(true)}
    />
  )
}

function HeaderActionButton({
  action,
  variant,
}: {
  action: PlaygroundAction
  variant: 'primary' | 'secondary'
}) {
  const label = action.loading ? action.loadingLabel ?? action.label : action.label
  const icon = action.loading ? 'progress_activity' : action.icon
  const hideLabel = variant === 'secondary' && Boolean(icon)

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={variant === 'primary' ? playgroundPrimaryButtonClass : playgroundSecondaryButtonClass}
      aria-label={label}
      aria-busy={action.loading || undefined}
      title={label}
    >
      {icon ? (
        <span
          className={`material-symbols-outlined text-[16px] ${action.loading ? 'animate-spin' : ''}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className={hideLabel ? 'hidden lg:inline' : ''}>{label}</span>
    </button>
  )
}

export type PlaygroundShellProps = {
  user: UserProfile
  onUserChange: (updated: UserProfile) => void
  code: string
  onCodeChange: (value: string) => void
  loadingEditor?: boolean
  eyebrow: string
  title: string
  challenge: ReactNode
  difficulty?: ReactNode
  aside?: ReactNode
  editorStatus?: ReactNode
  primaryAction?: PlaygroundAction
  secondaryAction?: PlaygroundAction
  consoleLabel?: string
  previewLabel?: string
  showPreview?: boolean
  showTimer?: boolean
  showRunButton?: boolean
}

export function PlaygroundShell({
  user,
  onUserChange,
  code,
  onCodeChange,
  loadingEditor = false,
  eyebrow,
  title,
  challenge,
  difficulty,
  aside,
  editorStatus,
  primaryAction,
  secondaryAction,
  consoleLabel = 'Console',
  previewLabel = 'Preview',
  showPreview = false,
  showTimer = true,
  showRunButton = true,
}: PlaygroundShellProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!showTimer) return

    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [showTimer])

  const roleLabel = user.role === 'ADMIN' ? 'Administrador' : 'Estudante'
  const challengeTitle = typeof challenge === 'string' ? challenge : undefined

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-trail-background font-sans text-[#e5e1e4] antialiased selection:bg-white selection:text-black">
      <AuthBackground />

      <AppSidebar
        items={[
          { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
          { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
          {
            key: 'perfil',
            label: 'Meu Perfil',
            icon: 'account_circle',
            onClick: () => setIsProfileModalOpen(true),
          },
          { key: 'redes', label: 'Trilha de Redes', icon: 'lan', href: '/trilha/redes' },
        ]}
        activeKey="playground"
        onLogout={() => {
          void apiLogout()
        }}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="relative ml-0 flex h-screen min-w-0 flex-1 flex-col transition-[margin-left] duration-200 md:ml-[var(--sidebar-w)]">
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b-[0.5px] border-trail-line bg-trail-background/60 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.04] text-neutral-400 transition-colors hover:border-trail-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileNavOpen}
              aria-controls="app-sidebar"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                {eyebrow}
              </p>
              <p className="truncate font-serif text-lg text-white">{title}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 xl:flex">
              <StatBadge
                icon="local_fire_department"
                accent="text-amber-400"
                value={user.userStreak}
                label={`${user.userStreak} dias de sequência`}
              />
              <StatBadge
                icon="stars"
                accent="text-trail-cyan"
                value={Math.floor(user.userPoints).toLocaleString('pt-BR')}
                label={`${Math.floor(user.userPoints)} pontos acumulados`}
              />
            </div>

            {showTimer ? (
              <div
                className="hidden items-center gap-1.5 text-trail-muted lg:flex"
                title="Tempo de sessão"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  schedule
                </span>
                <span className="font-mono text-xs tabular-nums">{formatElapsed(seconds)}</span>
              </div>
            ) : null}

            {secondaryAction ? <HeaderActionButton action={secondaryAction} variant="secondary" /> : null}
            {primaryAction ? <HeaderActionButton action={primaryAction} variant="primary" /> : null}

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 rounded border-0 pl-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-l-[0.5px] sm:border-trail-line sm:pl-3"
              aria-label="Abrir meu perfil"
              title={`${user.name} (${user.email})`}
            >
              <div className="hidden text-right sm:block">
                <div className="max-w-[120px] truncate text-xs font-medium text-white">{user.name}</div>
                <div className="font-mono text-[10px] text-trail-muted">{roleLabel}</div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border-[0.5px] border-trail-line bg-white/[0.04]">
                <ProfileAvatar key={user.photo ?? 'no-photo'} user={user} />
              </div>
            </button>
          </div>
        </header>

        <SandpackProvider
          template="vanilla-ts"
          theme={codelabSandpackTheme}
          files={{ '/index.ts': code }}
          options={{
            autorun: true,
            recompileMode: 'immediate',
            recompileDelay: 300,
          }}
          customSetup={{ entry: '/index.ts' }}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:flex-row lg:overflow-hidden">
            <section className="flex min-h-[340px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)] lg:min-h-0">
              <div className="flex shrink-0 flex-col gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="material-symbols-outlined shrink-0 text-[16px] text-trail-muted"
                    aria-hidden="true"
                  >
                    code
                  </span>
                  <div
                    className="line-clamp-2 min-w-0 text-xs leading-relaxed text-neutral-300"
                    title={challengeTitle}
                  >
                    {challenge}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {difficulty}
                  {editorStatus}
                  {showRunButton ? <RunCodeButton /> : null}
                </div>
              </div>

              <div className="relative min-h-0 flex-1 bg-[#151515]">
                <div className="absolute inset-0">
                  <SandpackLayout
                    style={{ height: '100%' }}
                    className="!h-full !max-h-full !border-0 !bg-transparent"
                  >
                    <PlaygroundCodeEditor loading={loadingEditor} onCodeChange={onCodeChange} />
                  </SandpackLayout>
                </div>
              </div>
            </section>

            <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80 lg:min-h-0 lg:overflow-y-auto">
              {showPreview ? (
                <section className="flex h-40 shrink-0 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95">
                  <div className="flex shrink-0 items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
                    <span
                      className="material-symbols-outlined text-[16px] text-trail-muted"
                      aria-hidden="true"
                    >
                      preview
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                      {previewLabel}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden bg-white">
                    <SandpackPreview
                      className="!h-full"
                      showOpenInCodeSandbox={false}
                      showRefreshButton={false}
                      showNavigator={false}
                    />
                  </div>
                </section>
              ) : null}

              <section className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95">
                <div className="flex shrink-0 items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
                  <span
                    className="material-symbols-outlined text-[16px] text-trail-muted"
                    aria-hidden="true"
                  >
                    terminal
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                    {consoleLabel}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto bg-[#151515] p-4 font-mono text-xs leading-relaxed">
                  <SandpackConsole resetOnPreviewRestart />
                </div>
              </section>

              {/*
                O SandpackPreview precisa estar montado para criar o iframe
                do bundler, que é quem executa o código e emite os logs
                exibidos no SandpackConsole. Escondido com display:none
                (não `hidden`, que faria o React não renderizar a árvore).
              */}
              {!showPreview ? (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    showNavigator={false}
                  />
                </div>
              ) : null}

              {aside}
            </div>
          </div>
        </SandpackProvider>
      </main>

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={onUserChange}
      />
    </div>
  )
}

export function PlaygroundLoading({ label }: { label: string }) {
  return (
    <div
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-trail-background font-mono text-sm text-trail-muted"
      role="status"
      aria-live="polite"
    >
      <AuthBackground />
      <div className="relative z-10 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-trail-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)] motion-safe:animate-pulse"
          aria-hidden="true"
        />
        {label}
      </div>
    </div>
  )
}
