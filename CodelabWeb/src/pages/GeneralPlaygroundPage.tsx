import { useEffect, useState } from 'react'
import {
    SandpackConsole,
    SandpackLayout,
    SandpackProvider,
    SandpackPreview,
} from '@codesandbox/sandpack-react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import type { UserProfile } from '../types'
import { PlaygroundCodeEditor } from '../components/PlaygroundCodeEditor'
import { EditProfileModal } from '../components/EditProfileModal'

const mintDarkTheme = {
    colors: {
        surface: "#050a07",
        clickable: "#bdcabe",
        base: "#dde4df",
        disabled: "#889489",
        hover: "#1a211e",
        accent: "#72db9f",
        error: "#ffb4ab",
        errorSurface: "#93000a",
    },
    syntax: {
        plain: "#dde4df",
        comment: "#889489",
        keyword: "#72db9f",
        tag: "#8ef8b9",
        punctuation: "#bdcabe",
        definition: "#bbcac1",
        property: "#72db9f",
        static: "#ffb3b5",
        string: "#37a36c",
    },
    font: {
        body: '"Manrope", system-ui, sans-serif',
        mono: '"Fira Code", "JetBrains Mono", monospace',
        size: "14px",
        lineHeight: "1.6",
    },
}

export function GeneralPlaygroundPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
    const [loading, setLoading] = useState(true)
    const [seconds, setSeconds] = useState(0)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const meRes = await fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
                if (!meRes.ok) { window.location.href = '/'; return; }
                const me = await meRes.json()
                if (!cancelled) setUser(me)
            } catch {
                console.error('Falha ao carregar perfil.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void load()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
        const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
        const secs = (totalSeconds % 60).toString().padStart(2, '0')
        return `${hrs}:${mins}:${secs}`
    }

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
        } finally {
            window.location.href = '/'
        }
    }

    if (loading || !user) {
        return <div className="h-screen bg-background flex items-center justify-center text-primary animate-pulse font-mono" role="status" aria-live="polite">Inicializando Playground...</div>
    }

    return (
        <div className="flex h-screen w-full bg-background text-on-surface font-sans overflow-hidden">

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 border-r border-outline-variant bg-surface-container-low w-64 z-50 shrink-0">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-on-primary">terminal</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</h1>
                    </div>
                </div>
                <nav className="flex-1 space-y-1" aria-label="Navegação principal">
                    <a
                        href="/trilha"
                        className="w-full flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest rounded-lg text-left font-semibold text-sm transition-all"
                    >
                        <span className="material-symbols-outlined">map</span>
                        Minha Trilha
                    </a>
                    <a
                        href="/playground"
                        className="w-full flex items-center gap-3 bg-secondary-container text-on-secondary-container rounded-lg px-4 py-2 text-left font-semibold text-sm"
                        aria-current="page"
                    >
                        <span className="material-symbols-outlined text-primary">terminal</span>
                        Playground
                    </a>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="w-full flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest rounded-lg text-left font-semibold text-sm transition-all"
                    >
                        <span className="material-symbols-outlined">account_circle</span>
                        Meu Perfil
                    </button>
                </nav>
                <div className="mt-auto pt-4 border-t border-outline-variant">
                    <button
                        onClick={handleLogout}
                        className="btn-danger w-full !h-10"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">

                {/* Header */}
                <header className="shrink-0 w-full flex justify-between items-center h-16 px-8 bg-background/80 backdrop-blur-md border-b border-outline-variant z-[60]">
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block">
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-80">Sandbox Mode</p>
                            <h2 className="text-sm font-black text-on-surface italic">
                                Treinamento Livre
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant shadow-inner">
                                <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                <span className="text-md font-black text-on-surface">{user.userStreak}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant shadow-inner">
                                <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                <span className="text-md font-black text-on-surface">{Math.floor(user.userPoints)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                                <span className="material-symbols-outlined text-[20px]">schedule</span>
                                <span className="font-mono text-sm">{formatTime(seconds)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    const iframe = document.querySelector('iframe');
                                    if (iframe) iframe.src = iframe.src;
                                }}
                                className="btn-secondary !h-9 !px-md !text-[11px]"
                            >
                                Executar
                            </button>
                        </div>
                    </div>
                </header>

                {/* Sandpack Arena */}
                <SandpackProvider
                    template="vanilla-ts"
                    theme={mintDarkTheme}
                    files={{ '/index.ts': code }}
                    options={{
                        autorun: true,
                        recompileMode: 'immediate',
                        recompileDelay: 300
                    }}
                    customSetup={{ entry: '/index.ts' }}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        backgroundColor: '#050a07',
                    }}
                >
                    {/* Briefing */}
                    <div className="shrink-0 px-8 py-4 bg-surface-container-high border-b border-outline-variant flex items-start justify-between gap-8">
                        <div className="flex-1">
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Laboratório</p>
                            <p className="text-sm text-on-surface leading-relaxed font-medium">
                                Utilize este espaço para testar algoritmos, praticar sintaxe ou realizar experimentos em TypeScript.
                            </p>
                        </div>
                    </div>

                    {/* Editor + Terminal lado a lado */}
                    <div className="flex-1 min-h-0 flex overflow-hidden p-6 gap-6">

                        {/* Editor */}
                        <div className="flex-1 min-w-0 min-h-0 bg-[#050a07] rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-2xl">
                            <div className="shrink-0 px-4 py-2 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">javascript</span>
                                    <span className="text-[10px] font-bold text-on-surface-variant">Editor</span>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 relative">
                                <div className="absolute inset-0">
                                    <SandpackLayout
                                        style={{ height: '100%', background: '#050a07' }}
                                        className="!border-0 !h-full !max-h-full"
                                    >
                                        <PlaygroundCodeEditor loading={false} onCodeChange={setCode} />
                                    </SandpackLayout>
                                </div>
                            </div>
                        </div>

                        {/* Coluna direita: Terminal */}
                        <div className="w-80 shrink-0 min-h-0 flex flex-col gap-4">
                            <div className="flex-1 min-h-0 bg-[#050a07] rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-xl">
                                <div className="shrink-0 px-4 py-2 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
                                        <span className="text-[10px] font-bold text-on-surface-variant">Console</span>
                                    </div>
                                    <div className="hidden">
                                        <SandpackPreview />
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 p-4 font-mono text-xs overflow-auto terminal-scroll">
                                    <SandpackConsole resetOnPreviewRestart />
                                </div>
                            </div>
                        </div>
                    </div>
                </SandpackProvider>
            </main>

            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
                onUpdate={(updated) => setUser(updated)}
            />
        </div>
    )
}