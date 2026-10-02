export const DEVICE_W = 176
export const HEADER_H = 40
export const PORT_COLS = 8
export const PORT_ROW_H = 18
export const PORT_TOP = 50
const PORT_X0 = 10
const PORT_DX = 20

export function portOffset(index: number) {
  return {
    x: PORT_X0 + (index % PORT_COLS) * PORT_DX,
    y: PORT_TOP + Math.floor(index / PORT_COLS) * PORT_ROW_H,
  }
}

export function deviceHeight(count: number) {
  return PORT_TOP + Math.ceil(Math.max(count, 1) / PORT_COLS) * PORT_ROW_H + 8
}

export function linkKey(refA: string, intfA: string, refB: string, intfB: string) {
  return [refA, intfA, refB, intfB].sort().join('|')
}
