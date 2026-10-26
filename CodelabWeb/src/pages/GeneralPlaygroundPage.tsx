import { useEffect, useState } from 'react'
import { API_BASE_URL, DEFAULT_PLAYGROUND_CODE } from '../constants'
import { authFetch } from '../lib/api'
import type { UserProfile } from '../types'
import { PlaygroundLoading, PlaygroundShell } from '../components/PlaygroundShell'

export function GeneralPlaygroundPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!meRes.ok) {
          window.location.href = '/'
          return
        }
        const me = await meRes.json()
        if (!cancelled) setUser(me)
      } catch {
        console.error('Falha ao carregar perfil.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !user) {
    return <PlaygroundLoading label="Inicializando playground..." />
  }

  return (
    <PlaygroundShell
      user={user}
      onUserChange={setUser}
      code={code}
      onCodeChange={setCode}
      eyebrow="Laboratório"
      title="Treinamento livre"
      challenge="Use este espaço para testar algoritmos, praticar sintaxe ou experimentar trechos em TypeScript."
      consoleLabel="Console"
    />
  )
}
