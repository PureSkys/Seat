<template>
  <div class="student-import">
    <div class="import-header" @click="isExpanded = !isExpanded">
      <span class="title">导入学生</span>
      <el-icon :class="{ 'is-expanded': isExpanded }">
        <ArrowDown />
      </el-icon>
    </div>

    <el-collapse-transition>
      <div v-show="isExpanded" class="import-content">
        <el-upload ref="uploadRef" class="upload-area" drag :auto-upload="false" :show-file-list="false"
          :accept="acceptTypes" :on-change="handleFileChange">
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽或<em>点击上传</em>
          </div>
        </el-upload>

        <div class="import-actions">
          <el-button size="small" @click.stop="downloadTemplate">
            <el-icon>
              <Download />
            </el-icon>
            模板
          </el-button>
          <el-button size="small" type="primary" @click.stop="showAddDialog = true">
            <el-icon>
              <Plus />
            </el-icon>
            新增
          </el-button>
        </div>
      </div>
    </el-collapse-transition>

    <el-dialog v-model="showPreview" title="数据预览" width="80%" :close-on-click-modal="false">
      <div v-if="parseErrors.length > 0" class="mb-4">
        <el-alert v-for="(error, index) in parseErrors" :key="index" :title="error" type="warning" class="mb-2"
          show-icon />
      </div>

      <el-table :data="previewData" max-height="400" border stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="height" label="身高" width="80" />
        <el-table-column prop="score" label="成绩" width="80" />
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPreview = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">
            确认导入 ({{ previewData.length }} 人)
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddDialog" title="新增学生" width="400px">
      <el-form :model="addForm" label-width="60px">
        <el-form-item label="姓名" required>
          <el-input v-model="addForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="addForm.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="addForm.gender" clearable placeholder="请选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="身高">
          <el-input-number v-model="addForm.height" :min="0" :max="300" placeholder="身高(cm)" />
        </el-form-item>
        <el-form-item label="成绩">
          <el-input-number v-model="addForm.score" :min="0" :max="1000" placeholder="成绩" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddStudent">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download, Plus, ArrowDown } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx-js-style'
import { parseFile } from '@/utils/parser'
import type { Student, StudentBase } from '@/types'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { useGroupStore } from '@/stores/group'

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const configStore = useConfigStore()
const groupStore = useGroupStore()

function triggerAutoSave() {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  if (configStore.isDefaultScheme()) {
    configStore.saveAutoSaveData(studentStore.students, seatsData, groupsData)
  } else {
    configStore.saveCurrentScheme(studentStore.students, seatsData, groupsData)
  }
}

const acceptTypes = '.xlsx,.xls,.csv'
const isExpanded = ref(false)
const showPreview = ref(false)
const previewData = ref<Student[]>([])
const parseErrors = ref<string[]>([])
const showAddDialog = ref(false)

const addForm = reactive<StudentBase>({
  name: '',
  studentId: '',
  gender: undefined,
  height: undefined,
  score: undefined
})

async function handleFileChange(file: { raw: File }) {
  const result = await parseFile(file.raw)

  if (result.errors.length > 0 && result.data.length === 0) {
    ElMessage.error(result.errors[0])
    return
  }

  previewData.value = result.data
  parseErrors.value = result.errors
  showPreview.value = true
}

function confirmImport() {
  studentStore.addStudents(
    previewData.value.map((s) => ({
      name: s.name,
      studentId: s.studentId,
      gender: s.gender,
      height: s.height,
      score: s.score,
    }))
  )

  triggerAutoSave()

  ElMessage.success(`成功导入 ${previewData.value.length} 名学生`)
  showPreview.value = false
  previewData.value = []
  parseErrors.value = []
}

function downloadTemplate() {
  const templateData = [
    ['姓名', '学号', '性别', '身高', '成绩'],
    ['张三', '2024001', '男', 175, 85],
    ['李四', '2024002', '女', 165, 90],
    ['王五', '2024003', '男', 180, 78],
  ]

  const ws = XLSX.utils.aoa_to_sheet(templateData)

  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学生信息模板')

  XLSX.writeFile(wb, '学生信息导入模板.xlsx')
}

function confirmAddStudent() {
  if (!addForm.name.trim()) {
    ElMessage.warning('请输入学生姓名')
    return
  }

  studentStore.addStudent({
    name: addForm.name.trim(),
    studentId: addForm.studentId?.trim() || undefined,
    gender: addForm.gender,
    height: addForm.height,
    score: addForm.score,
  })

  triggerAutoSave()

  ElMessage.success('添加成功')

  addForm.name = ''
  addForm.studentId = ''
  addForm.gender = undefined
  addForm.height = undefined
  addForm.score = undefined

  showAddDialog.value = false
}
</script>

<style scoped>
.student-import {
  width: 100%;
}

.import-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-base);
  border: 1px solid var(--border-light);
}

.import-header:hover {
  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--bg-hover) 100%);
  border-color: var(--primary-light);
}

.import-header .title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.import-header .el-icon {
  transition: transform var(--transition-slow);
  color: var(--primary-color);
  font-size: 12px;
}

.import-header .el-icon.is-expanded {
  transform: rotate(180deg);
}

.import-content {
  padding-top: 10px;
}

.upload-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 2px dashed var(--border-color);
  transition: all var(--transition-base);
  background: var(--bg-secondary);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
  background: var(--primary-bg);
}

:deep(.el-upload-dragger.is-dragover) {
  border-color: var(--success-color);
  background: var(--success-bg);
}

:deep(.el-icon--upload) {
  font-size: 28px;
  margin-bottom: 6px;
  color: var(--primary-color);
}

:deep(.el-upload__text) {
  font-size: 12px;
  color: var(--text-secondary);
  letter-spacing: -0.1px;
}

:deep(.el-upload__text em) {
  color: var(--primary-color);
  font-style: normal;
  font-weight: 600;
}

.import-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.import-actions .el-button {
  flex: 1;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 12px;
  padding: 6px 12px;
  height: auto;
  transition: all var(--transition-base);
}

.import-actions .el-button--primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border: none;
}
</style>
