<template>
  <div class="student-card-wrapper" ref="wrapperRef" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div class="student-card" :class="{ 'has-color': student.color }" :style="cardStyle" draggable="true" tabindex="0"
      @dragstart="handleDragStart" @dragend="handleDragEnd" @contextmenu.prevent="handleContextMenu"
      @touchstart="handleTouchStart" @touchend="handleTouchEnd">
      <GenderIcon v-if="showGenderIcon" :gender="student.gender" size="small" class="gender-badge" />
      <div class="card-content">
        <div class="student-name">{{ student.name }}</div>
        <div v-if="student.studentId" class="student-id">{{ student.studentId }}</div>
      </div>
      <el-dropdown ref="contextMenuRef" trigger="contextmenu" @command="handleCommand">
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
              删除学生
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
    </div>
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div v-if="showTooltip" class="student-tooltip" :style="tooltipStyle">
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import type { Student } from '@/types'
import { STUDENT_COLORS } from '@/types'
import { useDragDrop, useContextMenu } from '@/composables'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import GenderIcon from '@/components/common/GenderIcon.vue'

const props = defineProps<{
  student: Student
}>()

const emit = defineEmits<{
  edit: [student: Student]
  delete: [id: string]
}>()

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()
const studentColors = STUDENT_COLORS

const { handleDragStart: dragStart, handleDragEnd: dragEnd } = useDragDrop()

const { openMenu } = useContextMenu()

const contextMenuRef = ref()
const isTouching = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipStyle = ref<Record<string, string>>({})

const cardStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.student.color) {
    style.background = props.student.color
    style.borderColor = props.student.color
    style.color = '#fff'
  }
  if (isTouching.value) {
    style.transform = 'scale(0.96)'
  }
  return style
})

const showGenderIcon = computed(() => {
  if (!configStore.uiSettings.showGenderIcon) return false
  return props.student.gender === 'male' || props.student.gender === 'female'
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
  if (!configStore.uiSettings.showTooltipOnHover) return
  calculateTooltipPosition()
  showTooltip.value = true
}

function handleMouseLeave() {
  showTooltip.value = false
}

function handleDragStart(event: DragEvent) {
  showTooltip.value = false
  dragStart(event, {
    type: 'student',
    id: props.student.id
  })
}

function handleDragEnd(event: DragEvent) {
  dragEnd(event)
}

function handleContextMenu() {
  showTooltip.value = false
  nextTick(() => {
    const dropdown = contextMenuRef.value
    if (dropdown) {
      openMenu(dropdown)
      dropdown.handleOpen()
    }
  })
}

function handleTouchStart() {
  isTouching.value = true
}

function handleTouchEnd() {
  setTimeout(() => {
    isTouching.value = false
  }, 150)
}

function handleCommand(command: string) {
  if (command === 'edit') {
    emit('edit', props.student)
  } else if (command === 'delete') {
    emit('delete', props.student.id)
  } else if (command.startsWith('color:')) {
    const color = command.replace('color:', '')
    setColor(color)
  } else if (command === '') {
    setColor('')
  }
}

function setColor(color: string) {
  studentStore.setStudentColor(props.student.id, color)
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
}
</script>

<style scoped>
.student-card-wrapper {
  display: inline-block;
  position: relative;
}

.student-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.student-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.student-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.student-card:hover::before {
  opacity: 1;
}

.student-card.has-color {
  border-color: transparent;
}

.student-card.has-color:hover {
  box-shadow: var(--shadow-md);
}

.student-card.has-color .student-name {
  color: inherit;
}

.student-card.has-color .student-id {
  color: inherit;
  opacity: 0.8;
}

.student-card:active {
  cursor: grabbing;
}

.student-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  box-shadow: var(--shadow-lg);
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

.student-card.has-color .gender-badge {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.card-content {
  text-align: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

.student-name {
  font-weight: 600;
  white-space: normal;
  word-break: break-all;
  font-size: 14px;
  letter-spacing: -0.2px;
  color: var(--text-primary);
  line-height: 1.3;
}

.student-id {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: 500;
}

.menu-divider-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
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
  .student-card {
    padding: 8px 10px;
    min-height: 40px;
    border-radius: var(--radius-md);
  }

  .student-name {
    font-size: 12px;
  }

  .student-id {
    font-size: 10px;
  }
}

@media (max-width: 575px) {
  .student-card {
    padding: 6px 8px;
    min-height: 36px;
    border-radius: var(--radius-sm);
    border-width: 1.5px;
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
  .student-card:hover {
    transform: none;
    border-color: var(--border-light);
    box-shadow: var(--shadow-card);
  }

  .student-card:hover::before {
    opacity: 0;
  }
}
</style>

<style>
.student-tooltip {
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
  .student-tooltip {
    display: none;
  }
}
</style>
