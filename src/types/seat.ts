export interface Seat {
  id: string
  row: number
  col: number
  studentId?: string
  isLocked: boolean
}

export interface SeatPosition {
  row: number
  col: number
}

export type SeatGrid = Seat[][]

export function createSeatId(row: number, col: number): string {
  return `seat-${row}-${col}`
}
