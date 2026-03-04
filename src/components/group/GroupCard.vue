<template>
  <div class="group-student-card-wrapper" ref="wrapperRef" @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave">
    <div class="group-student-card" tabindex="0" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
      <el-button class="remove-btn" type="info" :icon="Close" circle size="small" @click.stop="handleRemove" />
      <GenderIcon v-if="showGenderIcon" :gender="student.gender" size="small" class="gender-badge" />
      <div class="student-info">
        <span class="student-name">{{ student.name }}</span>
      </div>
    </div>
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div v-if="showTooltip" class="student-tooltip-panel" :style="tooltipStyle">
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
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import type { Student } from '@/types'
import { useDragDrop } from '@/composables'
import { useGroupStore } from '@/stores/group'
import { useConfigStore } from '@/stores/config'
import GenderIcon from '@/components/common/GenderIcon.vue'

const props = defineProps<{
  student: Student
  groupId: string
}>()

const emit = defineEmits<{
  remove: [studentId: string]
}>()

const { handleDragStart: startDrag, handleDragEnd: endDrag } = useDragDrop()
const groupStore = useGroupStore()
const configStore = useConfigStore()

const wrapperRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipStyle = ref<Record<string, string>>({})

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
  startDrag(event, {
    type: 'group-student',
    id: props.student.id,
    groupId: props.groupId,
  })
}

function handleDragEnd(event: DragEvent) {
  endDrag(event)
}

function handleRemove() {
  groupStore.removeStudentFromGroup(props.groupId, props.student.id)
  emit('remove', props.student.id)
}
</script>

<style scoped>
.group-student-card-wrapper {
  display: inline-block;
  position: relative;
  width: 100%;
}

.group-student-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
  min-height: 36px;
}

.group-student-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.group-student-card:focus-visible {
  outline: none;
  background: var(--primary-bg);
  box-shadow: inset 0 0 0 2px var(--primary-light), var(--shadow-sm);
  transform: translateY(-1px);
}

.group-student-card:active {
  cursor: grabbing;
}

.gender-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  padding: 1px;
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.student-info {
  text-align: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

.student-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.2px;
}

.remove-btn {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  width: 18px !important;
  height: 18px !important;
  padding: 0 !important;
  transition: all var(--transition-fast);
  z-index: 3;
}

.group-student-card:hover .remove-btn,
.group-student-card:focus-visible .remove-btn {
  opacity: 1;
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
