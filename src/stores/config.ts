import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { SeatConfig, ExportConfig } from '@/types'
import { DEFAULT_CONFIG, DEFAULT_EXPORT_CONFIG } from '@/types/config'
import { useSchemeStore } from './scheme'

export const useConfigStore = defineStore('config', () => {
  const schemeStore = useSchemeStore()

  const seatConfig = computed<SeatConfig>({
    get: () => {
      return schemeStore.activeScheme?.config?.seat || DEFAULT_CONFIG
    },
    set: (value) => {
      schemeStore.updateActiveSchemeConfig({ seat: value })
    },
  })

  const exportConfig = computed<ExportConfig>({
    get: () => {
      return schemeStore.activeScheme?.config?.export || DEFAULT_EXPORT_CONFIG
    },
    set: (value) => {
      schemeStore.updateActiveSchemeConfig({ export: value })
    },
  })

  const showPodium = computed<boolean>({
    get: () => {
      return schemeStore.activeScheme?.config?.showPodium ?? true
    },
    set: (value) => {
      schemeStore.updateActiveSchemeConfig({ showPodium: value })
    },
  })

  const currentSchemeId = computed(() => schemeStore.activeSchemeId)
  const savedSchemes = computed(() => schemeStore.schemes)

  function updateSeatConfig(config: Partial<SeatConfig>): void {
    schemeStore.updateActiveSchemeConfig({
      seat: { ...seatConfig.value, ...config },
    })
  }

  function updateExportConfig(config: Partial<ExportConfig>): void {
    schemeStore.updateActiveSchemeConfig({
      export: { ...exportConfig.value, ...config },
    })
  }

  function isDefaultScheme(): boolean {
    return schemeStore.activeScheme?.name === '默认方案'
  }

  function saveCurrentScheme(
    students: unknown[],
    seatsData: unknown[],
    groupsData?: unknown[],
  ): void {
    schemeStore.saveCurrentData(
      students as never[],
      seatsData as never[],
      (groupsData || []) as never[],
    )
  }

  function saveAutoSaveData(
    students: unknown[],
    seatsData: unknown[],
    groupsData: unknown[],
  ): boolean {
    schemeStore.saveCurrentData(students as never[], seatsData as never[], groupsData as never[])
    return true
  }

  return {
    seatConfig,
    exportConfig,
    showPodium,
    savedSchemes,
    currentSchemeId,
    updateSeatConfig,
    updateExportConfig,
    isDefaultScheme,
    saveCurrentScheme,
    saveAutoSaveData,
  }
})
