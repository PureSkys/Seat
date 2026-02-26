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

    <el-dialog v-model="showPreview" title="数据预览" width="720px" :close-on-click-modal="false" destroy-on-close>
      <div class="preview-container">
        <div class="preview-header">
          <div class="preview-info">
            <div class="info-item">
              <el-icon>
                <Document />
              </el-icon>
              <span class="info-value">{{ fileName }}</span>
            </div>
            <div class="info-item">
              <el-icon>
                <User />
              </el-icon>
              <span class="info-value">{{ previewData.length }} 人</span>
            </div>
            <div v-if="duplicates.length > 0" class="info-item warning">
              <el-icon>
                <Warning />
              </el-icon>
              <span class="info-value">{{ duplicates.length }} 条重复</span>
            </div>
          </div>
          <div class="preview-stats">
            <span class="stat-item male">男 {{ genderStats.male }}</span>
            <span class="stat-item female">女 {{ genderStats.female }}</span>
            <span v-if="genderStats.unknown > 0" class="stat-item unknown">未设置 {{ genderStats.unknown }}</span>
            <span v-if="heightStats.min" class="stat-item">身高 {{ heightStats.min }}-{{ heightStats.max }}cm</span>
            <span v-if="scoreStats.min !== null" class="stat-item">成绩 {{ scoreStats.min }}-{{ scoreStats.max }}</span>
          </div>
        </div>

        <div class="preview-toolbar">
          <el-input v-model="searchKeyword" placeholder="搜索姓名或学号" clearable class="search-input" size="small">
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <div class="toolbar-actions">
            <el-button v-if="selectedRows.length > 0" type="danger" size="small" @click="removeSelectedRows">
              删除 ({{ selectedRows.length }})
            </el-button>
            <el-button v-if="duplicates.length > 0" type="warning" size="small" @click="highlightDuplicates">
              定位重复
            </el-button>
          </div>
        </div>

        <div v-if="parseErrors.length > 0" class="error-section">
          <el-collapse>
            <el-collapse-item>
              <template #title>
                <div class="error-header">
                  <el-icon>
                    <WarningFilled />
                  </el-icon>
                  <span>解析警告 ({{ parseErrors.length }} 条)</span>
                </div>
              </template>
              <div class="error-list">
                <div v-for="(error, index) in parseErrors" :key="index" class="error-item">
                  {{ error }}
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <el-table ref="tableRef" :data="paginatedData" border stripe max-height="280" size="small"
          @selection-change="handleSelectionChange" :row-class-name="getRowClassName">
          <el-table-column type="selection" width="40" />
          <el-table-column type="index" label="#" width="45" :index="getIndex" />
          <el-table-column prop="name" label="姓名" min-width="90" sortable>
            <template #default="{ row }">
              <span :class="{ 'duplicate-row': isDuplicate(row) }">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="studentId" label="学号" min-width="100" sortable>
            <template #default="{ row }">
              <span :class="{ 'duplicate-row': isDuplicate(row) }">{{ row.studentId || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="gender" label="性别" width="60" sortable>
            <template #default="{ row }">
              <span v-if="row.gender === 'male'">男</span>
              <span v-else-if="row.gender === 'female'">女</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="height" label="身高" width="65" sortable>
            <template #default="{ row }">
              <span v-if="row.height">{{ row.height }}</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="成绩" width="65" sortable>
            <template #default="{ row }">
              <span v-if="row.score !== undefined">{{ row.score }}</span>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="50" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" size="small" link @click="removeRow(row)">
                <el-icon>
                  <Delete />
                </el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="filteredData.length" layout="total, sizes, prev, pager, next, jumper" background small />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPreview = false">取消</el-button>
          <el-button type="primary" @click="confirmImport" :disabled="previewData.length === 0">
            确认导入 ({{ previewData.length }} 人)
          </el-button>
        </div>
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
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Download, Plus, ArrowDown, Document, User, Warning, Search, Delete, WarningFilled } from '@element-plus/icons-vue'
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
const fileName = ref('')
const searchKeyword = ref('')
const selectedRows = ref<Student[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const tableRef = ref()

const addForm = reactive<StudentBase>({
  name: '',
  studentId: '',
  gender: undefined,
  height: undefined,
  score: undefined
})

const duplicates = computed(() => {
  const seen = new Map<string, Student[]>()
  previewData.value.forEach(student => {
    const key = student.studentId ? `${student.name}_${student.studentId}` : student.name
    if (!seen.has(key)) {
      seen.set(key, [])
    }
    seen.get(key)!.push(student)
  })
  return Array.from(seen.values()).filter(group => group.length > 1).flat()
})

const filteredData = computed(() => {
  if (!searchKeyword.value.trim()) {
    return previewData.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return previewData.value.filter(student =>
    student.name.toLowerCase().includes(keyword) ||
    (student.studentId && student.studentId.toLowerCase().includes(keyword))
  )
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const genderStats = computed(() => {
  const stats = { male: 0, female: 0, unknown: 0 }
  previewData.value.forEach(student => {
    if (student.gender === 'male') stats.male++
    else if (student.gender === 'female') stats.female++
    else stats.unknown++
  })
  return stats
})

const heightStats = computed(() => {
  const heights = previewData.value.filter(s => s.height).map(s => s.height as number)
  if (heights.length === 0) return { min: null, max: null }
  return { min: Math.min(...heights), max: Math.max(...heights) }
})

const scoreStats = computed(() => {
  const scores = previewData.value.filter(s => s.score !== undefined).map(s => s.score as number)
  if (scores.length === 0) return { min: null, max: null }
  return { min: Math.min(...scores), max: Math.max(...scores) }
})

function isDuplicate(student: Student): boolean {
  return duplicates.value.some(d => d.id === student.id)
}

function getRowClassName({ row }: { row: Student }): string {
  return isDuplicate(row) ? 'warning-row' : ''
}

function getIndex(index: number): number {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function handleSelectionChange(selection: Student[]) {
  selectedRows.value = selection
}

function removeRow(row: Student) {
  const globalIndex = previewData.value.findIndex(s => s.id === row.id)
  if (globalIndex > -1) {
    previewData.value.splice(globalIndex, 1)
  }
}

function removeSelectedRows() {
  const idsToRemove = new Set(selectedRows.value.map(s => s.id))
  previewData.value = previewData.value.filter(s => !idsToRemove.has(s.id))
  selectedRows.value = []
}

function highlightDuplicates() {
  if (duplicates.value.length === 0) return
  const firstDuplicate = duplicates.value[0]
  if (!firstDuplicate) return
  const index = filteredData.value.findIndex(s => s.id === firstDuplicate.id)
  if (index > -1) {
    const targetPage = Math.floor(index / pageSize.value) + 1
    currentPage.value = targetPage
    setTimeout(() => {
      tableRef.value?.setScrollRow(index % pageSize.value)
    }, 100)
  }
}

async function handleFileChange(file: { raw: File }) {
  fileName.value = file.raw.name
  const result = await parseFile(file.raw)

  if (result.errors.length > 0 && result.data.length === 0) {
    ElMessage.error(result.errors[0])
    return
  }

  previewData.value = result.data
  parseErrors.value = result.errors
  searchKeyword.value = ''
  selectedRows.value = []
  currentPage.value = 1
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
  fileName.value = ''
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

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.info-item .el-icon {
  color: var(--primary-color);
  font-size: 14px;
}

.info-item.warning .el-icon {
  color: var(--warning-color);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.preview-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-item {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.stat-item.male {
  color: var(--primary-color);
}

.stat-item.female {
  color: var(--danger-color);
}

.stat-item.unknown {
  color: var(--text-placeholder);
}

.no-data {
  color: var(--text-placeholder);
  font-size: 12px;
}

.preview-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  width: 180px;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.error-section {
  border: 1px solid var(--warning-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--warning-color);
  font-weight: 500;
  font-size: 13px;
}

.error-list {
  max-height: 100px;
  overflow-y: auto;
}

.error-item {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-lighter);
}

.error-item:last-child {
  border-bottom: none;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.duplicate-row {
  color: var(--warning-color);
  font-weight: 500;
}

:deep(.warning-row) {
  background-color: var(--warning-bg) !important;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-light);
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--bg-tertiary);
  font-weight: 600;
  font-size: 12px;
  padding: 6px 0;
}

:deep(.el-table td.el-table__cell) {
  font-size: 12px;
  padding: 4px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
