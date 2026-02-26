export interface StudentGroup {
  id: string
  name: string
  studentIds: string[]
  color?: string
  createdAt: number
  updatedAt: number
}

export interface GroupHistoryAction {
  type:
    | 'create'
    | 'delete'
    | 'rename'
    | 'add_student'
    | 'remove_student'
    | 'move_student'
    | 'reorder'
    | 'clear_students'
  groupId?: string
  studentId?: string
  targetGroupId?: string
  previousState?: StudentGroup[]
  timestamp: number
}

export const GROUP_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#64748b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#0ea5e9',
]

export function generateGroupId(): string {
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyGroup(name: string, color?: string): StudentGroup {
  return {
    id: generateGroupId(),
    name,
    studentIds: [],
    color: color || GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
