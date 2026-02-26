import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Student, StudentBase } from '@/types'
import { useSchemeStore } from './scheme'

export interface StudentWithSeat extends Student {
  seatId?: string
}

export const useStudentStore = defineStore('student', () => {
  const schemeStore = useSchemeStore()

  const students = ref<Student[]>([])

  function syncFromScheme(): void {
    const scheme = schemeStore.activeScheme
    if (scheme) {
      students.value = JSON.parse(JSON.stringify(scheme.students))
    } else {
      students.value = []
    }
  }

  function syncToScheme(): void {
    schemeStore.updateActiveSchemeStudents(students.value)
  }

  const seatedStudentIds = computed(() => {
    return new Set(students.value.filter((s) => (s as StudentWithSeat).seatId).map((s) => s.id))
  })

  const unseatedStudents = computed(() => {
    return students.value.filter((s) => !seatedStudentIds.value.has(s.id))
  })

  const seatedStudents = computed(() => {
    return students.value.filter((s) => seatedStudentIds.value.has(s.id))
  })

  const studentMap = computed(() => {
    const map = new Map<string, Student>()
    students.value.forEach((s) => map.set(s.id, s))
    return map
  })

  function generateId(): string {
    return `student-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  function addStudent(student: StudentBase): Student {
    const newStudent: Student = {
      id: generateId(),
      name: student.name,
      studentId: student.studentId,
      gender: student.gender,
      height: student.height,
      score: student.score,
      color: student.color,
    }
    students.value.push(newStudent)
    syncToScheme()
    return newStudent
  }

  function addStudents(newStudents: StudentBase[]): Student[] {
    const added: Student[] = []
    newStudents.forEach((student) => {
      const s = addStudent(student)
      added.push(s)
    })
    return added
  }

  function updateStudent(id: string, data: Partial<Student>): void {
    const index = students.value.findIndex((s) => s.id === id)
    if (index !== -1) {
      const existing = students.value[index]
      if (existing) {
        students.value[index] = {
          ...existing,
          ...data,
          id: existing.id,
          name: data.name ?? existing.name,
        }
        syncToScheme()
      }
    }
  }

  function setStudentColor(id: string, color: string): void {
    const student = students.value.find((s) => s.id === id)
    if (student) {
      student.color = color
      syncToScheme()
    }
  }

  function removeStudent(id: string): void {
    const index = students.value.findIndex((s) => s.id === id)
    if (index !== -1) {
      students.value.splice(index, 1)
      syncToScheme()
    }
  }

  function clearStudents(): void {
    students.value = []
    syncToScheme()
  }

  function clearAllSeated(): void {
    students.value.forEach((student) => {
      ;(student as StudentWithSeat).seatId = undefined
    })
    syncToScheme()
  }

  function setStudentSeated(studentId: string, seatId: string | undefined): void {
    const student = students.value.find((s) => s.id === studentId)
    if (student) {
      ;(student as StudentWithSeat).seatId = seatId
      syncToScheme()
    }
  }

  function getStudentById(id: string): Student | undefined {
    return studentMap.value.get(id)
  }

  function importStudents(data: Student[]): void {
    students.value = data.map((s) => ({
      ...s,
      id: s.id || generateId(),
    }))
    syncToScheme()
  }

  function $reset(): void {
    students.value = []
  }

  watch(
    () => schemeStore.activeSchemeId,
    () => {
      syncFromScheme()
    },
    { immediate: true },
  )

  return {
    students,
    seatedStudentIds,
    unseatedStudents,
    seatedStudents,
    studentMap,
    addStudent,
    addStudents,
    updateStudent,
    setStudentColor,
    removeStudent,
    clearStudents,
    clearAllSeated,
    setStudentSeated,
    getStudentById,
    importStudents,
    syncFromScheme,
    $reset,
  }
})
