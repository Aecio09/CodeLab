import { API_BASE_URL } from '../constants'

const TOKEN_KEY = 'codelab_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function performLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' })
  } catch {}
  clearToken()
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  })
  if (res.status === 401) {
    await performLogout()
  }
  return res
}

export async function apiLogin(
  email: string,
  password: string
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Credenciais inválidas')
  const data = (await res.json()) as { token: string }
  setToken(data.token)
  return data.token
}

export async function apiLogout(): Promise<void> {
  await performLogout()
}
