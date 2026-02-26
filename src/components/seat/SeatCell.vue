<template>
  <div class="seat-cell" :class="{
    'is-occupied': !!student,
    'is-locked': seat.isLocked,
    'is-drag-over': isDragOver,
    'is-dragging': isDragging,
    'is-touching': isTouching
  }" :style="cellStyle" :draggable="!!student && !seat.isLocked" @dragstart="handleDragStart" @dragend="handleDragEnd"
    @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop" @click="handleClick"
    @contextmenu.prevent="handleContextMenu" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <div v-if="seat.isLocked" class="lock-icon">
      <el-icon>
        <Lock />
      </el-icon>
    </div>
    <template v-else-if="student">
      <el-tooltip placement="top" :show-after="500" :disabled="isDragging || isTouchDevice">
        <template #content>
          <div class="student-tooltip">
            <div><strong>{{ student.name }}</strong></div>
            <div v-if="student.studentId">学号: {{ student.studentId }}</div>
            <div v-if="student.gender">性别: {{ student.gender === 'male' ? '男' : '女' }}</div>
            <div v-if="student.height">身高: {{ student.height }}cm</div>
            <div v-if="student.score">成绩: {{ student.score }}</div>
          </div>
        </template>
        <div class="student-info">
          <div class="student-name">{{ student.name }}</div>
          <div v-if="showStudentId && student.studentId" class="student-id">
            {{ student.studentId }}
          </div>
        </div>
      </el-tooltip>
    </template>
    <template v-else>
      <div class="empty-seat"></div>
    </template>
  </div>

  <el-dropdown ref="colorDropdownRef" trigger="contextmenu" :teleported="false" @command="handleColorSelect">
    <span></span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="">默认颜色</el-dropdown-item>
        <el-dropdown-item v-for="color in studentColors" :key="color" :command="color">
          <span class="color-option" :style="{ background: color }"></span>
          {{ color }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import type { Seat, Student } from '@/types'
import { useDragDrop, isTouchDevice } from '@/composables'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import { STUDENT_COLORS } from '@/types'

const props = defineProps<{
  seat: Seat
  student?: Student
  showStudentId?: boolean
  width?: number
  height?: number
}>()

const emit = defineEmits<{
  click: [seat: Seat]
}>()

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()
const studentColors = STUDENT_COLORS

const {
  handleDragStart: dragStart,
  handleDragEnd: dragEnd,
  handleDragOver: dragOver,
  handleDragLeave: dragLeave,
  handleDrop: drop,
  dragOverSeatId,
  isDragging
} = useDragDrop()

const colorDropdownRef = ref()
const contextMenuStudentId = ref<string | null>(null)
const isTouching = ref(false)
const touchTimeout = ref<number | null>(null)

const isDragOver = computed(() => dragOverSeatId.value === props.seat.id)

const cellStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${props.width || 80}px`,
    height: `${props.height || 60}px`,
    boxSizing: 'border-box',
    minWidth: `${Math.min(44, props.width || 80)}px`,
    minHeight: `${Math.min(44, props.height || 60)}px`
  }
  if (props.student?.color && !props.seat.isLocked) {
    style.background = props.student.color
    style.borderColor = props.student.color
    style.color = '#fff'
  }
  return style
})

function handleDragStart(event: DragEvent) {
  if (props.student && !props.seat.isLocked) {
    dragStart(event, {
      type: 'seat',
      id: props.seat.id,
      studentId: props.student.id
    })
  }
}

function handleDragEnd(event: DragEvent) {
  dragEnd(event)
}

function handleDragOver(event: DragEvent) {
  if (!props.seat.isLocked) {
    dragOver(event, props.seat.id)
  }
}

function handleDragLeave() {
  dragLeave()
}

function handleDrop(event: DragEvent) {
  drop(event, props.seat.id)
}

function handleClick() {
  emit('click', props.seat)
}

function handleContextMenu() {
  if (props.student) {
    contextMenuStudentId.value = props.student.id
    nextTick(() => {
      const dropdown = colorDropdownRef.value
      if (dropdown) {
        dropdown.handleOpen()
      }
    })
  }
}

function handleTouchStart() {
  isTouching.value = true
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value)
  }
}

function handleTouchEnd() {
  if (touchTimeout.value) {
    clearTimeout(touchTimeout.value)
  }
  touchTimeout.value = window.setTimeout(() => {
    isTouching.value = false
  }, 150)
}

function handleColorSelect(color: string) {
  if (contextMenuStudentId.value) {
    studentStore.setStudentColor(contextMenuStudentId.value, color)
    saveAutoData()
  }
  contextMenuStudentId.value = null
}

function saveAutoData() {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
}
</script>

<style scoped>
.seat-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: var(--shadow-card);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.seat-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.seat-cell:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.seat-cell:hover::before {
  opacity: 1;
}

.seat-cell.is-occupied {
  cursor: grab;
}

.seat-cell.is-occupied:active {
  cursor: grabbing;
}

.seat-cell.is-locked {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  cursor: pointer;
}

.seat-cell.is-locked::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg,
      transparent,
      transparent 4px,
      rgba(0, 0, 0, 0.02) 4px,
      rgba(0, 0, 0, 0.02) 8px);
  pointer-events: none;
}

.seat-cell.is-locked:hover {
  border-color: var(--warning-color);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.2);
}

.seat-cell.is-drag-over {
  border-color: var(--success-color);
  border-style: dashed;
  border-width: 3px;
  background: var(--success-bg);
  transform: scale(1.08);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  animation: pulse-success 1s ease-in-out infinite;
}

@keyframes pulse-success {

  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.05);
  }
}

.seat-cell.is-dragging {
  opacity: 0.5;
  transform: scale(0.95);
  box-shadow: var(--shadow-lg);
}

.seat-cell.is-touching {
  transform: scale(0.96);
  box-shadow: var(--shadow-md);
}

.lock-icon {
  color: var(--warning-color);
  animation: lock-pulse 2s ease-in-out infinite;
}

@keyframes lock-pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.student-info {
  text-align: center;
  padding: 4px 2px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.student-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  letter-spacing: -0.2px;
  box-sizing: border-box;
}

.student-id {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: 500;
}

.empty-seat {
  width: 100%;
  height: 100%;
  position: relative;
}

.empty-seat::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-sm);
  opacity: 0.4;
}

.student-tooltip {
  padding: 8px 0;
  font-size: 13px;
  line-height: 1.8;
}

.student-tooltip div {
  padding: 3px 0;
}

.student-tooltip div:first-child {
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 6px;
}

.color-option {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  margin-right: 10px;
  vertical-align: middle;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

@media (max-width: 767px) {
  .seat-cell {
    border-radius: var(--radius-md);
  }

  .student-name {
    font-size: 12px;
  }

  .student-id {
    font-size: 10px;
  }

  .empty-seat::before {
    inset: 6px;
  }

  .lock-icon {
    font-size: 14px;
  }
}

@media (max-width: 575px) {
  .seat-cell {
    border-radius: var(--radius-sm);
    border-width: 1.5px;
  }

  .student-info {
    padding: 2px 1px;
  }

  .student-name {
    font-size: 11px;
  }

  .student-id {
    font-size: 9px;
    margin-top: 1px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .seat-cell:hover {
    transform: none;
    border-color: var(--border-light);
    box-shadow: var(--shadow-card);
  }

  .seat-cell:hover::before {
    opacity: 0;
  }

  .seat-cell.is-locked:hover {
    border-color: var(--border-color);
    box-shadow: var(--shadow-card);
  }
}
</style>
