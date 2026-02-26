import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { StudentGroup, GroupHistoryAction } from '@/types'
import { createEmptyGroup, GROUP_COLORS } from '@/types'
import { useSchemeStore } from './scheme'

const MAX_HISTORY_SIZE = 50

export const useGroupStore = defineStore('group', () => {
  const schemeStore = useSchemeStore()

  const groups = ref<StudentGroup[]>([])
  const activeGroupId = ref<string | null>(null)
  const history = ref<GroupHistoryAction[]>([])
  const historyIndex = ref(-1)

  function syncFromScheme(): void {
    const scheme = schemeStore.activeScheme
    if (scheme) {
      groups.value = JSON.parse(JSON.stringify(scheme.groups || []))
      activeGroupId.value = null
    } else {
      groups.value = []
      activeGroupId.value = null
    }
    history.value = []
    historyIndex.value = -1
  }

  function syncToScheme(): void {
    schemeStore.updateActiveSchemeGroups(groups.value)
  }

  const activeGroup = computed(() => {
    if (!activeGroupId.value) return null
    return groups.value.find((g) => g.id === activeGroupId.value) || null
  })

  const groupedStudentIds = computed(() => {
    const ids = new Set<string>()
    groups.value.forEach((group) => {
      group.studentIds.forEach((id) => ids.add(id))
    })
    return ids
  })

  const ungroupedCount = computed(() => {
    return 0
  })

  const totalGroups = computed(() => groups.value.length)

  function saveHistory(type: GroupHistoryAction['type'], previousState: StudentGroup[]) {
    const action: GroupHistoryAction = {
      type,
      previousState: JSON.parse(JSON.stringify(previousState)),
      timestamp: Date.now(),
    }

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(action)

    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  function undo(): boolean {
    if (historyIndex.value < 0) return false

    const action = history.value[historyIndex.value]
    if (action?.previousState) {
      groups.value = JSON.parse(JSON.stringify(action.previousState))
      historyIndex.value--
      syncToScheme()
      return true
    }
    return false
  }

  function redo(): boolean {
    if (historyIndex.value >= history.value.length - 1) return false

    historyIndex.value++
    const action = history.value[historyIndex.value]
    if (action?.previousState) {
      groups.value = JSON.parse(JSON.stringify(action.previousState))
      historyIndex.value--
      syncToScheme()
      return true
    }
    historyIndex.value--
    return false
  }

  function canUndo(): boolean {
    return historyIndex.value >= 0
  }

  function canRedo(): boolean {
    return historyIndex.value < history.value.length - 1
  }

  function createGroup(name?: string): StudentGroup {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const groupNumber = groups.value.length + 1
    const colorIndex = groups.value.length % GROUP_COLORS.length
    const group = createEmptyGroup(name || `分组 ${groupNumber}`, GROUP_COLORS[colorIndex])
    groups.value.push(group)
    activeGroupId.value = group.id
    saveHistory('create', previousState)
    syncToScheme()
    return group
  }

  function deleteGroup(groupId: string): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const index = groups.value.findIndex((g) => g.id === groupId)
    if (index !== -1) {
      groups.value.splice(index, 1)
      if (activeGroupId.value === groupId) {
        activeGroupId.value = groups.value.length > 0 ? groups.value[0]?.id || null : null
      }
      saveHistory('delete', previousState)
      syncToScheme()
    }
  }

  function renameGroup(groupId: string, newName: string): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.name = newName
      group.updatedAt = Date.now()
      saveHistory('rename', previousState)
      syncToScheme()
    }
  }

  function setGroupColor(groupId: string, color: string): void {
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      group.color = color
      group.updatedAt = Date.now()
      syncToScheme()
    }
  }

  function addStudentToGroup(groupId: string, studentId: string): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))

    groups.value.forEach((g) => {
      const index = g.studentIds.indexOf(studentId)
      if (index !== -1) {
        g.studentIds.splice(index, 1)
        g.updatedAt = Date.now()
      }
    })

    const group = groups.value.find((g) => g.id === groupId)
    if (group && !group.studentIds.includes(studentId)) {
      group.studentIds.push(studentId)
      group.updatedAt = Date.now()
      saveHistory('add_student', previousState)
      syncToScheme()
    }
  }

  function removeStudentFromGroup(groupId: string, studentId: string): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const group = groups.value.find((g) => g.id === groupId)
    if (group) {
      const index = group.studentIds.indexOf(studentId)
      if (index !== -1) {
        group.studentIds.splice(index, 1)
        group.updatedAt = Date.now()
        saveHistory('remove_student', previousState)
        syncToScheme()
      }
    }
  }

  function clearGroupStudents(groupId: string): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const group = groups.value.find((g) => g.id === groupId)
    if (group && group.studentIds.length > 0) {
      group.studentIds = []
      group.updatedAt = Date.now()
      saveHistory('clear_students', previousState)
      syncToScheme()
    }
  }

  function moveStudentBetweenGroups(
    fromGroupId: string,
    toGroupId: string,
    studentId: string,
  ): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    const fromGroup = groups.value.find((g) => g.id === fromGroupId)
    const toGroup = groups.value.find((g) => g.id === toGroupId)

    if (fromGroup && toGroup) {
      const index = fromGroup.studentIds.indexOf(studentId)
      if (index !== -1) {
        fromGroup.studentIds.splice(index, 1)
        fromGroup.updatedAt = Date.now()
      }

      if (!toGroup.studentIds.includes(studentId)) {
        toGroup.studentIds.push(studentId)
        toGroup.updatedAt = Date.now()
      }

      saveHistory('move_student', previousState)
      syncToScheme()
    }
  }

  function removeStudentFromAllGroups(studentId: string): void {
    let changed = false
    groups.value.forEach((group) => {
      const index = group.studentIds.indexOf(studentId)
      if (index !== -1) {
        group.studentIds.splice(index, 1)
        group.updatedAt = Date.now()
        changed = true
      }
    })
    if (changed) {
      syncToScheme()
    }
  }

  function getGroupByStudentId(studentId: string): StudentGroup | undefined {
    return groups.value.find((g) => g.studentIds.includes(studentId))
  }

  function clearAllGroups(): void {
    const previousState = JSON.parse(JSON.stringify(groups.value))
    groups.value = []
    activeGroupId.value = null
    saveHistory('delete', previousState)
    syncToScheme()
  }

  function setActiveGroup(groupId: string | null): void {
    activeGroupId.value = groupId
  }

  function importGroups(data: StudentGroup[]): void {
    groups.value = data.map((g) => ({
      ...g,
      id: g.id || `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }))
    if (groups.value.length > 0 && groups.value[0]) {
      activeGroupId.value = groups.value[0].id
    }
    history.value = []
    historyIndex.value = -1
    syncToScheme()
  }

  function exportGroups(): StudentGroup[] {
    return JSON.parse(JSON.stringify(groups.value))
  }

  function clearGroups(): void {
    groups.value = []
    activeGroupId.value = null
    history.value = []
    historyIndex.value = -1
  }

  function $reset(): void {
    groups.value = []
    activeGroupId.value = null
    history.value = []
    historyIndex.value = -1
  }

  watch(
    () => schemeStore.activeSchemeId,
    () => {
      syncFromScheme()
    },
    { immediate: true },
  )

  return {
    groups,
    activeGroupId,
    activeGroup,
    groupedStudentIds,
    ungroupedCount,
    totalGroups,
    createGroup,
    deleteGroup,
    renameGroup,
    setGroupColor,
    addStudentToGroup,
    removeStudentFromGroup,
    clearGroupStudents,
    moveStudentBetweenGroups,
    removeStudentFromAllGroups,
    getGroupByStudentId,
    clearAllGroups,
    setActiveGroup,
    undo,
    redo,
    canUndo,
    canRedo,
    importGroups,
    exportGroups,
    clearGroups,
    syncFromScheme,
    $reset,
  }
})
