<template>
  <div class="settings-panel">
    <div class="settings-section">
      <div class="section-header">
        <el-icon>
          <Grid />
        </el-icon>
        <span class="section-title">座位设置</span>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <span class="setting-label">行数</span>
          <el-input-number v-model="localSeatConfig.rows" :min="1" :max="20" size="small"
            @change="handleRowsColsChange" />
        </div>
        <div class="setting-item">
          <span class="setting-label">列数</span>
          <el-input-number v-model="localSeatConfig.cols" :min="1" :max="20" size="small"
            @change="handleRowsColsChange" />
        </div>
        <div class="setting-item">
          <span class="setting-label">座位宽度</span>
          <el-slider v-model="localSeatConfig.seatWidth" :min="60" :max="150" :step="10" size="small"
            @change="handleSizeChange" />
        </div>
        <div class="setting-item">
          <span class="setting-label">座位高度</span>
          <el-slider v-model="localSeatConfig.seatHeight" :min="40" :max="120" :step="10" size="small"
            @change="handleSizeChange" />
        </div>
        <div class="setting-item">
          <span class="setting-label">显示讲台</span>
          <el-switch v-model="localShowPodium" @change="handlePodiumChange" />
        </div>
      </div>
    </div>

    <el-divider />

    <div class="settings-section">
      <div class="section-header">
        <el-icon>
          <View />
        </el-icon>
        <span class="section-title">界面设置</span>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">悬浮显示学生信息</span>
            <span class="setting-desc">鼠标悬浮在学生卡片上时显示详细信息</span>
          </div>
          <el-switch v-model="localUISettings.showTooltipOnHover" @change="handleUISettingsChange" />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">显示性别图标</span>
            <span class="setting-desc">在学生卡片上显示性别标识图标</span>
          </div>
          <el-switch v-model="localUISettings.showGenderIcon" @change="handleUISettingsChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, View } from '@element-plus/icons-vue'
import { useSeatStore } from '@/stores/seat'
import { useStudentStore } from '@/stores/student'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import type { SeatConfig, UISettings } from '@/types'

const seatStore = useSeatStore()
const studentStore = useStudentStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()

const localSeatConfig = ref<SeatConfig>({ ...configStore.seatConfig })
const localShowPodium = ref(configStore.showPodium)
const localUISettings = ref<UISettings>({ ...configStore.uiSettings })

watch(() => configStore.seatConfig, (newConfig) => {
  localSeatConfig.value = { ...newConfig }
}, { deep: true })

watch(() => configStore.showPodium, (val) => {
  localShowPodium.value = val
})

watch(() => configStore.uiSettings, (newSettings) => {
  localUISettings.value = { ...newSettings }
}, { deep: true })

function handleRowsColsChange() {
  const removedStudentIds = seatStore.resizeSeats(localSeatConfig.value.rows, localSeatConfig.value.cols)

  if (removedStudentIds.length > 0) {
    studentStore.clearStudentsSeated(removedStudentIds)
    ElMessage.warning(`${removedStudentIds.length} 名学生因座位减少已退回待排坐区域`)
  }

  configStore.updateSeatConfig(localSeatConfig.value)
  saveData()
}

function handleSizeChange() {
  configStore.updateSeatConfig(localSeatConfig.value)
  saveData()
}

function saveData() {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  if (configStore.isDefaultScheme()) {
    configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
  } else {
    configStore.saveCurrentScheme(studentStore.students, seatsData, groupsData)
  }
}

function handlePodiumChange(val: boolean) {
  configStore.showPodium = val
}

function handleUISettingsChange() {
  configStore.updateUISettings(localUISettings.value)
}
</script>

<style scoped>
.settings-panel {
  padding: 0 4px;
}

.settings-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.section-header .el-icon {
  font-size: 18px;
  color: var(--primary-color);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
}

.section-content {
  padding-left: 26px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  margin-right: 16px;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
}

:deep(.el-slider) {
  width: 120px;
}

:deep(.el-input-number) {
  width: 100px;
}

:deep(.el-switch) {
  --el-switch-on-color: var(--primary-color);
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
