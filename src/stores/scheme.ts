import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  DataScheme,
  SchemeConfig,
  SchemeOperationResult,
  SchemeStorageData,
  Student,
  Seat,
  StudentGroup,
} from '@/types'
import {
  SCHEME_STORAGE_KEY,
  SCHEME_VERSION,
  generateSchemeId,
  createEmptyScheme,
  cloneScheme,
} from '@/types/scheme'

const MAX_STORAGE_SIZE_MB = 4

function safeJsonStringify(data: unknown): string | null {
  try {
    return JSON.stringify(data)
  } catch (e) {
    console.error('JSON序列化失败:', e)
    return null
  }
}

function safeJsonParse<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T
  } catch (e) {
    console.error('JSON解析失败:', e)
    return null
  }
}

function getDataSizeInMB(data: string): number {
  return new Blob([data]).size / (1024 * 1024)
}

function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export const useSchemeStore = defineStore('scheme', () => {
  const schemes = ref<DataScheme[]>([])
  const activeSchemeId = ref<string | null>(null)
  const isInitialized = ref(false)
  const isSwitching = ref(false)

  const activeScheme = computed(() => {
    if (!activeSchemeId.value) return null
    return schemes.value.find((s) => s.id === activeSchemeId.value) || null
  })

  const hasSchemes = computed(() => schemes.value.length > 0)
  const schemeCount = computed(() => schemes.value.length)

  function loadFromStorage(): void {
    if (!isStorageAvailable()) {
      console.warn('localStorage 不可用')
      return
    }

    const data = localStorage.getItem(SCHEME_STORAGE_KEY)
    if (data) {
      const parsed = safeJsonParse<SchemeStorageData>(data)
      if (parsed && Array.isArray(parsed.schemes)) {
        schemes.value = parsed.schemes
        activeSchemeId.value = parsed.activeSchemeId
      }
    }

    if (schemes.value.length === 0) {
      const defaultScheme = createEmptyScheme('默认方案')
      schemes.value.push(defaultScheme)
      activeSchemeId.value = defaultScheme.id
      saveToStorage()
    }

    if (!activeSchemeId.value && schemes.value.length > 0) {
      activeSchemeId.value = schemes.value[0]?.id || null
    }

    isInitialized.value = true
  }

  function saveToStorage(): boolean {
    const storageData: SchemeStorageData = {
      schemes: schemes.value,
      activeSchemeId: activeSchemeId.value,
      version: SCHEME_VERSION,
    }

    const serialized = safeJsonStringify(storageData)
    if (!serialized) {
      console.error('方案数据序列化失败')
      return false
    }

    const sizeMB = getDataSizeInMB(serialized)
    if (sizeMB > MAX_STORAGE_SIZE_MB) {
      console.warn(`方案数据过大 (${sizeMB.toFixed(2)}MB)，建议删除一些旧方案`)
    }

    try {
      localStorage.setItem(SCHEME_STORAGE_KEY, serialized)
      return true
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('存储空间已满，无法保存方案')
      } else {
        console.error('保存方案失败:', e)
      }
      return false
    }
  }

  function createScheme(name: string, description?: string): SchemeOperationResult {
    const newScheme = createEmptyScheme(name, description)
    schemes.value.push(newScheme)
    saveToStorage()
    return {
      success: true,
      message: '方案创建成功',
      data: newScheme,
    }
  }

  function deleteScheme(id: string): SchemeOperationResult {
    const index = schemes.value.findIndex((s) => s.id === id)
    if (index === -1) {
      return { success: false, message: '方案不存在' }
    }

    if (schemes.value.length === 1) {
      return { success: false, message: '无法删除最后一个方案' }
    }

    const deletedScheme = schemes.value[index]
    schemes.value.splice(index, 1)

    if (activeSchemeId.value === id) {
      activeSchemeId.value = schemes.value[0]?.id || null
    }

    saveToStorage()
    return {
      success: true,
      message: '方案删除成功',
      data: deletedScheme,
    }
  }

  function renameScheme(id: string, newName: string): SchemeOperationResult {
    const scheme = schemes.value.find((s) => s.id === id)
    if (!scheme) {
      return { success: false, message: '方案不存在' }
    }

    scheme.name = newName
    scheme.updatedAt = new Date().toISOString()
    saveToStorage()
    return {
      success: true,
      message: '方案重命名成功',
      data: scheme,
    }
  }

  function updateSchemeDescription(id: string, description: string): SchemeOperationResult {
    const scheme = schemes.value.find((s) => s.id === id)
    if (!scheme) {
      return { success: false, message: '方案不存在' }
    }

    scheme.description = description
    scheme.updatedAt = new Date().toISOString()
    saveToStorage()
    return {
      success: true,
      message: '方案描述更新成功',
      data: scheme,
    }
  }

  function duplicateScheme(id: string, newName?: string): SchemeOperationResult {
    const scheme = schemes.value.find((s) => s.id === id)
    if (!scheme) {
      return { success: false, message: '方案不存在' }
    }

    const newScheme = cloneScheme(scheme, newName)
    schemes.value.push(newScheme)
    saveToStorage()
    return {
      success: true,
      message: '方案复制成功',
      data: newScheme,
    }
  }

  function switchScheme(id: string): SchemeOperationResult {
    const scheme = schemes.value.find((s) => s.id === id)
    if (!scheme) {
      return { success: false, message: '方案不存在' }
    }

    isSwitching.value = true
    activeSchemeId.value = id
    saveToStorage()

    setTimeout(() => {
      isSwitching.value = false
    }, 100)

    return {
      success: true,
      message: `已切换到方案: ${scheme.name}`,
      data: scheme,
    }
  }

  function getScheme(id: string): DataScheme | undefined {
    return schemes.value.find((s) => s.id === id)
  }

  function updateActiveSchemeConfig(config: Partial<SchemeConfig>): void {
    if (!activeScheme.value) return

    activeScheme.value.config = {
      ...activeScheme.value.config,
      ...config,
    }
    activeScheme.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function updateActiveSchemeStudents(students: Student[]): void {
    if (!activeScheme.value) return

    activeScheme.value.students = JSON.parse(JSON.stringify(students))
    activeScheme.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function updateActiveSchemeSeats(seats: Seat[]): void {
    if (!activeScheme.value) return

    activeScheme.value.seats = JSON.parse(JSON.stringify(seats))
    activeScheme.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function updateActiveSchemeGroups(groups: StudentGroup[]): void {
    if (!activeScheme.value) return

    activeScheme.value.groups = JSON.parse(JSON.stringify(groups))
    activeScheme.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function saveCurrentData(students: Student[], seats: Seat[], groups: StudentGroup[]): void {
    if (!activeScheme.value) return

    activeScheme.value.students = JSON.parse(JSON.stringify(students))
    activeScheme.value.seats = JSON.parse(JSON.stringify(seats))
    activeScheme.value.groups = JSON.parse(JSON.stringify(groups))
    activeScheme.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function exportScheme(id: string): string | null {
    const scheme = schemes.value.find((s) => s.id === id)
    if (!scheme) return null

    return safeJsonStringify(scheme)
  }

  function importScheme(jsonData: string): SchemeOperationResult {
    const scheme = safeJsonParse<DataScheme>(jsonData)
    if (!scheme) {
      return { success: false, message: '无效的方案数据格式' }
    }

    scheme.id = generateSchemeId()
    scheme.createdAt = new Date().toISOString()
    scheme.updatedAt = new Date().toISOString()
    scheme.version = SCHEME_VERSION

    schemes.value.push(scheme)
    saveToStorage()

    return {
      success: true,
      message: '方案导入成功',
      data: scheme,
    }
  }

  function getStorageUsage(): { used: number; available: boolean } {
    if (!isStorageAvailable()) {
      return { used: 0, available: false }
    }

    const data = localStorage.getItem(SCHEME_STORAGE_KEY)
    if (!data) {
      return { used: 0, available: true }
    }

    return {
      used: getDataSizeInMB(data),
      available: true,
    }
  }

  function $reset(): void {
    const defaultScheme = createEmptyScheme('默认方案')
    schemes.value = [defaultScheme]
    activeSchemeId.value = defaultScheme.id
    saveToStorage()
  }

  loadFromStorage()

  watch(
    [schemes, activeSchemeId],
    () => {
      if (isInitialized.value) {
        saveToStorage()
      }
    },
    { deep: true },
  )

  return {
    schemes,
    activeSchemeId,
    activeScheme,
    isInitialized,
    isSwitching,
    hasSchemes,
    schemeCount,
    createScheme,
    deleteScheme,
    renameScheme,
    updateSchemeDescription,
    duplicateScheme,
    switchScheme,
    getScheme,
    updateActiveSchemeConfig,
    updateActiveSchemeStudents,
    updateActiveSchemeSeats,
    updateActiveSchemeGroups,
    saveCurrentData,
    exportScheme,
    importScheme,
    getStorageUsage,
    saveToStorage,
    loadFromStorage,
    $reset,
  }
})
