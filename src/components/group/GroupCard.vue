<template>
  <div class="group-student-card" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <div class="student-avatar" :class="student.gender">
      <span class="avatar-text">{{ student.name.charAt(0) }}</span>
    </div>
    <span class="student-name">{{ student.name }}</span>
    <el-button class="remove-btn" type="info" :icon="Close" circle size="small" @click.stop="handleRemove" />
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import type { Student } from '@/types'
import { useDragDrop } from '@/composables'
import { useGroupStore } from '@/stores/group'

const props = defineProps<{
  student: Student
  groupId: string
}>()

const emit = defineEmits<{
  remove: [studentId: string]
}>()

const { handleDragStart: startDrag, handleDragEnd: endDrag } = useDragDrop()
const groupStore = useGroupStore()

function handleDragStart(event: DragEvent) {
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
.group-student-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all var(--transition-fast);
  position: relative;
}

.group-student-card:hover {
  background: var(--bg-hover);
}

.group-student-card:active {
  cursor: grabbing;
}

.student-avatar {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.student-avatar.male {
  background: #3b82f6;
}

.student-avatar.female {
  background: #ec4899;
}

.student-avatar:not(.male):not(.female) {
  background: #64748b;
}

.avatar-text {
  text-transform: uppercase;
}

.student-name {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.remove-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  width: 18px !important;
  height: 18px !important;
  padding: 0 !important;
  transition: all var(--transition-fast);
}

.group-student-card:hover .remove-btn {
  opacity: 1;
}
</style>
