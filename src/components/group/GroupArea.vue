<template>
  <div class="group-area" :class="{ 'is-drag-over': isDragOver, 'is-active': isActive }"
    :style="{ '--group-color': group.color }" @dragover="handleDragOver" @dragleave="handleDragLeave"
    @drop="handleDrop">
    <div class="group-header">
      <div class="group-title">
        <span class="group-badge">{{ groupIndex }}</span>
        <span v-if="!isEditing" class="group-name" @dblclick="startEditing">
          {{ group.name }}
        </span>
        <el-input v-else v-model="editName" size="small" class="edit-input" @blur="finishEditing"
          @keyup.enter="finishEditing" @keyup.escape="cancelEditing" ref="editInputRef" />
        <span class="group-count">
          <el-icon>
            <User />
          </el-icon>
          {{ group.studentIds.length }}
        </span>
      </div>
      <div class="group-actions">
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button type="primary" :icon="MoreFilled" circle size="small" plain />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">
                <el-icon>
                  <Edit />
                </el-icon>
                重命名
              </el-dropdown-item>
              <el-dropdown-item command="color">
                <el-icon>
                  <Brush />
                </el-icon>
                更换颜色
              </el-dropdown-item>
              <el-dropdown-item command="clear" :disabled="group.studentIds.length === 0">
                <el-icon>
                  <Delete />
                </el-icon>
                清空学生
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <el-icon>
                  <Close />
                </el-icon>
                删除分组
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="group-content">
      <div v-if="students.length === 0" class="empty-hint">
        <el-icon :size="24">
          <Plus />
        </el-icon>
        <span>拖拽学生到此处</span>
      </div>
      <TransitionGroup v-else name="student-list" tag="div" class="student-list">
        <GroupCard v-for="student in students" :key="student.id" :student="student" :group-id="group.id" />
      </TransitionGroup>
    </div>

    <el-color-picker v-if="showColorPicker" v-model="selectedColor" class="color-picker-popup"
      @change="handleColorChange" @active-change="handleColorPreview" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { MoreFilled, Edit, Brush, Delete, Close, Plus, User } from '@element-plus/icons-vue'
import type { StudentGroup, Student } from '@/types'
import { useGroupStore } from '@/stores/group'
import { useStudentStore } from '@/stores/student'
import { useDragDrop } from '@/composables'
import GroupCard from './GroupCard.vue'

const props = defineProps<{
  group: StudentGroup
}>()

const emit = defineEmits<{
  active: [groupId: string]
}>()

const groupStore = useGroupStore()
const studentStore = useStudentStore()
const { handleDragOverGroup: onDragOverGroup, handleDragLeaveGroup: onDragLeaveGroup, handleDropToGroup: onDropToGroup, dragOverGroupId } = useDragDrop()

const isEditing = ref(false)
const editName = ref('')
const editInputRef = ref()
const showColorPicker = ref(false)
const selectedColor = ref(props.group.color || '#409eff')

const isActive = computed(() => groupStore.activeGroupId === props.group.id)
const isDragOver = computed(() => dragOverGroupId.value === props.group.id)
const groupIndex = computed(() => {
  const index = groupStore.groups.findIndex(g => g.id === props.group.id)
  return index + 1
})

const students = computed(() => {
  return props.group.studentIds
    .map((id) => studentStore.getStudentById(id))
    .filter((s): s is Student => s !== undefined)
})

function handleDragOver(event: DragEvent) {
  onDragOverGroup(event, props.group.id)
  emit('active', props.group.id)
}

function handleDragLeave() {
  onDragLeaveGroup()
}

function handleDrop(event: DragEvent) {
  onDropToGroup(event, props.group.id)
}

function startEditing() {
  isEditing.value = true
  editName.value = props.group.name
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

function finishEditing() {
  if (editName.value.trim() && editName.value !== props.group.name) {
    groupStore.renameGroup(props.group.id, editName.value.trim())
  }
  isEditing.value = false
}

function cancelEditing() {
  isEditing.value = false
  editName.value = props.group.name
}

async function handleCommand(command: string) {
  switch (command) {
    case 'rename':
      startEditing()
      break
    case 'color':
      showColorPicker.value = true
      break
    case 'clear':
      await ElMessageBox.confirm('确定要清空该分组的所有学生吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      groupStore.clearGroupStudents(props.group.id)
      break
    case 'delete':
      await ElMessageBox.confirm('确定要删除该分组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      groupStore.deleteGroup(props.group.id)
      break
  }
}

function handleColorChange(color: string) {
  groupStore.setGroupColor(props.group.id, color)
  showColorPicker.value = false
}

function handleColorPreview(color: string) {
  selectedColor.value = color
}
</script>

<style scoped>
.group-area {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-card);
}

.group-area:hover {
  box-shadow: var(--shadow-card-hover);
}

.group-area.is-active {
  border-color: var(--group-color);
}

.group-area.is-drag-over {
  border-style: dashed;
  border-color: var(--group-color);
  animation: pulse-border 1.5s ease-in-out infinite;
}

@keyframes pulse-border {

  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--group-color) 40%, transparent);
  }

  50% {
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--group-color) 10%, transparent);
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-badge {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--group-color);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
}

.group-name {
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-primary);
  padding: 2px 6px;
  border-radius: 6px;
  transition: background var(--transition-fast);
}

.group-name:hover {
  background: var(--bg-hover);
}

.group-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.edit-input {
  width: 120px;
}

.edit-input :deep(.el-input__wrapper) {
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.group-actions {
  display: flex;
  gap: 6px;
}

.group-actions :deep(.el-button) {
  background: var(--bg-secondary);
  border-color: transparent;
  color: var(--text-muted);
}

.group-actions :deep(.el-button:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.group-content {
  padding: 12px;
  min-height: 60px;
  max-height: 300px;
  overflow-y: auto;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-hint .el-icon {
  opacity: 0.5;
}

.student-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.student-list-enter-active,
.student-list-leave-active {
  transition: all 0.3s ease;
}

.student-list-enter-from,
.student-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.color-picker-popup {
  position: absolute;
  top: 40px;
  right: 10px;
  z-index: 100;
}
</style>
