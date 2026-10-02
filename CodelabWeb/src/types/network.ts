export type DeviceKind = 'HOST' | 'SWITCH' | 'ROUTER' | 'FIREWALL'

export type NetInterface = {
  name: string
  ipAddress: string | null
  subnetMask: string | null
  description: string | null
  portMode: 'ACCESS' | 'TRUNK' | null
  accessVlanId: number | null
  adminUp: boolean
}

export type NetVlan = { id: number; name: string }

export type NetRoute = {
  network: string
  subnetMask: string | null
  nextHop: string | null
}

export type NetDevice = {
  ref: string
  kind: DeviceKind
  hostname: string
  x: number
  y: number
  interfaces: NetInterface[]
  vlans: NetVlan[]
  routes: NetRoute[]
  defaultGateway: string | null
}

export type NetLink = {
  deviceRefA: string
  interfaceA: string
  deviceRefB: string
  interfaceB: string
  status: 'UP' | 'DOWN'
}

export type NetSnapshot = {
  exerciseId: string
  name: string
  devices: NetDevice[]
  links: NetLink[]
}

export type DeviceModelInfo = {
  kind: DeviceKind
  displayName: string
  portPrefix: string
  defaultPorts: number
}

export type TraceEvent = {
  hop: number
  protocol: 'ARP' | 'IPV4' | string
  action: string
  fromDeviceRef: string | null
  fromInterface: string | null
  toDeviceRef: string | null
  toInterface: string | null
  srcIp: string | null
  dstIp: string | null
  srcMac: string | null
  dstMac: string | null
  summary: string
}

export type CliResult = {
  deviceRef: string
  prompt: string
  output: string
  events: TraceEvent[]
}

export type DeviceState = {
  hostname: string
  kind: DeviceKind
  arp: { ip: string; mac: string; iface: string; ageSeconds: number; type: string }[]
  macTable: { mac: string; iface: string; vlan: number; ageSeconds: number; type: string }[]
  routes: { network: string; prefix: string; nextHop: string | null; iface: string; metric: number; type: string }[]
  vlans: { id: number; name: string }[]
  defaultGateway: string | null
}
