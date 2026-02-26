<template>
  <div class="student-list">
    <div class="list-header">
      <el-input v-model="searchText" placeholder="搜索学生..." clearable size="small">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <div class="stats">
        <div class="stat-item stat-pending">
          <span class="stat-label">待排</span>
          <span class="stat-value">{{ unseatedCount }}</span>
        </div>
        <div class="stat-item stat-seated">
          <span class="stat-label">已排</span>
          <span class="stat-value">{{ seatedCount }}</span>
        </div>
      </div>
    </div>

    <div class="list-content" @dragover.prevent @drop="handleDropToUnseated">
      <el-scrollbar>
        <div class="student-cards">
          <StudentCard v-for="student in filteredStudents" :key="student.id" :student="student" @edit="handleEdit"
            @delete="handleDelete" />
          <el-empty v-if="filteredStudents.length === 0" description="暂无待排学生" :image-size="60" />
        </div>
      </el-scrollbar>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑学生信息" width="400px" :fullscreen="isMobile">
      <el-form :model="editForm" label-width="60px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="editForm.studentId" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" clearable>
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="身高">
          <el-input-number v-model="editForm.height" :min="0" :max="300" />
        </el-form-item>
        <el-form-item label="成绩">
          <el-input-number v-model="editForm.score" :min="0" :max="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import StudentCard from './StudentCard.vue'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'
import { useDragDrop, useResponsive } from '@/composables'
import type { Student } from '@/types'

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()
const { handleDropToUnseated } = useDragDrop()
const responsive = useResponsive()

const isMobile = computed(() => responsive.value.isMobile)

function triggerAutoSave() {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  if (configStore.isDefaultScheme()) {
    configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
  } else {
    configStore.saveCurrentScheme(studentStore.students, seatsData, groupsData)
  }
}

const searchText = ref('')
const showEditDialog = ref(false)
const editForm = ref<Partial<Student>>({})

const unseatedCount = computed(() => studentStore.unseatedStudents.length)
const seatedCount = computed(() => studentStore.seatedStudents.length)

const filteredStudents = computed(() => {
  const students = studentStore.unseatedStudents
  if (!searchText.value) return students

  const search = searchText.value.toLowerCase()
  return students.filter(s =>
    s.name.toLowerCase().includes(search) ||
    s.studentId?.toLowerCase().includes(search)
  )
})

function handleEdit(student: Student) {
  editForm.value = { ...student }
  showEditDialog.value = true
}

function handleDelete(id: string) {
  ElMessageBox.confirm('确定要删除该学生吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    studentStore.removeStudent(id)
    triggerAutoSave()
    ElMessage.success('删除成功')
  }).catch(() => { })
}

function saveEdit() {
  if (editForm.value.id && editForm.value.name) {
    studentStore.updateStudent(editForm.value.id, editForm.value)
    triggerAutoSave()
    showEditDialog.value = false
    ElMessage.success('保存成功')
  }
}
</script>

<style scoped>
.student-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.list-header {
  padding: 14px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.list-header :deep(.el-input__wrapper) {
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 1px var(--border-color);
  transition: all var(--transition-base);
  background: var(--bg-secondary);
}

.list-header :deep(.el-input__wrapper:hover),
.list-header :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--primary-color), 0 0 0 4px var(--primary-bg);
}

.stats {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  transition: all var(--transition-base);
}

.stat-pending {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(100, 116, 139, 0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.stat-pending .stat-label {
  color: var(--text-secondary);
}

.stat-pending .stat-value {
  color: var(--primary-color);
  font-weight: 700;
}

.stat-seated {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.stat-seated .stat-label {
  color: var(--text-secondary);
}

.stat-seated .stat-value {
  color: var(--success-color);
  font-weight: 700;
}

.list-content {
  flex: 1;
  min-height: 0;
  padding: 14px;
  background: var(--bg-tertiary);
}

.student-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding-bottom: 4px;
  width: 100%;
}

.student-cards>* {
  min-width: 0;
}

.student-cards :deep(.el-empty) {
  grid-column: 1 / -1;
  padding: 20px 0;
}

.student-cards :deep(.el-empty__description) {
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 767px) {
  .list-header {
    padding: 12px;
  }

  .stats {
    gap: 8px;
    margin-top: 10px;
  }

  .stat-item {
    padding: 6px 10px;
    font-size: 11px;
  }

  .list-content {
    padding: 12px;
  }

  .student-cards {
    gap: 8px;
  }
}

@media (max-width: 575px) {
  .student-list {
    border-radius: var(--radius-lg);
  }

  .list-header {
    padding: 10px;
  }

  .stats {
    gap: 6px;
    margin-top: 8px;
  }

  .stat-item {
    padding: 5px 8px;
    font-size: 10px;
    gap: 4px;
  }

  .list-content {
    padding: 10px;
  }

  .student-cards {
    gap: 6px;
  }

  .student-cards :deep(.el-empty) {
    padding: 16px 0;
  }

  .student-cards :deep(.el-empty__description) {
    font-size: 12px;
  }
}
</style>
