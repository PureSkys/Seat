<template>
  <div class="seat-config">
    <el-form label-width="80px" size="small">
      <el-form-item label="行数">
        <el-input-number v-model="localConfig.rows" :min="1" :max="20" @change="handleConfigChange" />
      </el-form-item>
      <el-form-item label="列数">
        <el-input-number v-model="localConfig.cols" :min="1" :max="20" @change="handleConfigChange" />
      </el-form-item>
      <el-form-item label="座位宽度">
        <el-slider v-model="localConfig.seatWidth" :min="60" :max="150" :step="10" @change="handleConfigChange" />
      </el-form-item>
      <el-form-item label="座位高度">
        <el-slider v-model="localConfig.seatHeight" :min="40" :max="120" :step="10" @change="handleConfigChange" />
      </el-form-item>
      <el-form-item label="显示讲台">
        <el-switch v-model="showPodium" @change="handlePodiumChange" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSeatStore } from '@/stores/seat'
import { useStudentStore } from '@/stores/student'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import type { SeatConfig } from '@/types'

const seatStore = useSeatStore()
const studentStore = useStudentStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()

const localConfig = ref<SeatConfig>({ ...configStore.seatConfig })
const showPodium = ref(configStore.showPodium)

watch(() => configStore.seatConfig, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

watch(() => configStore.showPodium, (val) => {
  showPodium.value = val
})

function handleConfigChange() {
  studentStore.clearAllSeated()
  seatStore.initSeats(localConfig.value.rows, localConfig.value.cols)
  configStore.updateSeatConfig(localConfig.value)

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
</script>

<style scoped>
.seat-config {
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 13px;
}

:deep(.el-slider) {
  width: 140px;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-switch) {
  --el-switch-on-color: var(--primary-color);
}
</style>
