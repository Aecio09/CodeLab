import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../constants'
import { apiLogout } from '../lib/api'
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
import { EditProfileModal } from '../components/EditProfileModal'
import { NetworkCanvas } from '../components/network/NetworkCanvas'
import { linkKey } from '../components/network/geometry'

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
        const meRes = await fetch(`${API_BASE_URL}/api/users/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${localStorage.getItem('codelab_token') ?? ''}` },
        })
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

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background font-body-md text-on-surface"
        role="status"
        aria-live="polite"
      >
        Montando seu playground de redes...
      </div>
    )
  }

  if (fatal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <span className="material-symbols-outlined text-5xl text-error" aria-hidden="true">
          error
        </span>
        <p className="font-h3 text-on-surface">Não foi possível abrir o laboratório</p>
        <p className="max-w-md text-sm text-on-surface-variant">{fatal}</p>
        <button className="btn-primary !h-10" onClick={() => window.location.reload()}>
          Tentar de novo
        </button>
      </div>
    )
  }

  const lines = selectedRef ? (history[selectedRef] ?? []) : []
  const selectedLinkData = selectedLink !== null ? links[selectedLink] : null
  const deviceState = state && state.ref === selectedRef ? state.data : null

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-body-md text-on-surface">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low px-4 py-6">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
            <span className="material-symbols-outlined text-on-primary">terminal</span>
          </div>
          <h1 className="font-h2 text-lg font-bold tracking-tight text-primary">CodeLab</h1>
        </div>

        <nav className="space-y-1" aria-label="Navegação principal">
          <a
            href="/trilha"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined">map</span>
            Minha Trilha
          </a>
          <a
            href="/playground"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined">terminal</span>
            Playground
          </a>
          <a
            href="/networkplayground"
            aria-current="page"
            className="flex w-full items-center gap-3 rounded-lg bg-secondary-container px-4 py-2 text-left text-sm font-semibold text-on-secondary-container"
          >
            <span className="material-symbols-outlined">lan</span>
            Playground de Redes
          </a>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-semibold text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface"
          >
            <span className="material-symbols-outlined">account_circle</span>
            Meu Perfil
          </button>
        </nav>

        <div className="mt-6 border-t border-outline-variant pt-4">
          <p className="form-label !mb-2">Adicionar dispositivo</p>
          <div className="space-y-1.5">
            {KIND_ICONS.map((k) => (
              <button
                key={k.kind}
                onClick={() => void handleAddDevice(k.kind)}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-left transition-all hover:border-primary/60 hover:bg-surface-container-high disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">
                  {k.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-on-surface">{k.label}</span>
                  <span className="block truncate font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                    {k.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-2 border-t border-outline-variant pt-4">
          <button onClick={() => void handleSave()} disabled={busy} className="btn-secondary w-full !h-10">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Salvar
          </button>
          <button onClick={() => void apiLogout()} className="btn-danger w-full !h-10">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="relative min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between border-b border-outline-variant bg-surface-container-low px-6">
          <div>
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Playground livre
            </p>
            <h2 className="font-h3 text-on-surface">Topologia de redes</h2>
          </div>
          <div className="flex items-center gap-3">
            {pendingPort && (
              <span className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 font-label text-[11px] uppercase tracking-wider text-primary">
                {devices.find((d) => d.ref === pendingPort.ref)?.hostname}:{pendingPort.name}
              </span>
            )}
            <span className="font-label text-xs text-on-surface-variant">
              {devices.length} dispositivos · {links.length} cabos
            </span>
            <button
              onClick={() => setUser((u) => (u ? { ...u } : u))}
              className="h-9 w-9 overflow-hidden rounded-lg border border-outline-variant"
              aria-label="Abrir meu perfil"
            >
              <img
                src={resolvePhotoUrl(user.photo, user.name)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>

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

        {/* Ações do cabo selecionado */}
        {selectedLinkData && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 shadow-lg">
            <span className="font-mono text-xs text-on-surface-variant">
              {devices.find((d) => d.ref === selectedLinkData.deviceRefA)?.hostname}:
              {selectedLinkData.interfaceA} ↔ {devices.find((d) => d.ref === selectedLinkData.deviceRefB)?.hostname}:
              {selectedLinkData.interfaceB}
            </span>
            <span
              className={`rounded px-2 py-0.5 font-label text-[10px] uppercase tracking-wider ${
                selectedLinkData.status === 'UP' ? 'bg-primary/15 text-primary' : 'bg-error/15 text-error'
              }`}
            >
              {selectedLinkData.status === 'UP' ? 'ativo' : 'cortado'}
            </span>
            <button
              onClick={() => void handleToggleLink(selectedLink!)}
              className="btn-secondary !h-8 !px-3 !text-[11px]"
            >
              <span className="material-symbols-outlined text-[16px]">
                {selectedLinkData.status === 'UP' ? 'link_off' : 'link'}
              </span>
              {selectedLinkData.status === 'UP' ? 'Cortar' : 'Religar'}
            </button>
            <button
              onClick={() => void handleDeleteLink(selectedLink!)}
              className="btn-danger !h-8 !px-3 !text-[11px]"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Remover
            </button>
          </div>
        )}

        {selected && !selectedLinkData && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 shadow-lg">
            <span className="font-mono text-xs text-on-surface">
              {selected.hostname}
              {selected.interfaces.some((i) => i.ipAddress) && (
                <span className="ml-2 text-on-surface-variant">
                  {selected.interfaces
                    .filter((i) => i.ipAddress)
                    .map((i) => `${i.name} ${i.ipAddress}`)
                    .join(' · ')}
                </span>
              )}
            </span>
            <button
              onClick={() => void handleMoveCommit()}
              className="btn-secondary !h-8 !px-3 !text-[11px]"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Salvar posição
            </button>
            <button
              onClick={() => void handleDeleteDevice()}
              className="btn-danger !h-8 !px-3 !text-[11px]"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Remover
            </button>
          </div>
        )}
      </main>

      {/* Painel direito */}
      <section className="flex w-[380px] shrink-0 flex-col border-l border-outline-variant bg-surface-container-low">
        <div className="flex h-14 shrink-0 items-center gap-1 border-b border-outline-variant px-3">
          {(
            [
              { key: 'terminal' as Tab, label: 'Terminal', icon: 'terminal' },
              { key: 'tabelas' as Tab, label: 'Tabelas', icon: 'table_chart' },
            ]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-surface-container-high text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">
              touch_app
            </span>
            <p className="text-sm text-on-surface-variant">
              Selecione um dispositivo ou um cabo no canvas.
            </p>
          </div>
        ) : tab === 'terminal' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-2">
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                {KIND_ICONS.find((k) => k.kind === selected.kind)?.icon ?? 'device_hub'}
              </span>
              <span className="text-sm font-semibold text-on-surface">{selected.hostname}</span>
            </div>
            <div
              className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed"
              aria-live="polite"
            >
              {lines.length === 0 && (
                <p className="text-on-surface-variant">
                  Configure o dispositivo com comandos de rede, como em um switch ou roteador real.
                  <br />
                  <br />
                  <span className="text-outline">ex: enable</span>
                  <br />
                  <span className="text-outline">ex: configure terminal</span>
                  <br />
                  <span className="text-outline">ex: int eth0</span>
                  <br />
                  <span className="text-outline">ex: ip address 10.0.0.1 255.255.255.0</span>
                </p>
              )}
              {lines.map((line) => (
                <pre
                  key={line.id}
                  className={`whitespace-pre-wrap break-words ${
                    line.kind === 'in'
                      ? 'text-primary'
                      : line.kind === 'err'
                        ? 'text-error'
                        : line.kind === 'event'
                          ? 'text-on-surface-variant'
                          : 'text-on-surface'
                  }`}
                >
                  {line.kind === 'in' ? `${selected.hostname}${prompt} ${line.text}` : line.text}
                </pre>
              ))}
            </div>
            <div className="shrink-0 space-y-2 border-t border-outline-variant p-3">
              <div className="flex flex-wrap gap-1.5">
                {['show ip arp', 'show ip route', 'show ip interface brief', 'show running-config'].map(
                  (cmd) => (
                    <button
                      key={cmd}
                      onClick={() => void runCommand(cmd)}
                      className="rounded-md border border-outline-variant px-2 py-1 font-mono text-[10px] text-on-surface-variant transition-all hover:border-primary/60 hover:text-primary"
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
                <span className="font-mono text-xs text-primary">{prompt}</span>
                <input
                  id="net-cli"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="digite um comando"
                  autoComplete="off"
                  className="flex-1 rounded-md border border-outline-variant bg-surface-container-highest px-2 py-1.5 font-mono text-xs text-on-surface placeholder:text-outline/60 focus:border-primary focus:outline-none"
                />
                <button type="submit" className="btn-primary !h-8 !px-3 !text-[11px]">
                  Enviar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
            <div className="flex items-center justify-between">
              <p className="form-label !mb-0">Estado de {selected.hostname}</p>
              <button
                onClick={() => void refreshState()}
                className="rounded-md border border-outline-variant p-1.5 text-on-surface-variant hover:text-primary"
                aria-label="Atualizar tabelas"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
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

      {/* Ações rápidas de rede sobre o dispositivo selecionado */}
      {selected && selected.interfaces.some((i) => i.ipAddress) && (
        <div className="absolute left-1/2 top-16 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container px-3 py-2 shadow-lg">
          <span className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
            Testar
          </span>
          {(() => {
            const target = devices.find(
              (d) =>
                d.ref !== selected.ref &&
                d.interfaces.some((i) => i.ipAddress && i.ipAddress !== selected.interfaces.find((x) => x.ipAddress)?.ipAddress)
            )?.interfaces.find((i) => i.ipAddress)?.ipAddress
            const own = selected.interfaces.find((i) => i.ipAddress)?.ipAddress
            if (!target) return null
            return (
              <>
                <button
                  onClick={() => void runCommand(`ping ${target}`)}
                  className="btn-secondary !h-8 !px-3 !text-[11px]"
                >
                  <span className="material-symbols-outlined text-[16px]">network_ping</span>
                  ping {target}
                </button>
                <button
                  onClick={() => void runCommand(`traceroute ${target}`)}
                  className="btn-secondary !h-8 !px-3 !text-[11px]"
                >
                  <span className="material-symbols-outlined text-[16px]">route</span>
                  traceroute
                </button>
                <span className="sr-only">de {own}</span>
              </>
            )
          })()}
        </div>
      )}

      {/* Avisos */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2 text-sm shadow-lg ${
              t.tone === 'ok'
                ? 'border-primary/50 bg-surface-container text-on-surface'
                : 'border-error/50 bg-surface-container text-error'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <EditProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdate={(updated) => {
          setUser(updated)
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
    <section className="card-surface !p-3">
      <h3 className="form-label !mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-on-surface-variant">{empty}</p>
      ) : (
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="text-left text-on-surface-variant">
              {columns.map((c) => (
                <th key={c} className="pb-1 font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-outline-variant/50 text-on-surface">
                {row.map((cell, j) => (
                  <td key={j} className="py-1 pr-2 align-top">
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
