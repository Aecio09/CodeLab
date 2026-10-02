import { useRef, useState } from 'react'
import type { NetDevice, NetLink } from '../../types/network'
import {
  DEVICE_W,
  HEADER_H,
  PORT_COLS,
  portOffset,
  deviceHeight,
  linkKey,
} from './geometry'

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
    device.interfaces.findIndex((i) => i.name === portName)
  )
  const { x, y } = portOffset(index)
  return { x: device.x + (towardLeft ? x : DEVICE_W - x), y: device.y + y }
}

type Props = {
  devices: NetDevice[]
  links: NetLink[]
  linkedPorts: Set<string>
  pendingPort: { ref: string; name: string } | null
  selectedRef: string | null
  selectedLink: number | null
  activeLink: string | null
  onSelectDevice: (ref: string) => void
  onSelectLink: (index: number) => void
  onPortClick: (ref: string, name: string) => void
  onMoveDevice: (ref: string, x: number, y: number) => void
  onCanvasClick: () => void
}

export function NetworkCanvas({
  devices,
  links,
  linkedPorts,
  pendingPort,
  selectedRef,
  selectedLink,
  activeLink,
  onSelectDevice,
  onSelectLink,
  onPortClick,
  onMoveDevice,
  onCanvasClick,
}: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<{ ref: string; dx: number; dy: number } | null>(null)

  function handlePointerDown(e: React.PointerEvent, device: NetDevice) {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelectDevice(device.ref)
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragging({
      ref: device.ref,
      dx: e.clientX - rect.left - device.x,
      dy: e.clientY - rect.top - device.y,
    })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(8, Math.round((e.clientX - rect.left - dragging.dx) / 10) * 10)
    const y = Math.max(8, Math.round((e.clientY - rect.top - dragging.dy) / 10) * 10)
    onMoveDevice(dragging.ref, x, y)
  }

  function handlePointerUp() {
    setDragging(null)
  }

  return (
    <div
      ref={surfaceRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={onCanvasClick}
      className="relative h-full w-full overflow-auto bg-background"
      style={{
        backgroundImage:
          'linear-gradient(rgba(114,219,159,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(114,219,159,0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {links.map((link, index) => {
          const devA = devices.find((d) => d.ref === link.deviceRefA)
          const devB = devices.find((d) => d.ref === link.deviceRefB)
          if (!devA || !devB) return null
          const aLeft = devA.x + DEVICE_W / 2 < devB.x + DEVICE_W / 2
          const from = endpoint(devA, link.interfaceA, !aLeft)
          const to = endpoint(devB, link.interfaceB, aLeft)
          const midX = (from.x + to.x) / 2
          const isActive = activeLink === linkKey(link.deviceRefA, link.interfaceA, link.deviceRefB, link.interfaceB)
          const isSelected = selectedLink === index
          const down = link.status === 'DOWN'
          return (
            <g
              key={`${link.deviceRefA}-${link.interfaceA}-${link.deviceRefB}-${link.interfaceB}`}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onSelectLink(index)
              }}
            >
              <path
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
              />
              <path
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                strokeWidth={isSelected || isActive ? 3.5 : 2}
                strokeDasharray={down ? '6 6' : undefined}
                stroke={down ? '#ffb4ab' : isActive ? '#8ef8b9' : isSelected ? '#72db9f' : '#5f7a6c'}
              >
                <animate
                  attributeName="opacity"
                  values="1;0.35;1"
                  dur="0.7s"
                  repeatCount="indefinite"
                  {...(isActive && !down ? {} : { begin: 'indefinite' })}
                />
              </path>
            </g>
          )
        })}
      </svg>

      {devices.map((device) => {
        const meta = KIND_META[device.kind] ?? { icon: 'device_hub', label: 'Device' }
        const height = deviceHeight(device.interfaces.length)
        const selected = selectedRef === device.ref
        return (
          <div
            key={device.ref}
            onPointerDown={(e) => handlePointerDown(e, device)}
            className={`absolute select-none rounded-xl border bg-surface-container shadow-lg ${
              selected ? 'border-primary' : 'border-outline-variant'
            } ${dragging?.ref === device.ref ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ left: device.x, top: device.y, width: DEVICE_W, height }}
          >
            <div className="flex items-center gap-2 border-b border-outline-variant px-2.5" style={{ height: HEADER_H }}>
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-on-surface">{device.hostname}</p>
                <p className="truncate font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                  {meta.label}
                </p>
              </div>
              {device.kind === 'SWITCH' && (
                <span className="rounded bg-surface-container-highest px-1.5 py-0.5 font-label text-[10px] text-on-surface-variant">
                  {device.interfaces.length}p
                </span>
              )}
            </div>

            <div className="grid gap-y-[6px] px-2.5 pt-1" style={{ gridTemplateColumns: `repeat(${PORT_COLS}, 1fr)` }}>
              {device.interfaces.map((intf, index) => {
                const key = `${device.ref}|${intf.name}`
                const isLinked = linkedPorts.has(key)
                const isPending = pendingPort?.ref === device.ref && pendingPort?.name === intf.name
                return (
                  <button
                    key={intf.name}
                    type="button"
                    title={`${intf.name}${intf.ipAddress ? ` — ${intf.ipAddress}` : ''}`}
                    aria-label={`Conectar na porta ${intf.name} de ${device.hostname}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPortClick(device.ref, intf.name)
                    }}
                    className={`h-3 w-3 rounded-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isPending
                        ? 'border-primary bg-primary'
                        : isLinked
                          ? 'border-primary/70 bg-primary/40'
                          : 'border-outline bg-surface-container-highest hover:border-primary'
                    } ${intf.adminUp ? '' : 'opacity-40'}`}
                    style={portOffset(index).x === 10 ? { marginLeft: -2 } : undefined}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {devices.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="material-symbols-outlined text-5xl text-outline" aria-hidden="true">
            lan
          </span>
          <p className="font-h3 text-on-surface">Seu playground está vazio</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            Escolha um dispositivo na barra lateral para começar a montar sua topologia.
          </p>
        </div>
      )}
    </div>
  )
}
