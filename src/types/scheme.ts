import type { Student } from './student'
import type { Seat } from './seat'
import type { StudentGroup } from './group'
import type { SeatConfig, ExportConfig } from './config'

export interface SchemeConfig {
  seat: SeatConfig
  export: ExportConfig
  showPodium: boolean
}

export interface DataScheme {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  version: number
  config: SchemeConfig
  students: Student[]
  seats: Seat[]
  groups: StudentGroup[]
}

export interface SchemeManagerState {
  schemes: DataScheme[]
  activeSchemeId: string | null
  version: number
}

export interface SchemeOperationResult {
  success: boolean
  message: string
  data?: DataScheme
}

export interface SchemeStorageData {
  schemes: DataScheme[]
  activeSchemeId: string | null
  version: number
}

export const SCHEME_STORAGE_KEY = 'seat-schemes'
export const SCHEME_VERSION = 1

export function generateSchemeId(): string {
  return `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createDefaultSchemeConfig(): SchemeConfig {
  return {
    seat: {
      rows: 6,
      cols: 7,
      showPodium: true,
      seatWidth: 90,
      seatHeight: 60,
      gapX: 8,
      gapY: 8,
    },
    export: {
      format: 'png',
      quality: 1,
      showSeatNumber: true,
      showStudentId: false,
      backgroundColor: '#ffffff',
    },
    showPodium: true,
  }
}

export function createEmptyScheme(name: string, description?: string): DataScheme {
  const now = new Date().toISOString()
  return {
    id: generateSchemeId(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
    version: SCHEME_VERSION,
    config: createDefaultSchemeConfig(),
    students: [],
    seats: [],
    groups: [],
  }
}

export function cloneScheme(scheme: DataScheme, newName?: string): DataScheme {
  const now = new Date().toISOString()
  return {
    ...JSON.parse(JSON.stringify(scheme)),
    id: generateSchemeId(),
    name: newName || `${scheme.name} (副本)`,
    createdAt: now,
    updatedAt: now,
  }
}
