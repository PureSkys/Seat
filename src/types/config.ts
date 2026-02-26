export interface SeatConfig {
  rows: number
  cols: number
  showPodium: boolean
  seatWidth: number
  seatHeight: number
  gapX: number
  gapY: number
}

export interface ExportConfig {
  format: 'png' | 'jpg' | 'pdf' | 'excel'
  quality: number
  showSeatNumber: boolean
  showStudentId: boolean
  backgroundColor: string
}

export interface SmartArrangeRule {
  type: 'height' | 'score' | 'gender' | 'custom'
  ascending: boolean
  field?: string
}

export const DEFAULT_CONFIG: SeatConfig = {
  rows: 5,
  cols: 8,
  showPodium: true,
  seatWidth: 80,
  seatHeight: 60,
  gapX: 8,
  gapY: 8,
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'png',
  quality: 1,
  showSeatNumber: true,
  showStudentId: false,
  backgroundColor: '#ffffff',
}
