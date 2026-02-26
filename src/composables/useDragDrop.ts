import { ref } from 'vue'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'

export type DragData = {
  type: 'student' | 'seat' | 'group-student'
  id: string
  studentId?: string
  groupId?: string
}

const isDragging = ref(false)
const draggedData = ref<DragData | null>(null)
const dragOverSeatId = ref<string | null>(null)
const dragOverGroupId = ref<string | null>(null)

export function useDragDrop() {
  const studentStore = useStudentStore()
  const seatStore = useSeatStore()
  const configStore = useConfigStore()
  const groupStore = useGroupStore()

  function handleDragStart(event: DragEvent, data: DragData) {
    isDragging.value = true
    draggedData.value = data

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/json', JSON.stringify(data))
    }

    const target = event.target as HTMLElement
    setTimeout(() => {
      target.classList.add('dragging')
    }, 0)
  }

  function handleDragEnd(event: DragEvent) {
    isDragging.value = false
    draggedData.value = null
    dragOverSeatId.value = null
    dragOverGroupId.value = null
    groupStore.setActiveGroup(null)

    const target = event.target as HTMLElement
    target.classList.remove('dragging')
  }

  function handleDragOver(event: DragEvent, seatId: string) {
    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    dragOverSeatId.value = seatId
  }

  function handleDragLeave() {
    dragOverSeatId.value = null
  }

  function handleDrop(event: DragEvent, targetSeatId: string) {
    event.preventDefault()
    dragOverSeatId.value = null

    if (!event.dataTransfer) return

    try {
      const dataStr = event.dataTransfer.getData('application/json')
      const data: DragData = JSON.parse(dataStr)

      const targetSeat = seatStore.getSeatById(targetSeatId)
      if (!targetSeat || targetSeat.isLocked) return

      if (data.type === 'student' || data.type === 'group-student') {
        const currentSeat = seatStore.seats.get(targetSeatId)
        if (currentSeat?.studentId && currentSeat.studentId !== data.id) {
          const currentStudentId = currentSeat.studentId
          studentStore.setStudentSeated(currentStudentId, undefined)
        }

        seatStore.seats.forEach((seat) => {
          if (seat.studentId === data.id) {
            seat.studentId = undefined
          }
        })

        seatStore.setStudentToSeat(targetSeatId, data.id)
        studentStore.setStudentSeated(data.id, targetSeatId)

        if (data.type === 'group-student' && data.groupId) {
          groupStore.removeStudentFromGroup(data.groupId, data.id)
        }

        saveAutoData()
      } else if (data.type === 'seat') {
        const sourceSeat = seatStore.getSeatById(data.id)
        if (!sourceSeat || sourceSeat.isLocked) return

        if (targetSeat.studentId) {
          seatStore.setStudentToSeat(data.id, targetSeat.studentId)
          studentStore.setStudentSeated(targetSeat.studentId, data.id)
        } else {
          seatStore.setStudentToSeat(data.id, undefined)
        }

        seatStore.setStudentToSeat(targetSeatId, data.studentId)
        if (data.studentId) {
          studentStore.setStudentSeated(data.studentId, targetSeatId)
        }

        saveAutoData()
      }
    } catch (e) {
      console.error('Drop error:', e)
    }
  }

  function handleDropToUnseated(event: DragEvent) {
    event.preventDefault()
    dragOverSeatId.value = null

    if (!event.dataTransfer) return

    try {
      const dataStr = event.dataTransfer.getData('application/json')
      const data: DragData = JSON.parse(dataStr)

      if (data.type === 'seat' && data.studentId) {
        seatStore.removeStudentFromSeat(data.studentId)
        studentStore.setStudentSeated(data.studentId, undefined)

        saveAutoData()
      } else if (data.type === 'group-student' && data.groupId) {
        groupStore.removeStudentFromGroup(data.groupId, data.id)
      }
    } catch (e) {
      console.error('Drop to unseated error:', e)
    }
  }

  function handleDragOverGroup(event: DragEvent, groupId: string) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    dragOverGroupId.value = groupId
  }

  function handleDragLeaveGroup() {
    dragOverGroupId.value = null
  }

  function handleDropToGroup(event: DragEvent, targetGroupId: string) {
    event.preventDefault()
    dragOverGroupId.value = null

    if (!event.dataTransfer) return

    try {
      const dataStr = event.dataTransfer.getData('application/json')
      const data: DragData = JSON.parse(dataStr)

      if (data.type === 'student') {
        groupStore.addStudentToGroup(targetGroupId, data.id)
      } else if (data.type === 'group-student') {
        if (data.groupId && data.groupId !== targetGroupId) {
          groupStore.moveStudentBetweenGroups(data.groupId, targetGroupId, data.id)
        }
      } else if (data.type === 'seat' && data.studentId) {
        groupStore.addStudentToGroup(targetGroupId, data.studentId)
        saveAutoData()
      }
    } catch (e) {
      console.error('Drop to group error:', e)
    }
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

  return {
    isDragging,
    draggedData,
    dragOverSeatId,
    dragOverGroupId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropToUnseated,
    handleDragOverGroup,
    handleDragLeaveGroup,
    handleDropToGroup,
  }
}
