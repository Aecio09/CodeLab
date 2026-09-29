import { useState } from 'react'
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
import { EditProfileModal } from './EditProfileModal'
import { PlaygroundCodeEditor } from './PlaygroundCodeEditor'
import { codelabSandpackTheme } from '../lib/sandpackTheme'

type StatBadgeProps = {
    icon: string
    value: string | number
    accent: string
    label: string
}

export function StatBadge({ icon, value, accent, label }: StatBadgeProps) {
    return (
        <div className="flex items-center gap-2 border border-outline-variant px-3 py-1.5">
            <span
                className={`material-symbols-outlined text-lg ${accent}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
            >
                {icon}
            </span>
            <span className="font-mono text-sm text-primary">{value}</span>
            <span className="sr-only">{label}</span>
        </div>
    )
}

function RunCodeButton({ className = '' }: { className?: string }) {
    const { sandpack } = useSandpack()
    const [running, setRunning] = useState(false)

    const handleRun = async () => {
        setRunning(true)
        try {
            await sandpack.runSandpack()
        } finally {
            setRunning(false)
        }
    }

    return (
        <button type="button" onClick={handleRun} disabled={running} className={`btn-secondary ${className}`}>
            <span className="material-symbols-outlined text-base" aria-hidden="true">play_arrow</span>
            {running ? 'Executando' : 'Executar'}
        </button>
    )
}

function ProfileAvatar({ user }: { user: UserProfile }) {
    const [failed, setFailed] = useState(false)

    if (!user.photo || failed) {
        return (
            <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
                <span className="material-symbols-outlined text-lg text-outline">person</span>
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

type PlaygroundShellProps = {
    user: UserProfile
    onUserChange: (updated: UserProfile) => void
    code: string
    onCodeChange: (value: string) => void
    loadingEditor?: boolean
    eyebrow: string
    title: string
    elapsed: string
    challenge: ReactNode
    difficulty?: ReactNode
    aside?: ReactNode
    editorStatus?: ReactNode
    primaryAction?: ReactNode
}

export function PlaygroundShell({
                                  user,
                                  onUserChange,
                                  code,
                                  onCodeChange,
                                  loadingEditor = false,
                                  eyebrow,
                                  title,
                                  elapsed,
                                  challenge,
                                  difficulty,
                                  aside,
                                  editorStatus,
                                  primaryAction,
                              }: PlaygroundShellProps) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-on-surface">
            <AppSidebar
                items={[
                    { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
                    { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
                    { key: 'perfil', label: 'Meu Perfil', icon: 'account_circle', onClick: () => setIsProfileModalOpen(true) },
                ]}
                activeKey="playground"
                onLogout={() => { apiLogout() }}
            />

            <main className="ml-[var(--sidebar-w)] flex h-screen min-w-0 flex-1 flex-col">
                <header className="flex h-16 shrink-0 items-center justify-between gap-6 border-b border-outline-variant px-8">
                    <div className="min-w-0">
                        <p className="truncate font-mono text-xs uppercase tracking-widest text-on-surface-variant">{eyebrow}</p>
                        <p className="truncate font-serif text-lg text-primary">{title}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                        <div className="flex items-center gap-3">
                            <StatBadge icon="local_fire_department" accent="text-orange-500" value={user.userStreak} label="dias de sequência" />
                            <StatBadge icon="stars" accent="text-yellow-500" value={Math.floor(user.userPoints)} label="pontos acumulados" />
                        </div>

                        <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-lg" aria-hidden="true">schedule</span>
                            <span className="font-mono text-sm tabular-nums">{elapsed}</span>
                        </div>

                        {primaryAction}

                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="h-10 w-10 shrink-0 overflow-hidden border border-outline-variant transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            <span className="sr-only">Abrir meu perfil</span>
                            <ProfileAvatar user={user} />
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
                    <div className="flex min-h-0 flex-1 gap-6 overflow-hidden p-6">
                        <section className="flex min-h-0 min-w-0 flex-1 flex-col border border-outline-variant">
                            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-4 py-2.5">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">code</span>
                                    <div className="min-w-0 truncate text-xs leading-relaxed text-on-surface">
                                        {challenge}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    {difficulty}
                                    {editorStatus}
                                    <RunCodeButton className="!h-8 !px-3 !text-[11px]" />
                                </div>
                            </div>

                            <div className="relative min-h-0 flex-1 bg-background">
                                <div className="absolute inset-0">
                                    <SandpackLayout
                                        style={{ height: '100%' }}
                                        className="!h-full !max-h-full !border-0"
                                    >
                                        <PlaygroundCodeEditor loading={loadingEditor} onCodeChange={onCodeChange} />
                                    </SandpackLayout>
                                </div>
                            </div>
                        </section>

                        <div className="flex w-80 shrink-0 flex-col gap-4">
                            <section className="flex min-h-0 flex-1 flex-col border border-outline-variant bg-surface-container-low">
                                <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-4 py-2.5">
                                    <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">terminal</span>
                                    <span className="font-mono text-xs text-on-surface-variant">Console</span>
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                                    <SandpackConsole resetOnPreviewRestart />
                                </div>
                            </section>

                            {/*
                              O SandpackPreview precisa estar montado para criar o iframe
                              do bundler, que é quem executa o código e emite os logs
                              exibidos no SandpackConsole. Escondido com display:none
                              (não `hidden`, que faria o React não renderizar a árvore).
                            */}
                            <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
                                <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} showNavigator={false} />
                            </div>

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
