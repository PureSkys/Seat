<template>
  <div class="seat-grid-wrapper" ref="wrapperRef">
    <div class="seat-grid" ref="gridRef" :style="gridStyle" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
      @touchend="handleTouchEnd">
      <div class="grid-container" :style="containerStyle">
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

    <div v-if="showZoomControls" class="zoom-controls">
      <button class="zoom-btn" @click="zoomOut" :disabled="scale <= minScale">
        <el-icon>
          <ZoomOut />
        </el-icon>
      </button>
      <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
      <button class="zoom-btn" @click="zoomIn" :disabled="scale >= maxScale">
        <el-icon>
          <ZoomIn />
        </el-icon>
      </button>
      <button class="zoom-btn zoom-reset" @click="resetZoom">
        <el-icon>
          <RefreshRight />
        </el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Monitor, ZoomIn, ZoomOut, RefreshRight } from '@element-plus/icons-vue'
import SeatCell from './SeatCell.vue'
import { useSeatStore } from '@/stores/seat'
import { useStudentStore } from '@/stores/student'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import { useResponsive, isTouchDevice } from '@/composables'
import type { Seat } from '@/types'

const props = withDefaults(
  defineProps<{
    scale?: number
  }>(),
  {
    scale: 1
  }
)

const emit = defineEmits<{
  click: [seat: Seat]
  'scale-change': [scale: number]
}>()

const seatStore = useSeatStore()
const studentStore = useStudentStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()
const responsive = useResponsive()

const gridRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)

const seatGrid = computed(() => seatStore.seatGrid)
const showPodium = computed(() => configStore.showPodium)
const showStudentId = computed(() => configStore.exportConfig.showStudentId)
const config = computed(() => configStore.seatConfig)

const baseCellWidth = computed(() => configStore.seatConfig.seatWidth)
const baseCellHeight = computed(() => configStore.seatConfig.seatHeight)
const gapX = computed(() => configStore.seatConfig.gapX)

const minScale = 0.5
const maxScale = 1.5
const scaleStep = 0.1

const currentScale = ref(props.scale)
const isTouching = ref(false)
const touchStartDistance = ref(0)
const touchStartScale = ref(1)

const showZoomControls = computed(() => responsive.value.isMobile || responsive.value.isTablet)

const cellWidth = computed(() => {
  const base = responsive.value.isMobile ? 60 : responsive.value.isTablet ? 70 : baseCellWidth.value
  return base
})

const cellHeight = computed(() => {
  const base = responsive.value.isMobile ? 45 : responsive.value.isTablet ? 52 : baseCellHeight.value
  return base
})

const gridStyle = computed(() => ({
  transform: `scale(${currentScale.value})`,
  transformOrigin: 'top center'
}))

const containerStyle = computed(() => ({
  gap: responsive.value.isMobile ? '8px' : '12px'
}))

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

function zoomIn() {
  if (currentScale.value < maxScale) {
    currentScale.value = Math.min(maxScale, currentScale.value + scaleStep)
    emit('scale-change', currentScale.value)
  }
}

function zoomOut() {
  if (currentScale.value > minScale) {
    currentScale.value = Math.max(minScale, currentScale.value - scaleStep)
    emit('scale-change', currentScale.value)
  }
}

function resetZoom() {
  currentScale.value = 1
  emit('scale-change', currentScale.value)
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const touch0 = touches[0]
  const touch1 = touches[1]
  if (!touch0 || !touch1) return 0
  const dx = touch0.clientX - touch1.clientX
  const dy = touch0.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function handleTouchStart(event: TouchEvent) {
  if (!isTouchDevice()) return

  if (event.touches.length === 2) {
    isTouching.value = true
    touchStartDistance.value = getTouchDistance(event.touches)
    touchStartScale.value = currentScale.value
    event.preventDefault()
  }
}

function handleTouchMove(event: TouchEvent) {
  if (!isTouching.value || event.touches.length !== 2) return

  const currentDistance = getTouchDistance(event.touches)
  if (touchStartDistance.value === 0) return

  const scaleRatio = currentDistance / touchStartDistance.value
  const newScale = Math.min(maxScale, Math.max(minScale, touchStartScale.value * scaleRatio))

  currentScale.value = newScale
  emit('scale-change', currentScale.value)
  event.preventDefault()
}

function handleTouchEnd() {
  isTouching.value = false
}

function calculateInitialScale() {
  if (!wrapperRef.value || !gridRef.value) return

  if (responsive.value.isMobile) {
    const wrapperWidth = wrapperRef.value.clientWidth - 48
    const gridWidth = gridRef.value.scrollWidth
    const optimalScale = Math.min(1, wrapperWidth / gridWidth)
    currentScale.value = Math.max(minScale, optimalScale)
    emit('scale-change', currentScale.value)
  }
}

onMounted(() => {
  calculateInitialScale()
  window.addEventListener('resize', calculateInitialScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateInitialScale)
})

defineExpose({
  gridRef
})
</script>

<style scoped>
.seat-grid-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-overflow-scrolling: touch;
}

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
  transition: transform 0.1s ease-out;
  will-change: transform;
}

.grid-container {
  display: flex;
  flex-direction: column;
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

.zoom-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-card);
  padding: 8px 12px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  z-index: 100;
}

.zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.zoom-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: #fff;
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.zoom-value {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.zoom-reset {
  margin-left: 4px;
}

@media (max-width: 767px) {
  .seat-grid-wrapper {
    padding: 0;
  }

  .seat-grid {
    padding: 16px;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  .row-label {
    width: 40px;
    font-size: 11px;
    padding-right: 8px;
  }

  .row-label-spacer {
    width: 40px;
  }

  .col-label {
    font-size: 11px;
  }

  .podium {
    padding: 10px 32px;
    font-size: 12px;
    margin-top: 16px;
  }

  .podium .el-icon {
    font-size: 16px;
  }

  .zoom-controls {
    bottom: 16px;
    right: 16px;
    padding: 6px 10px;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
  }

  .zoom-value {
    font-size: 11px;
    min-width: 40px;
  }
}

@media (max-width: 575px) {
  .seat-grid {
    padding: 12px;
    border-radius: var(--radius-lg);
  }

  .zoom-controls {
    bottom: 12px;
    right: 12px;
    gap: 4px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .podium:hover {
    transform: none;
  }
}
</style>
