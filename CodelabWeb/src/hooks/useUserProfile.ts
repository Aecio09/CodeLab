import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { authFetch } from '../lib/api'
import type { UserProfile } from '../types'

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!res.ok) throw new Error('Não autenticado')
        const data = (await res.json()) as UserProfile
        if (!cancelled) setUser(data)
      } catch {
        if (!cancelled) window.location.href = '/'
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { user, setUser, loading }
}
