import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { apiLogout, authFetch } from '../lib/api'
import * as net from '../lib/networkApi'
import { resolvePhotoUrl } from '../utils'
import type { UserProfile } from '../types'
import type {
  CliResult,
  DeviceState,
  NetDevice,
  NetLink,
  TraceEvent,
} from '../types/network'
import { AppSidebar } from '../components/AppSidebar'
import { AuthBackground } from '../components/AuthBackground'
import { EditProfileModal } from '../components/EditProfileModal'
import { NetworkCanvas } from '../components/network/NetworkCanvas'
import { linkKey } from '../components/network/geometry'
import { PlaygroundLoading } from '../components/PlaygroundShell'
import {
  playgroundDangerButtonClass,
  playgroundPrimaryButtonClass,
  playgroundSecondaryButtonClass,
} from '../lib/playground'

const KIND_ICONS: { kind: string; icon: string; label: string; desc: string }[] = [
  { kind: 'HOST', icon: 'computer', label: 'Host', desc: 'Estação com 1 porta' },
  { kind: 'SWITCH', icon: 'switch_video', label: 'Switch', desc: '24 portas, VLAN e MAC' },
  { kind: 'ROUTER', icon: 'router', label: 'Roteador', desc: '4 portas, rotas e ARP' },
  { kind: 'FIREWALL', icon: 'shield', label: 'Firewall', desc: '4 portas' },
]

type Tab = 'terminal' | 'tabelas'
type TerminalLine = { id: number; prompt: string; text: string; kind: 'in' | 'out' | 'err' | 'event' }
type Toast = { id: number; text: string; tone: 'ok' | 'erro' }

