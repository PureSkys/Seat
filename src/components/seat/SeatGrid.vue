<template>
  <div class="seat-grid" ref="gridRef">
    <div class="grid-container">
      <div class="header-row">
        <div class="row-label-spacer"></div>
        <template v-for="col in config.cols" :key="col">
          <div class="col-label" :style="colLabelStyle">{{ col }}列</div>
          <div v-if="col < config.cols" class="col-gap" :style="{ width: gapX + 'px' }"></div>
        </template>
      </div>
      <div v-for="(row, rowIndex) in seatGrid" :key="rowIndex" class="seat-row">
        <div class="row-label">{{ config.rows - rowIndex }}排</div>
        <template v-for="(seat, colIndex) in row" :key="seat.id">
          <SeatCell :seat="seat" :student="getStudent(seat.studentId)" :show-student-id="showStudentId"
            :width="cellWidth" :height="cellHeight" @click="handleSeatClick" />
          <div v-if="colIndex < row.length - 1" class="col-gap" :style="{ width: gapX + 'px' }"></div>
        </template>
      </div>
    </div>

    <div v-if="showPodium" class="podium">
      <el-icon>
        <Monitor />
      </el-icon>
      <span>讲台</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Monitor } from '@element-plus/icons-vue'
import SeatCell from './SeatCell.vue'
import { useSeatStore } from '@/stores/seat'
import { useStudentStore } from '@/stores/student'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import type { Seat } from '@/types'

const seatStore = useSeatStore()
const studentStore = useStudentStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()

const gridRef = ref<HTMLElement | null>(null)

const seatGrid = computed(() => seatStore.seatGrid)
const showPodium = computed(() => configStore.showPodium)
const showStudentId = computed(() => configStore.exportConfig.showStudentId)
const config = computed(() => configStore.seatConfig)

const cellWidth = computed(() => configStore.seatConfig.seatWidth)
const cellHeight = computed(() => configStore.seatConfig.seatHeight)
const gapX = computed(() => configStore.seatConfig.gapX)

const colLabelStyle = computed(() => ({
  width: `${cellWidth.value}px`,
  height: '20px',
  border: '2px solid transparent',
  borderRadius: '8px',
  boxSizing: 'border-box' as const
}))

function getStudent(studentId?: string) {
  if (!studentId) return undefined
  return studentStore.getStudentById(studentId)
}

function handleSeatClick(seat: Seat) {
  if (!seat.studentId) {
    seatStore.toggleSeatLock(seat.id)
    const seatsData = Array.from(seatStore.seats.values())
    const groupsData = groupStore.exportGroups()
    configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
  }
}

defineExpose({
  gridRef
})
</script>

<style scoped>
.seat-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  position: relative;
  z-index: 1;
  margin: auto;
}

.grid-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-row,
.seat-row {
  display: flex;
  align-items: center;
}

.row-label-spacer,
.row-label {
  width: 52px;
  flex-shrink: 0;
}

.row-label {
  font-size: 13px;
  color: var(--text-muted);
  text-align: right;
  padding-right: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.col-label {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.col-gap {
  flex-shrink: 0;
}

.podium {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 48px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: #fff;
  border-radius: var(--radius-xl);
  margin-top: 24px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all var(--transition-base);
  letter-spacing: -0.2px;
}

.podium:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.podium .el-icon {
  font-size: 20px;
}
</style>
