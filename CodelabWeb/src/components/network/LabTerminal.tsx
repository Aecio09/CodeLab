import { useEffect, useRef } from 'react'
import type { NetDevice } from '../../types/network'
import type { TerminalLine } from '../../hooks/useNetworkLab'

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-outline-variant px-4 py-2">
        <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
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
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                device.ref === selectedRef
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {KIND_ICONS[device.kind] ?? 'device_hub'}
              </span>
              {device.hostname}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={outputRef}
        className="min-h-[180px] flex-1 overflow-y-auto bg-background/60 px-4 py-3 font-mono text-xs leading-relaxed"
        role="log"
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <div className="space-y-2 text-on-surface-variant">
            <p className="text-primary">Configure o cenário usando apenas o CLI.</p>
            {selected && (
              <p>
                Dispositivo selecionado:{' '}
                <span className="font-bold text-on-surface">{selected.hostname}</span>
              </p>
            )}
            {hints.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hints.map((hint) => (
                  <span
                    key={hint}
                    className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant"
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
                <div key={line.id} className="whitespace-pre-wrap break-words text-on-surface">
                  <span className="text-primary">{line.prompt}</span> {line.text}
                </div>
              )
            }
            if (line.kind === 'event') {
              return (
                <div key={line.id} className="whitespace-pre-wrap break-words text-primary/80">
                  {line.text}
                </div>
              )
            }
            return (
              <pre
                key={line.id}
                className={`whitespace-pre-wrap break-words font-mono ${
                  line.kind === 'err' ? 'text-error' : 'text-on-surface-variant'
                }`}
              >
                {line.text}
              </pre>
            )
          })
        )}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-outline-variant bg-surface-container px-4 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          onSend(input)
        }}
      >
        <span className="shrink-0 font-mono text-xs font-bold text-primary">{prompt}</span>
        <input
          value={input}
          onChange={(event) => onInput(event.target.value)}
          disabled={disabled || !selected}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={`Comando para ${selected?.hostname ?? 'dispositivo'}`}
          placeholder={selected ? 'digite um comando…' : 'selecione um dispositivo'}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !selected || !input.trim()}
          className="btn-primary !h-8 !px-3 !text-[10px]"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
