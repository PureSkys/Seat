import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { Student } from '@/types'

export interface ParseResult {
  data: Student[]
  fields: string[]
  errors: string[]
}

function generateStudentId(): string {
  return `student-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeField(field: string): string {
  const fieldMap: Record<string, string> = {
    姓名: 'name',
    name: 'name',
    学生姓名: 'name',
    学号: 'studentId',
    studentId: 'studentId',
    student_id: 'studentId',
    性别: 'gender',
    gender: 'gender',
    身高: 'height',
    height: 'height',
    成绩: 'score',
    score: 'score',
    分数: 'score',
  }
  const normalized = fieldMap[field.trim()]
  return normalized !== undefined ? normalized : field.trim()
}

function parseValue(field: string, value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const normalizedField = normalizeField(field)

  switch (normalizedField) {
    case 'gender':
      if (typeof value === 'string') {
        const lower = value.toLowerCase()
        if (lower === '男' || lower === 'male' || lower === 'm') return 'male'
        if (lower === '女' || lower === 'female' || lower === 'f') return 'female'
      }
      return value
    case 'height':
    case 'score': {
      const num = Number(value)
      return isNaN(num) ? undefined : num
    }
    default:
      return value
  }
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    const errors: string[] = []

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve({ data: [], fields: [], errors: ['Excel文件没有工作表'] })
          return
        }
        const firstSheet = workbook.Sheets[sheetName]
        if (!firstSheet) {
          resolve({ data: [], fields: [], errors: ['Excel工作表不存在'] })
          return
        }
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet)

        const fields = jsonData.length > 0 && jsonData[0] ? Object.keys(jsonData[0]) : []
        const students: Student[] = []

        jsonData.forEach((row, index) => {
          const student: Record<string, unknown> = {}

          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = normalizeField(key)
            student[normalizedKey] = parseValue(key, value)
          })

          if (!student.name) {
            errors.push(`第 ${index + 2} 行缺少姓名字段`)
            return
          }

          students.push({
            id: generateStudentId(),
            name: String(student.name),
            studentId: student.studentId ? String(student.studentId) : undefined,
            gender: student.gender as 'male' | 'female' | undefined,
            height: student.height as number | undefined,
            score: student.score as number | undefined,
          })
        })

        resolve({ data: students, fields, errors })
      } catch (error) {
        resolve({
          data: [],
          fields: [],
          errors: [`解析Excel文件失败: ${error instanceof Error ? error.message : '未知错误'}`],
        })
      }
    }

    reader.onerror = () => {
      resolve({ data: [], fields: [], errors: ['读取文件失败'] })
    }

    reader.readAsArrayBuffer(file)
  })
}

export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const errors: string[] = []

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields || []
        const students: Student[] = []

        results.data.forEach((row, index: number) => {
          const typedRow = row as Record<string, unknown>
          const student: Record<string, unknown> = {}

          Object.entries(typedRow).forEach(([key, value]) => {
            const normalizedKey = normalizeField(key)
            student[normalizedKey] = parseValue(key, value)
          })

          if (!student.name) {
            errors.push(`第 ${index + 2} 行缺少姓名字段`)
            return
          }

          students.push({
            id: generateStudentId(),
            name: String(student.name),
            studentId: student.studentId ? String(student.studentId) : undefined,
            gender: student.gender as 'male' | 'female' | undefined,
            height: student.height as number | undefined,
            score: student.score as number | undefined,
          })
        })

        if (results.errors.length > 0) {
          results.errors.forEach((err) => {
            errors.push(`CSV解析错误: ${err.message}`)
          })
        }

        resolve({ data: students, fields, errors })
      },
      error: (error) => {
        resolve({
          data: [],
          fields: [],
          errors: [`解析CSV文件失败: ${error.message}`],
        })
      },
    })
  })
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file)
    case 'csv':
      return parseCsvFile(file)
    default:
      return {
        data: [],
        fields: [],
        errors: [`不支持的文件格式: ${extension}。请上传 .xlsx, .xls 或 .csv 文件。`],
      }
  }
}
