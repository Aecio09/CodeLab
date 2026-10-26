import { useEffect, useRef } from 'react'
import type { NetDevice } from '../../types/network'
import type { TerminalLine } from '../../hooks/useNetworkLab'
import { playgroundPrimaryButtonClass } from '../../lib/playground'

const KIND_ICONS: Record<string, string> = {
  HOST: 'computer',
  SWITCH: 'switch_video',
  ROUTER: 'router',
  FIREWALL: 'shield',
}

const HINTS: Record<string, string[]> = {
  HOST: [
    'enable',
    'configure terminal',
    'interface eth0',
    'ip address <ip> <mascara>',
    'ip default-gateway <ip>',
  ],
  SWITCH: [
    'enable',
    'configure terminal',
    'vlan 10',
    'interface fa0/1',
    'switchport access vlan 10',
  ],
  ROUTER: [
    'enable',
    'configure terminal',
    'interface gi0/1',
    'ip address <ip> <mascara>',
    'ip route <rede> <mascara> <gateway>',
  ],
  FIREWALL: ['enable', 'configure terminal', 'interface eth0', 'ip address <ip> <mascara>'],
}

type Props = {
  devices: NetDevice[]
  selectedRef: string | null
  onSelect: (ref: string) => void
  lines: TerminalLine[]
  prompt: string
  input: string
  onInput: (value: string) => void
  onSend: (line: string) => void
  disabled: boolean
}

export function LabTerminal({
  devices,
  selectedRef,
  onSelect,
  lines,
  prompt,
  input,
  onInput,
  onSend,
  disabled,
}: Props) {
  const outputRef = useRef<HTMLDivElement>(null)
  const selected = devices.find((device) => device.ref === selectedRef) ?? null

  useEffect(() => {
    const element = outputRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [lines.length])

  const hints = selected ? HINTS[selected.kind] ?? [] : []

  return (
    <div className="flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-lg border-[0.5px] border-trail-line bg-trail-surface/95 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-[0.5px] border-trail-line bg-trail-background/40 px-4 py-2.5">
        <span className="material-symbols-outlined text-[16px] text-trail-muted" aria-hidden="true">
          terminal
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-trail-muted">
          Terminal
        </span>
        <div className="ml-auto flex max-w-full gap-1 overflow-x-auto">
          {devices.map((device) => (
            <button
              key={device.ref}
              type="button"
              onClick={() => onSelect(device.ref)}
              aria-label={`Usar terminal de ${device.hostname}`}
              aria-pressed={device.ref === selectedRef}
              className={`flex shrink-0 items-center gap-1.5 rounded border-[0.5px] px-2.5 py-1 font-mono text-[10px] transition-colors ${
                device.ref === selectedRef
                  ? 'border-trail-line bg-white/[0.08] text-white'
                  : 'border-transparent text-trail-muted hover:border-trail-line hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  device.ref === selectedRef ? 'text-trail-cyan' : ''
                }`}
                aria-hidden="true"
              >
                {KIND_ICONS[device.kind] ?? 'device_hub'}
              </span>
              {device.hostname}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={outputRef}
        className="min-h-[180px] flex-1 overflow-y-auto bg-[#151515] px-4 py-3 font-mono text-xs leading-relaxed"
        role="log"
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <div className="space-y-2 text-trail-muted">
            <p className="text-trail-cyan">Configure o cenário usando apenas o CLI.</p>
            {selected && (
              <p>
                Dispositivo selecionado:{' '}
                <span className="font-bold text-white">{selected.hostname}</span>
              </p>
            )}
            {hints.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hints.map((hint) => (
                  <span
                    key={hint}
                    className="rounded border-[0.5px] border-trail-line bg-white/[0.03] px-2 py-0.5 text-[10px] text-trail-muted"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          lines.map((line) => {
            if (line.kind === 'in') {
              return (
                <div key={line.id} className="whitespace-pre-wrap break-words text-neutral-200">
                  <span className="text-trail-cyan">{line.prompt}</span> {line.text}
                </div>
              )
            }
            if (line.kind === 'event') {
              return (
                <div key={line.id} className="whitespace-pre-wrap break-words text-trail-cyan/80">
                  {line.text}
                </div>
              )
            }
            return (
              <pre
                key={line.id}
                className={`whitespace-pre-wrap break-words font-mono ${
                  line.kind === 'err' ? 'text-red-300' : 'text-neutral-300'
                }`}
              >
                {line.text}
              </pre>
            )
          })
        )}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t-[0.5px] border-trail-line bg-trail-surface px-4 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSend(input)
        }}
      >
        <span className="shrink-0 font-mono text-xs text-trail-cyan">{prompt}</span>
        <input
          value={input}
          onChange={(event) => onInput(event.target.value)}
          disabled={disabled || !selected}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={`Comando para ${selected?.hostname ?? 'dispositivo'}`}
          placeholder={selected ? 'digite um comando…' : 'selecione um dispositivo'}
          className="min-w-0 flex-1 rounded border-[0.5px] border-trail-line bg-trail-background px-2 py-1.5 font-mono text-xs text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !selected || !input.trim()}
          className={`${playgroundPrimaryButtonClass} !h-8 !px-3 !text-[10px]`}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
