import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import type { Student, SmartArrangeRule } from '@/types'

export function useArrange() {
  const studentStore = useStudentStore()
  const seatStore = useSeatStore()
  const configStore = useConfigStore()
  const groupStore = useGroupStore()

  function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = result[i]
      result[i] = result[j] as T
      result[j] = temp as T
    }
    return result
  }

  function saveAutoData() {
    const seatsData = Array.from(seatStore.seats.values())
    const groupsData = groupStore.exportGroups()
    if (configStore.isDefaultScheme()) {
      configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
    } else {
      configStore.saveCurrentScheme(studentStore.students, seatsData, groupsData)
    }
  }

  function randomArrange(): void {
    const unseatedStudents = [...studentStore.unseatedStudents]
    const emptySeats = seatStore.emptySeats

    const shuffledStudents = shuffleArray(unseatedStudents)
    const shuffledSeats = shuffleArray(emptySeats)

    const count = Math.min(shuffledStudents.length, shuffledSeats.length)

    for (let i = 0; i < count; i++) {
      const student = shuffledStudents[i]
      const seat = shuffledSeats[i]
      if (student && seat) {
        seatStore.setStudentToSeat(seat.id, student.id)
        studentStore.setStudentSeated(student.id, seat.id)
      }
    }

    saveAutoData()
  }

  function smartArrange(rule: SmartArrangeRule): void {
    const unseatedStudents = [...studentStore.unseatedStudents]
    const emptySeats = seatStore.emptySeats

    let sortedStudents: Student[]

    switch (rule.type) {
      case 'height':
        sortedStudents = [...unseatedStudents].sort((a, b) => {
          const heightA = a.height ?? 0
          const heightB = b.height ?? 0
          return rule.ascending ? heightA - heightB : heightB - heightA
        })
        break
      case 'score':
        sortedStudents = [...unseatedStudents].sort((a, b) => {
          const scoreA = a.score ?? 0
          const scoreB = b.score ?? 0
          return rule.ascending ? scoreA - scoreB : scoreB - scoreA
        })
        break
      case 'gender':
        sortedStudents = [...unseatedStudents].sort((a, b) => {
          const genderA = a.gender === 'male' ? 1 : a.gender === 'female' ? 2 : 3
          const genderB = b.gender === 'male' ? 1 : b.gender === 'female' ? 2 : 3
          return rule.ascending ? genderA - genderB : genderB - genderA
        })
        break
      default:
        sortedStudents = unseatedStudents
    }

    const count = Math.min(sortedStudents.length, emptySeats.length)

    for (let i = 0; i < count; i++) {
      const student = sortedStudents[i]
      const seat = emptySeats[i]
      if (student && seat) {
        seatStore.setStudentToSeat(seat.id, student.id)
        studentStore.setStudentSeated(student.id, seat.id)
      }
    }

    saveAutoData()
  }

  function clearAllSeats(): void {
    seatStore.clearAllSeats()
    studentStore.students.forEach((student) => {
      studentStore.setStudentSeated(student.id, undefined)
    })

    saveAutoData()
  }

  return {
    randomArrange,
    smartArrange,
    clearAllSeats,
  }
}