export function NetworkPlaygroundPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fatal, setFatal] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [devices, setDevices] = useState<NetDevice[]>([])
  const [links, setLinks] = useState<NetLink[]>([])

  const [selectedRef, setSelectedRef] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<number | null>(null)
  const [pendingPort, setPendingPort] = useState<{ ref: string; name: string } | null>(null)
  const [activeLink, setActiveLink] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('terminal')
  const [state, setState] = useState<{ ref: string; data: DeviceState } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [busy, setBusy] = useState(false)

  const [history, setHistory] = useState<Record<string, TerminalLine[]>>({})
  const [input, setInput] = useState('')
  const [prompt, setPrompt] = useState('>')
  const lineId = useRef(0)
  const animationTimers = useRef<number[]>([])

  const selected = devices.find((d) => d.ref === selectedRef) ?? null

  const notify = useCallback((text: string, tone: 'ok' | 'erro' = 'ok') => {
    const id = ++lineId.current
    setToasts((t) => [...t, { id, text, tone }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const pushLine = useCallback((ref: string, line: Omit<TerminalLine, 'id'>) => {
    setHistory((h) => ({
      ...h,
      [ref]: [...(h[ref] ?? []), { ...line, id: ++lineId.current }],
    }))
  }, [])

  const refresh = useCallback(async () => {
    if (!sessionId) return
    const snap = await net.getSnapshot(sessionId)
    setDevices(snap.devices)
    setLinks(snap.links)
  }, [sessionId])

  // Boot: perfil, depois laboratório e sessão.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const meRes = await authFetch(`${API_BASE_URL}/api/users/me`)
        if (!meRes.ok) {
          window.location.href = '/'
          return
        }
        const me = (await meRes.json()) as UserProfile
        if (cancelled) return
        setUser(me)

        const lab = await net.openLab()
        if (cancelled) return
        setExerciseId(lab.exerciseId)
        setSessionId(lab.sessionId)
        const snap = await net.getSnapshot(lab.sessionId)
        if (cancelled) return
        setDevices(snap.devices)
        setLinks(snap.links)
        if (snap.devices.length > 0) setSelectedRef(snap.devices[0].ref)
      } catch (err) {
        if (!cancelled) setFatal(err instanceof Error ? err.message : 'falha ao abrir o laboratório')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Limpa animações de pacotes ao sair.
  useEffect(() => () => animationTimers.current.forEach(clearTimeout), [])

  const refreshState = useCallback(async () => {
    if (!sessionId || !selectedRef) return
    try {
      const data = await net.getDeviceState(sessionId, selectedRef)
      setState({ ref: selectedRef, data })
    } catch {
      /* estado indisponível: mantém a última leitura */
    }
  }, [sessionId, selectedRef])

  // Carrega o estado do dispositivo selecionado sem setState síncrono no efeito.
  useEffect(() => {
    if (!sessionId || !selectedRef) return
    let cancelled = false
    net
      .getDeviceState(sessionId, selectedRef)
      .then((data) => {
        if (!cancelled) setState({ ref: selectedRef, data })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [sessionId, selectedRef])

  const linkedPorts = useMemo(() => {
    const set = new Set<string>()
    for (const l of links) {
      set.add(`${l.deviceRefA}|${l.interfaceA}`)
      set.add(`${l.deviceRefB}|${l.interfaceB}`)
    }
    return set
  }, [links])

  // ── Topologia ───────────────────────────────────────────────────────────

  async function handleAddDevice(kind: string) {
    if (!sessionId) return
    setBusy(true)
    try {
      const count = devices.filter((d) => d.kind === kind).length + 1
      const prefix = kind === 'HOST' ? 'PC' : kind === 'SWITCH' ? 'SW' : kind === 'ROUTER' ? 'R' : 'FW'
      const created = await net.addDevice(sessionId, {
        kind,
        x: 60 + (devices.length % 4) * 220,
        y: 60 + Math.floor(devices.length / 4) * 190,
        hostname: `${prefix}${count}`,
      })
      setDevices((d) => [...d, created])
      setSelectedRef(created.ref)
      if (exerciseId) {
        await net.persistPosition(exerciseId, sessionId, created.ref, created.x, created.y)
      }
      notify(`${created.hostname} adicionado`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'falha ao adicionar', 'erro')
    } finally {
      setBusy(false)
    }
  }

  async function handlePortClick(ref: string, name: string) {
    if (!sessionId) return
    if (!pendingPort) {
      setPendingPort({ ref, name })
      notify(`Porta ${name} selecionada — clique na porta do outro dispositivo`)
      return
    }
    if (pendingPort.ref === ref && pendingPort.name === name) {
      setPendingPort(null)
      return
    }
    setBusy(true)
    try {
      const created = await net.addLink(sessionId, {
        deviceRefA: pendingPort.ref,
        interfaceA: pendingPort.name,
        deviceRefB: ref,
        interfaceB: name,
      })
      setLinks((l) => [...l, created])
      setPendingPort(null)
      setSelectedLink(links.length)
      notify('Cabo conectado')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'não foi possível conectar', 'erro')
      setPendingPort(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleLink(index: number) {
    if (!sessionId || !links[index]) return
    const link = links[index]
    const next = link.status === 'UP' ? 'DOWN' : 'UP'
    setBusy(true)
    try {
      await net.setLinkStatus(sessionId, index, next)
      setLinks((l) => l.map((x, i) => (i === index ? { ...x, status: next } : x)))
      notify(next === 'DOWN' ? 'Cabo cortado' : 'Cabo religado')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'falha', 'erro')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteLink(index: number) {
    if (!sessionId) return
    setBusy(true)
    try {
      await net.removeLink(sessionId, index)
      setLinks((l) => l.filter((_, i) => i !== index))
      setSelectedLink(null)
      notify('Cabo removido')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'falha', 'erro')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteDevice() {
    if (!sessionId || !selected) return
    setBusy(true)
    try {
      await net.removeDevice(sessionId, selected.ref)
      setDevices((d) => d.filter((x) => x.ref !== selected.ref))
      setLinks((l) =>
        l.filter((x) => x.deviceRefA !== selected.ref && x.deviceRefB !== selected.ref)
      )
      setSelectedRef(null)
      notify(`${selected.hostname} removido`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'falha', 'erro')
    } finally {
      setBusy(false)
    }
  }

  function handleMoveDevice(ref: string, x: number, y: number) {
    setDevices((d) => d.map((dev) => (dev.ref === ref ? { ...dev, x, y } : dev)))
  }

  async function handleMoveCommit() {
    if (!exerciseId || !sessionId || !selected) return
    try {
      await net.persistPosition(exerciseId, sessionId, selected.ref, selected.x, selected.y)
    } catch {
      notify('não foi possível salvar a posição', 'erro')
    }
  }

  // ── Simulação ───────────────────────────────────────────────────────────

  function animate(events: TraceEvent[]) {
    animationTimers.current.forEach(clearTimeout)
    animationTimers.current = []
    events.forEach((ev, i) => {
      if (!ev.fromDeviceRef || !ev.toDeviceRef || !ev.fromInterface || !ev.toInterface) return
      const key = linkKey(ev.fromDeviceRef, ev.fromInterface, ev.toDeviceRef, ev.toInterface)
      const timer = window.setTimeout(() => {
        setActiveLink(key)
        animationTimers.current.push(
          window.setTimeout(() => setActiveLink((cur) => (cur === key ? null : cur)), 320)
        )
      }, i * 260)
      animationTimers.current.push(timer)
    })
  }

  async function runCommand(line: string) {
    if (!sessionId || !selected) return
    const ref = selected.ref
    pushLine(ref, { prompt: '', text: line, kind: 'in' })
    try {
      const res: CliResult = await net.runCli(sessionId, ref, line)
      setPrompt(res.prompt)
      pushLine(ref, { prompt: '', text: res.output, kind: 'out' })
      for (const ev of res.events) {
        pushLine(ref, { prompt: '', text: ev.summary, kind: 'event' })
      }
      animate(res.events)
      await refresh()
      await refreshState()
    } catch (err) {
      pushLine(ref, {
        prompt: '',
        text: err instanceof Error ? err.message : 'erro',
        kind: 'err',
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const line = input.trim()
    if (!line) return
    setInput('')
    void runCommand(line)
  }

  async function handleSave() {
    if (!sessionId) return
    setBusy(true)
    try {
      await net.saveLab(sessionId)
      notify('Laboratório salvo')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'falha ao salvar', 'erro')
    } finally {
      setBusy(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return <PlaygroundLoading label="Montando seu playground de redes..." />
  }

  if (fatal) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-trail-background px-6">
        <AuthBackground />
        <div className="relative z-10 w-full max-w-md rounded-lg border-[0.5px] border-red-500/20 bg-trail-surface/95 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          <span className="material-symbols-outlined text-[44px] text-red-300" aria-hidden="true">
            error
          </span>
          <h1 className="mt-3 font-serif text-2xl text-white">Não foi possível abrir o laboratório</h1>
          <p className="mt-2 text-sm leading-relaxed text-trail-muted">{fatal}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={playgroundPrimaryButtonClass}
            >
              Tentar de novo
            </button>
            <a href="/trilha/redes" className={playgroundSecondaryButtonClass}>
              Voltar à trilha
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <PlaygroundLoading label="Carregando seu perfil..." />
  }

  const lines = selectedRef ? (history[selectedRef] ?? []) : []
  const selectedLinkData = selectedLink !== null ? links[selectedLink] : null
  const deviceState = state && state.ref === selectedRef ? state.data : null
  const roleLabel = user.role === 'ADMIN' ? 'Administrador' : 'Estudante'

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-trail-background font-sans text-[#e5e1e4] antialiased selection:bg-white selection:text-black">
      <AuthBackground />

      <AppSidebar
        items={[
          { key: 'trilha', label: 'Minha Trilha', icon: 'map', href: '/trilha' },
          { key: 'playground', label: 'Playground', icon: 'terminal', href: '/playground' },
          {
            key: 'net-playground',
            label: 'Playground de Redes',
            icon: 'lan',
            href: '/networkplayground',
          },
          {
            key: 'perfil',
            label: 'Meu Perfil',
            icon: 'account_circle',
            onClick: () => setIsProfileOpen(true),
          },
          { key: 'redes', label: 'Trilha de Redes', icon: 'route', href: '/trilha/redes' },
        ]}
        activeKey="net-playground"
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
                Playground de redes
              </p>
              <p className="truncate font-serif text-lg text-white">Topologia livre</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 xl:flex">
              <div
                className="flex items-center gap-1.5 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1.5 sm:gap-2 sm:px-3"
                title={`${user.userStreak} dias de sequência`}
              >
                <span
                  className="material-symbols-outlined text-[16px] text-amber-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  local_fire_department
                </span>
                <span className="font-mono text-xs font-bold text-white">{user.userStreak}</span>
                <span className="sr-only">{user.userStreak} dias de sequência</span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded border-[0.5px] border-trail-line bg-white/[0.04] px-2.5 py-1.5 sm:gap-2 sm:px-3"
                title={`${Math.floor(user.userPoints)} pontos acumulados`}
              >
                <span
                  className="material-symbols-outlined text-[16px] text-trail-cyan"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  stars
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {Math.floor(user.userPoints).toLocaleString('pt-BR')}
                </span>
                <span className="sr-only">{Math.floor(user.userPoints)} pontos acumulados</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy || !sessionId}
              className={`${playgroundSecondaryButtonClass} !h-9`}
              aria-label="Salvar laboratório"
              title="Salvar laboratório"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                save
              </span>
              <span className="hidden sm:inline">Salvar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 rounded border-0 pl-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-l-[0.5px] sm:border-trail-line sm:pl-3"
              aria-label="Abrir meu perfil"
              title={`${user.name} (${user.email})`}
            >
              <div className="hidden text-right sm:block">
                <div className="max-w-[120px] truncate text-xs font-medium text-white">{user.name}</div>
                <div className="font-mono text-[10px] text-trail-muted">{roleLabel}</div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border-[0.5px] border-trail-line bg-white/[0.04]">
                {!user.photo || avatarFailed ? (
                  <span className="material-symbols-outlined text-lg text-trail-muted" aria-hidden="true">
                    person
                  </span>
                ) : (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={resolvePhotoUrl(user.photo, user.name)}
                    onError={() => setAvatarFailed(true)}
                  />
                )}
              </div>
            </button>
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-trail-muted">
              Adicionar
            </span>
            {KIND_ICONS.map((kind) => (
              <button
                key={kind.kind}
                type="button"
                onClick={() => void handleAddDevice(kind.kind)}
                disabled={busy}
                title={kind.desc}
                className={`${playgroundSecondaryButtonClass} !h-8 !px-2.5 !text-[10px]`}
              >
                <span className="material-symbols-outlined text-[15px] text-trail-cyan" aria-hidden="true">
                  {kind.icon}
                </span>
                {kind.label}
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            <section className="relative flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)] lg:min-h-0">
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
                <span className="material-symbols-outlined text-[16px] text-trail-muted" aria-hidden="true">
                  hub
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                  Topologia
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {pendingPort && (
                    <span className="rounded border-[0.5px] border-cyan-400/20 bg-cyan-400/[0.06] px-2 py-1 font-mono text-[10px] text-trail-cyan">
                      {devices.find((d) => d.ref === pendingPort.ref)?.hostname}:{pendingPort.name}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-trail-muted">
                    {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
                  </span>
                  <span className="font-mono text-[10px] text-trail-muted">
                    {links.length} {links.length === 1 ? 'cabo' : 'cabos'}
                  </span>
                </div>
              </div>

              <div className="relative min-h-0 flex-1">
                <NetworkCanvas
                  devices={devices}
                  links={links}
                  linkedPorts={linkedPorts}
                  pendingPort={pendingPort}
                  selectedRef={selectedRef}
                  selectedLink={selectedLink}
                  activeLink={activeLink}
                  onSelectDevice={(ref) => {
                    setSelectedRef(ref)
                    setSelectedLink(null)
                  }}
                  onSelectLink={(index) => {
                    setSelectedLink(index)
                    setSelectedRef(null)
                  }}
                  onPortClick={(ref, name) => void handlePortClick(ref, name)}
                  onMoveDevice={handleMoveDevice}
                  onCanvasClick={() => {
                    setPendingPort(null)
                    setSelectedLink(null)
                  }}
                />

                {selectedLinkData && (
                  <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
                    <span className="font-mono text-[10px] leading-relaxed text-neutral-400">
                      {devices.find((d) => d.ref === selectedLinkData.deviceRefA)?.hostname}:
                      {selectedLinkData.interfaceA} ↔{' '}
                      {devices.find((d) => d.ref === selectedLinkData.deviceRefB)?.hostname}:
                      {selectedLinkData.interfaceB}
                    </span>
                    <span
                      className={`rounded border-[0.5px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        selectedLinkData.status === 'UP'
                          ? 'border-cyan-400/20 bg-cyan-400/[0.06] text-trail-cyan'
                          : 'border-red-500/20 bg-red-500/[0.06] text-red-300'
                      }`}
                    >
                      {selectedLinkData.status === 'UP' ? 'ativo' : 'cortado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleToggleLink(selectedLink!)}
                      className={`${playgroundSecondaryButtonClass} !h-8 !px-2.5 !text-[10px]`}
                    >
                      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                        {selectedLinkData.status === 'UP' ? 'link_off' : 'link'}
                      </span>
                      {selectedLinkData.status === 'UP' ? 'Cortar' : 'Religar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLink(selectedLink!)}
                      className={`${playgroundDangerButtonClass} !h-8 !px-2.5 !text-[10px]`}
                    >
                      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                        delete
                      </span>
                      Remover
                    </button>
                  </div>
                )}

                {selected && !selectedLinkData && (
                  <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
                    <span className="font-mono text-xs text-white">
                      {selected.hostname}
                      {selected.interfaces.some((i) => i.ipAddress) && (
                        <span className="ml-2 text-[10px] text-trail-muted">
                          {selected.interfaces
                            .filter((i) => i.ipAddress)
                            .map((i) => `${i.name} ${i.ipAddress}`)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleMoveCommit()}
                      className={`${playgroundSecondaryButtonClass} !h-8 !px-2.5 !text-[10px]`}
                    >
                      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                        save
                      </span>
                      Salvar posição
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDevice()}
                      className={`${playgroundDangerButtonClass} !h-8 !px-2.5 !text-[10px]`}
                    >
                      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                        delete
                      </span>
                      Remover
                    </button>
                  </div>
                )}

                {selected &&
                  selected.interfaces.some((i) => i.ipAddress) &&
                  (() => {
                    const target = devices.find(
                      (d) =>
                        d.ref !== selected.ref &&
                        d.interfaces.some(
                          (i) =>
                            i.ipAddress &&
                            i.ipAddress !== selected.interfaces.find((x) => x.ipAddress)?.ipAddress
                        )
                    )?.interfaces.find((i) => i.ipAddress)?.ipAddress
                    const own = selected.interfaces.find((i) => i.ipAddress)?.ipAddress
                    if (!target) return null
                    return (
                      <div className="absolute left-1/2 top-3 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                          Testar
                        </span>
                        <button
                          type="button"
                          onClick={() => void runCommand(`ping ${target}`)}
                          className={`${playgroundSecondaryButtonClass} !h-8 !px-2.5 !text-[10px]`}
                        >
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            network_ping
                          </span>
                          ping {target}
                        </button>
                        <button
                          type="button"
                          onClick={() => void runCommand(`traceroute ${target}`)}
                          className={`${playgroundSecondaryButtonClass} !h-8 !px-2.5 !text-[10px]`}
                        >
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            route
                          </span>
                          traceroute
                        </button>
                        <span className="sr-only">de {own}</span>
                      </div>
                    )
                  })()}
              </div>
            </section>

            <section className="flex min-h-[420px] w-full shrink-0 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_12px_40px_rgba(0,0,0,0.45)] lg:min-h-0 lg:w-[360px]">
              <div className="flex h-12 shrink-0 items-center gap-1 border-b-[0.5px] border-trail-line px-3">
                {(
                  [
                    { key: 'terminal' as Tab, label: 'Terminal', icon: 'terminal' },
                    { key: 'tabelas' as Tab, label: 'Tabelas', icon: 'table_chart' },
                  ]
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={tab === t.key ? 'page' : undefined}
                    className={`flex h-8 items-center gap-1.5 rounded border-[0.5px] px-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                      tab === t.key
                        ? 'border-trail-line bg-white/[0.08] text-white'
                        : 'border-transparent text-trail-muted hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      {t.icon}
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>

              {!selected ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-trail-muted" aria-hidden="true">
                    touch_app
                  </span>
                  <p className="text-xs leading-relaxed text-trail-muted">
                    Selecione um dispositivo ou um cabo no canvas.
                  </p>
                </div>
              ) : tab === 'terminal' ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
                    <span className="material-symbols-outlined text-[16px] text-trail-cyan" aria-hidden="true">
                      {KIND_ICONS.find((k) => k.kind === selected.kind)?.icon ?? 'device_hub'}
                    </span>
                    <span className="font-mono text-xs text-white">{selected.hostname}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                      {KIND_ICONS.find((k) => k.kind === selected.kind)?.label ?? 'Dispositivo'}
                    </span>
                  </div>
                  <div
                    className="min-h-0 flex-1 overflow-auto bg-[#151515] px-4 py-3 font-mono text-xs leading-relaxed"
                    aria-live="polite"
                  >
                    {lines.length === 0 && (
                      <p className="text-trail-muted">
                        Configure o dispositivo com comandos de rede, como em um switch ou roteador real.
                        <br />
                        <br />
                        <span className="text-neutral-500">ex: enable</span>
                        <br />
                        <span className="text-neutral-500">ex: configure terminal</span>
                        <br />
                        <span className="text-neutral-500">ex: int eth0</span>
                        <br />
                        <span className="text-neutral-500">ex: ip address 10.0.0.1 255.255.255.0</span>
                      </p>
                    )}
                    {lines.map((line) => (
                      <pre
                        key={line.id}
                        className={`whitespace-pre-wrap break-words ${
                          line.kind === 'in'
                            ? 'text-trail-cyan'
                            : line.kind === 'err'
                              ? 'text-red-300'
                              : line.kind === 'event'
                                ? 'text-trail-muted'
                                : 'text-neutral-200'
                        }`}
                      >
                        {line.kind === 'in' ? `${selected.hostname}${prompt} ${line.text}` : line.text}
                      </pre>
                    ))}
                  </div>
                  <div className="shrink-0 space-y-2 border-t-[0.5px] border-trail-line bg-trail-surface/95 p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {['show ip arp', 'show ip route', 'show ip interface brief', 'show running-config'].map(
                        (cmd) => (
                          <button
                            key={cmd}
                            type="button"
                            onClick={() => void runCommand(cmd)}
                            className="rounded border-[0.5px] border-trail-line bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-trail-muted transition-colors hover:border-trail-accent hover:text-white"
                          >
                            {cmd}
                          </button>
                        )
                      )}
                    </div>
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                      <label htmlFor="net-cli" className="sr-only">
                        Comando de rede
                      </label>
                      <span className="font-mono text-xs text-trail-cyan">{prompt}</span>
                      <input
                        id="net-cli"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="digite um comando"
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded border-[0.5px] border-trail-line bg-trail-background px-2 py-1.5 font-mono text-xs text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className={`${playgroundPrimaryButtonClass} !h-8 !px-3 !text-[10px]`}
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
                      Estado de {selected.hostname}
                    </p>
                    <button
                      type="button"
                      onClick={() => void refreshState()}
                      className="flex h-8 w-8 items-center justify-center rounded border-[0.5px] border-trail-line bg-white/[0.03] text-trail-muted transition-colors hover:border-trail-accent hover:text-white"
                      aria-label="Atualizar tabelas"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        refresh
                      </span>
                    </button>
                  </div>

                  <Table
                    title="Tabela ARP"
                    empty="Nenhuma entrada"
                    columns={['IP', 'MAC', 'Porta']}
                    rows={(deviceState?.arp ?? []).map((r) => [r.ip, r.mac, r.iface])}
                  />
                  <Table
                    title="Tabela MAC"
                    empty="Nenhuma entrada"
                    columns={['MAC', 'Porta', 'VLAN']}
                    rows={(deviceState?.macTable ?? []).map((r) => [r.mac, r.iface, String(r.vlan)])}
                  />
                  <Table
                    title="Tabela de rotas"
                    empty="Nenhuma rota"
                    columns={['Rede', 'Próximo salto', 'Porta']}
                    rows={(deviceState?.routes ?? []).map((r) => [
                      `${r.network}/${r.prefix}`,
                      r.nextHop ?? 'direto',
                      r.iface,
                    ])}
                  />
                  {deviceState && deviceState.vlans.length > 0 && (
                    <Table
                      title="VLANs"
                      empty="Nenhuma VLAN"
                      columns={['ID', 'Nome']}
                      rows={deviceState.vlans.map((v) => [String(v.id), v.name])}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border-[0.5px] px-4 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.5)] ${
              toast.tone === 'ok'
                ? 'border-trail-line bg-trail-surface/95 text-neutral-200'
                : 'border-red-500/20 bg-red-500/[0.08] text-red-300'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      <EditProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdate={(updated) => {
          setUser(updated)
          setAvatarFailed(false)
          setIsProfileOpen(false)
        }}
      />
    </div>
  )
}

function Table({
  title,
  columns,
  rows,
  empty,
}: {
  title: string
  columns: string[]
  rows: string[][]
  empty: string
}) {
  return (
    <section className="rounded-lg border-[0.5px] border-trail-line bg-trail-background/40 p-3">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-neutral-500">{empty}</p>
      ) : (
        <table className="mt-2 w-full font-mono text-[11px]">
          <thead>
            <tr className="text-left text-neutral-500">
              {columns.map((column) => (
                <th key={column} className="pb-1 font-normal">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-t-[0.5px] border-trail-line/70 text-neutral-300"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="py-1 pr-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
