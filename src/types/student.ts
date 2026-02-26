export interface StudentBase {
  name: string
  studentId?: string
  gender?: 'male' | 'female'
  height?: number
  score?: number
  color?: string
}

export interface Student extends StudentBase {
  id: string
  [key: string]: unknown
}

export type StudentField = keyof Student

export const STUDENT_COLORS = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#00d4aa',
  '#9b59b6',
  '#3498db',
  '#1abc9c',
  '#e74c3c',
]
