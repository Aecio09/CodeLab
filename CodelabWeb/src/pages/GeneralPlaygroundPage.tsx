import { useEffect, useState } from 'react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import { authFetch } from '../lib/api'
import type { UserProfile } from '../types'
import { PlaygroundShell } from '../components/PlaygroundShell'

export function GeneralPlaygroundPage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
    const [loading, setLoading] = useState(true)
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
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

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-background font-mono text-primary" role="status" aria-live="polite">
                Inicializando Playground...
            </div>
        )
    }

    return (
        <PlaygroundShell
            user={user}
            onUserChange={setUser}
            code={code}
            onCodeChange={setCode}
            eyebrow="Laboratório"
            title="Treinamento livre"
            elapsed={formatTime(seconds)}
            challenge="Use este espaço para testar algoritmos, praticar sintaxe ou experimentar trechos em TypeScript."
        />
    )
}
