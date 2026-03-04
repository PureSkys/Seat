<template>
  <div class="seat-cell-wrapper" ref="wrapperRef" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="seat-cell" :class="{
      'is-occupied': !!student,
      'is-locked': seat.isLocked,
      'is-drag-over': isDragOver,
      'is-dragging': isDragging,
      'is-touching': isTouching
    }" :style="cellStyle" :draggable="!!student && !seat.isLocked" @dragstart="handleDragStart"
      @dragend="handleDragEnd" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
      @click="handleClick" @contextmenu.prevent="handleContextMenu" @touchstart="handleTouchStart"
      @touchend="handleTouchEnd">
      <div v-if="seat.isLocked" class="lock-icon">
        <el-icon>
          <Lock />
        </el-icon>
      </div>
      <template v-else-if="student">
        <GenderIcon v-if="showGenderIcon" :gender="student.gender" size="small" class="gender-badge" />
        <div class="student-info">
          <div class="student-name">{{ student.name }}</div>
          <div v-if="showStudentId && student.studentId" class="student-id">
            {{ student.studentId }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="empty-seat"></div>
      </template>
    </div>
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div v-if="showTooltip && student" class="student-tooltip-panel" :style="tooltipStyle">
          <div class="tooltip-header">
            <div class="tooltip-avatar" :class="student.gender">
              {{ student.name.charAt(0) }}
            </div>
            <div class="tooltip-title">
              <div class="tooltip-name">{{ student.name }}</div>
              <div v-if="student.studentId" class="tooltip-id">{{ student.studentId }}</div>
            </div>
          </div>
          <div class="tooltip-body">
            <div v-if="student.gender" class="tooltip-row">
              <span class="tooltip-label">性别</span>
              <span class="tooltip-value">{{ student.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div v-if="student.height" class="tooltip-row">
              <span class="tooltip-label">身高</span>
              <span class="tooltip-value">{{ student.height }} cm</span>
            </div>
            <div v-if="student.score !== undefined && student.score !== null" class="tooltip-row">
              <span class="tooltip-label">成绩</span>
              <span class="tooltip-value">{{ student.score }}</span>
            </div>
            <div v-if="student.color" class="tooltip-row">
              <span class="tooltip-label">标记</span>
              <span class="tooltip-value color-tag" :style="{ background: student.color }"></span>
            </div>
            <div v-if="student.remark" class="tooltip-row tooltip-remark">
              <span class="tooltip-label">备注</span>
              <span class="tooltip-value">{{ student.remark }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <el-dropdown ref="contextMenuRef" trigger="contextmenu" :teleported="false" @command="handleCommand">
    <span></span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="edit">
          <el-icon>
            <Edit />
          </el-icon>
          编辑学生信息
        </el-dropdown-item>
        <el-dropdown-item command="delete" divided>
          <el-icon>
            <Delete />
          </el-icon>
          取消排座
        </el-dropdown-item>
        <el-dropdown-item divided disabled>
          <span class="menu-divider-label">标记颜色</span>
        </el-dropdown-item>
        <el-dropdown-item command="">
          <span class="color-option"
            :style="{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }"></span>
          默认颜色
        </el-dropdown-item>
        <el-dropdown-item v-for="color in studentColors" :key="color" :command="'color:' + color">
          <span class="color-option" :style="{ background: color }"></span>
          {{ color }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Lock, Edit, Delete } from '@element-plus/icons-vue'
import type { Seat, Student } from '@/types'
import { useDragDrop, useContextMenu } from '@/composables'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import { STUDENT_COLORS } from '@/types'
import GenderIcon from '@/components/common/GenderIcon.vue'

const props = defineProps<{
  seat: Seat
  student?: Student
  showStudentId?: boolean
  width?: number
  height?: number
}>()

const emit = defineEmits<{
  click: [seat: Seat]
  edit: [student: Student]
  unseat: [seatId: string]
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

const { openMenu } = useContextMenu()

const contextMenuRef = ref()
const contextMenuStudentId = ref<string | null>(null)
const isTouching = ref(false)
const touchTimeout = ref<number | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipStyle = ref<Record<string, string>>({})

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

const showGenderIcon = computed(() => {
  if (!configStore.uiSettings.showGenderIcon) return false
  return props.student?.gender === 'male' || props.student?.gender === 'female'
})

function calculateTooltipPosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  const tooltipWidth = 240
  const tooltipHeight = 180
  const gap = 16
  const padding = 12
  let top = 0
  let left = 0
  const spaceAbove = rect.top
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceRight = window.innerWidth - rect.right
  const spaceLeft = rect.left
  if (spaceRight >= tooltipWidth + gap) {
    left = rect.right + gap
    const idealTop = rect.top + (rect.height - tooltipHeight) / 2
    if (idealTop < padding) {
      top = padding
    } else if (idealTop + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding
    } else {
      top = idealTop
    }
  } else if (spaceLeft >= tooltipWidth + gap) {
    left = rect.left - tooltipWidth - gap
    const idealTop = rect.top + (rect.height - tooltipHeight) / 2
    if (idealTop < padding) {
      top = padding
    } else if (idealTop + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding
    } else {
      top = idealTop
    }
  } else if (spaceBelow >= tooltipHeight + gap) {
    top = rect.bottom + gap
    left = rect.left + (rect.width - tooltipWidth) / 2
  } else if (spaceAbove >= tooltipHeight + gap) {
    top = rect.top - tooltipHeight - gap
    left = rect.left + (rect.width - tooltipWidth) / 2
  } else {
    top = padding
    left = rect.left + (rect.width - tooltipWidth) / 2
  }
  if (left < padding) {
    left = padding
  } else if (left + tooltipWidth > window.innerWidth - padding) {
    left = window.innerWidth - tooltipWidth - padding
  }
  if (top < padding) {
    top = padding
  } else if (top + tooltipHeight > window.innerHeight - padding) {
    top = window.innerHeight - tooltipHeight - padding
  }
  tooltipStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '9999'
  }
}

function handleMouseEnter() {
  if (!props.student || isDragging.value) return
  if (!configStore.uiSettings.showTooltipOnHover) return
  calculateTooltipPosition()
  showTooltip.value = true
}

function handleMouseLeave() {
  showTooltip.value = false
}

function handleDragStart(event: DragEvent) {
  showTooltip.value = false
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
  showTooltip.value = false
  if (props.student) {
    contextMenuStudentId.value = props.student.id
    nextTick(() => {
      const dropdown = contextMenuRef.value
      if (dropdown) {
        openMenu(dropdown)
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

function handleCommand(command: string) {
  if (command === 'edit') {
    if (props.student) {
      emit('edit', props.student)
    }
  } else if (command === 'delete') {
    emit('unseat', props.seat.id)
  } else if (command.startsWith('color:')) {
    const color = command.replace('color:', '')
    setColor(color)
  } else if (command === '') {
    setColor('')
  }
  contextMenuStudentId.value = null
}

function setColor(color: string) {
  if (contextMenuStudentId.value) {
    studentStore.setStudentColor(contextMenuStudentId.value, color)
    saveAutoData()
  }
}

function saveAutoData() {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
}
</script>

<style scoped>
.seat-cell-wrapper {
  display: inline-block;
  position: relative;
}

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

.gender-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  padding: 2px;
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.seat-cell.is-occupied .gender-badge {
  background: rgba(255, 255, 255, 0.9);
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

.menu-divider-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
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

  .gender-badge {
    top: 1px;
    right: 1px;
    padding: 1px;
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

<style>
.student-tooltip-panel {
  width: 240px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
  pointer-events: auto;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-bg) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-light);
}

.tooltip-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.tooltip-avatar.male {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.tooltip-avatar.female {
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
}

.tooltip-avatar:not(.male):not(.female) {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
}

.tooltip-title {
  flex: 1;
  min-width: 0;
}

.tooltip-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tooltip-id {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.tooltip-body {
  padding: 12px 16px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.tooltip-row:last-child {
  border-bottom: none;
}

.tooltip-label {
  font-size: 13px;
  color: var(--text-muted);
}

.tooltip-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.tooltip-value.color-tag {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.tooltip-remark {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  margin-top: 4px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: none;
}

.tooltip-remark .tooltip-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.tooltip-remark .tooltip-value {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.5;
  text-align: left;
  width: 100%;
}

.tooltip-fade-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (hover: none) and (pointer: coarse) {
  .student-tooltip-panel {
    display: none;
  }
}
</style>
