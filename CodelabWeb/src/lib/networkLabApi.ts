import { API_BASE_URL } from '../constants'
import { authFetch } from './api'
import type {
  CliResult,
  LabResult,
  NetworkTrailResponse,
  StartLabResponse,
} from '../types/network'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message = body
    try {
      const parsed = JSON.parse(body) as { message?: string }
      if (parsed.message) message = parsed.message
    } catch {
      // corpo não é JSON: mantém o texto puro
    }
    throw new ApiError(res.status, message || `falha em ${path} (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function getNetworkTrail(): Promise<NetworkTrailResponse> {
  return call<NetworkTrailResponse>('/api/network-trail')
}

export function startNetworkQuestion(questionId: number): Promise<StartLabResponse> {
  return call<StartLabResponse>(`/network-questions/${questionId}/start`, {
    method: 'POST',
  })
}

export function sendCliCommand(
  sessionId: string,
  deviceRef: string,
  line: string
): Promise<CliResult> {
  return call<CliResult>(`/api/sessions/${sessionId}/cli`, {
    method: 'POST',
    body: JSON.stringify({ deviceRef, line }),
  })
}

export function submitNetworkQuestion(
  questionId: number,
  sessionId: string
): Promise<LabResult> {
  return call<LabResult>(`/network-questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export function deleteSession(sessionId: string): Promise<void> {
  return call<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' })
}
