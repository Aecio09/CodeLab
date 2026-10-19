import { useEffect, useRef, useState } from 'react'
import type { NetDevice, NetLink } from '../../types/network'
import { DEVICE_W, deviceHeight, portOffset } from './geometry'

const KIND_META: Record<string, { icon: string; label: string }> = {
  HOST: { icon: 'computer', label: 'Host' },
  SWITCH: { icon: 'switch_video', label: 'Switch' },
  ROUTER: { icon: 'router', label: 'Roteador' },
  FIREWALL: { icon: 'shield', label: 'Firewall' },
}

function endpoint(
  device: NetDevice,
  portName: string,
  towardLeft: boolean
): { x: number; y: number } {
  const index = Math.max(
    0,
    (device.interfaces ?? []).findIndex((intf) => intf.name === portName)
  )
  const { x, y } = portOffset(index)
  return { x: device.x + (towardLeft ? x : DEVICE_W - x), y: device.y + y }
}

type Props = {
  devices: NetDevice[]
  links: NetLink[]
  selectedRef: string | null
  onSelect: (ref: string) => void
}

/**
 * Topologia estática: o aluno só pode selecionar dispositivos para usar o CLI.
 * Não há arrastar, adicionar, remover nem conectar.
 */
export function ReadOnlyTopology({ devices, links, selectedRef, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const width = Math.max(
    360,
    ...devices.map((device) => device.x + DEVICE_W + 40)
  )
  const height = Math.max(
    240,
    ...devices.map(
      (device) => device.y + deviceHeight(device.interfaces?.length ?? 0) + 40
    )
  )

  // Ajusta a topologia inteira ao card, sem permitir arrastar/editar.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const update = () => {
      const { clientWidth, clientHeight } = element
      if (!clientWidth || !clientHeight) return
      setScale(Math.min(1, clientWidth / width, clientHeight / height))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width, height])

  const linkedPorts = new Set(
    links.flatMap((link) => [
      `${link.deviceRefA}|${link.interfaceA}`,
      `${link.deviceRefB}|${link.interfaceB}`,
    ])
  )

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-background"
    >
      <div
        className="relative shrink-0"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={width}
            height={height}
            aria-hidden="true"
          >
          {links.map((link, index) => {
            const from = devices.find((device) => device.ref === link.deviceRefA)
            const to = devices.find((device) => device.ref === link.deviceRefB)
            if (!from || !to) return null

            const start = endpoint(from, link.interfaceA, true)
            const end = endpoint(to, link.interfaceB, false)
            const midX = (start.x + end.x) / 2
            const down = link.status === 'DOWN'

            return (
              <path
                key={`${link.deviceRefA}-${link.interfaceA}-${index}`}
                d={`M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`}
                fill="none"
                strokeWidth={2}
                strokeDasharray={down ? '6 6' : undefined}
                stroke={down ? '#ffb4ab' : '#5f7a6c'}
              />
            )
          })}
        </svg>

        {devices.map((device) => {
          const meta = KIND_META[device.kind] ?? { icon: 'device_hub', label: 'Device' }
          const interfaces = device.interfaces ?? []
          const cardHeight = deviceHeight(interfaces.length)
          const selected = device.ref === selectedRef

          return (
            <div
              key={device.ref}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`Selecionar ${device.hostname}`}
              onClick={() => onSelect(device.ref)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(device.ref)
                }
              }}
              className={`absolute cursor-pointer select-none rounded-xl border bg-surface-container shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-outline-variant hover:border-primary/60'
              }`}
              style={{
                left: device.x,
                top: device.y,
                width: DEVICE_W,
                height: cardHeight,
              }}
            >
              <div className="flex h-10 items-center gap-2 border-b border-outline-variant px-3">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {meta.icon}
                </span>
                <span className="truncate text-xs font-bold text-on-surface">
                  {device.hostname}
                </span>
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {meta.label}
                </span>
              </div>

              <div className="grid grid-cols-8 gap-x-0 gap-y-0 px-2.5 pt-2">
                {interfaces.map((intf) => {
                  const linked = linkedPorts.has(`${device.ref}|${intf.name}`)
                  return (
                    <span
                      key={intf.name}
                      title={`${intf.name}${intf.ipAddress ? ` · ${intf.ipAddress}` : ''}`}
                      className={`mx-auto block h-2 w-2 rounded-sm ${
                        linked
                          ? intf.adminUp
                            ? 'bg-primary'
                            : 'bg-error'
                          : 'bg-outline-variant'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
