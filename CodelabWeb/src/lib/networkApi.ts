import { API_BASE_URL } from '../constants'
import { authFetch } from '../lib/api'
import type {
  CliResult,
  DeviceModelInfo,
  DeviceState,
  NetDevice,
  NetLink,
  NetSnapshot,
} from '../types/network'

const LAB_KEY = 'codelab_network_exercise'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `falha em ${path} (${res.status})`)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export function readLabId(): string | null {
  return localStorage.getItem(LAB_KEY)
}

export function writeLabId(id: string): void {
  localStorage.setItem(LAB_KEY, id)
}

export function listDeviceModels(): Promise<DeviceModelInfo[]> {
  return call<DeviceModelInfo[]>('/api/exercises/device-models')
}

export async function openLab(): Promise<{ exerciseId: string; sessionId: string }> {
  const exerciseId = readLabId()
  if (exerciseId) {
    const existing = await fetch(`${API_BASE_URL}/api/exercises/${exerciseId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('codelab_token') ?? ''}` },
    })
    if (existing.ok) {
      const snap = (await existing.json()) as NetSnapshot
      const session = await call<{ sessionId: string }>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ exerciseId: snap.exerciseId }),
      })
      return { exerciseId: snap.exerciseId, sessionId: session.sessionId }
    }
    localStorage.removeItem(LAB_KEY)
  }

  const created = await call<NetSnapshot>('/api/exercises', {
    method: 'POST',
    body: JSON.stringify({ name: 'Meu Playground de Redes' }),
  })
  writeLabId(created.exerciseId)
  const session = await call<{ sessionId: string }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ exerciseId: created.exerciseId }),
  })
  return { exerciseId: created.exerciseId, sessionId: session.sessionId }
}

export function getSnapshot(sessionId: string): Promise<NetSnapshot> {
  return call<NetSnapshot>(`/api/sessions/${sessionId}/snapshot`)
}

export function addDevice(
  sessionId: string,
  body: { kind: string; x: number; y: number; hostname?: string; ports?: number }
): Promise<NetDevice> {
  return call<NetDevice>(`/api/sessions/${sessionId}/devices`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function removeDevice(sessionId: string, ref: string): Promise<void> {
  return call<void>(`/api/sessions/${sessionId}/devices/${ref}`, { method: 'DELETE' })
}

export function addLink(
  sessionId: string,
  body: { deviceRefA: string; interfaceA: string; deviceRefB: string; interfaceB: string }
): Promise<NetLink> {
  return call<NetLink>(`/api/sessions/${sessionId}/links`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setLinkStatus(
  sessionId: string,
  index: number,
  status: 'UP' | 'DOWN'
): Promise<NetLink> {
  return call<NetLink>(`/api/sessions/${sessionId}/links/${index}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function removeLink(sessionId: string, index: number): Promise<void> {
  return call<void>(`/api/sessions/${sessionId}/links/${index}`, { method: 'DELETE' })
}

export function runCli(sessionId: string, deviceRef: string, line: string): Promise<CliResult> {
  return call<CliResult>(`/api/sessions/${sessionId}/cli`, {
    method: 'POST',
    body: JSON.stringify({ deviceRef, line }),
  })
}

export function getDeviceState(sessionId: string, ref: string): Promise<DeviceState> {
  return call<DeviceState>(`/api/sessions/${sessionId}/devices/${ref}/state`)
}

export function saveLab(sessionId: string): Promise<NetSnapshot> {
  return call<NetSnapshot>(`/api/sessions/${sessionId}/save`, { method: 'POST' })
}

/**
 * A posicao do device no canvas mora no snapshot do exercicio, e a sessao so
 * a materializa no save. Como a API de sessao nao grava x/y, persistimos
 * direto no exercicio preservando o resto do estado vivo.
 */
export async function persistPosition(
  exerciseId: string,
  sessionId: string,
  ref: string,
  x: number,
  y: number
): Promise<NetSnapshot> {
  const snap = await getSnapshot(sessionId)
  snap.devices = snap.devices.map((d) => (d.ref === ref ? { ...d, x, y } : d))
  return call<NetSnapshot>(`/api/exercises/${exerciseId}`, {
    method: 'PUT',
    body: JSON.stringify(snap),
  })
}
