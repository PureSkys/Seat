<template>
  <div class="student-card" :class="{ 'has-color': student.color }" :style="cardStyle" draggable="true" tabindex="0"
    @dragstart="handleDragStart" @dragend="handleDragEnd" @contextmenu.prevent="handleContextMenu"
    @touchstart="handleTouchStart" @touchend="handleTouchEnd">
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

function handleDragStart(event: DragEvent) {
  dragStart(event, {
    type: 'student',
    id: props.student.id
  })
}

function handleDragEnd(event: DragEvent) {
  dragEnd(event)
}

function handleContextMenu() {
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
.student-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
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
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.student-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.student-card:hover::before {
  opacity: 1;
}

.student-card:focus-visible {
  outline: none;
  background: var(--primary-bg);
  box-shadow: inset 0 0 0 2px var(--primary-light), var(--shadow-sm);
  transform: translateY(-1px);
}

.student-card:focus-visible::before {
  opacity: 1;
}

.student-card.has-color {
  border-color: transparent;
}

.student-card.has-color::before {
  opacity: 0;
}

.student-card.has-color:hover {
  box-shadow: var(--shadow-md);
}

.student-card.has-color:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5), var(--shadow-md);
}

.student-card:active {
  cursor: grabbing;
}

.student-card.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
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
  font-size: 13px;
  letter-spacing: -0.2px;
  color: var(--text-primary);
  line-height: 1.3;
}

.student-id {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

.menu-divider-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.color-option {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  margin-right: 8px;
  vertical-align: middle;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

@media (max-width: 767px) {
  .student-card {
    padding: 8px 10px;
    min-height: 40px;
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
  .student-card:hover {
    transform: none;
    border-color: var(--border-light);
    box-shadow: var(--shadow-xs);
  }

  .student-card:hover::before {
    opacity: 0;
  }

  .student-card.has-color:hover {
    box-shadow: var(--shadow-xs);
  }
}
</style>
