<template>
  <div class="group-panel">
    <div class="panel-header">
      <div class="header-actions">
        <el-tooltip content="新建分组" placement="bottom">
          <button class="action-btn primary" @click="handleCreateGroup">
            <el-icon>
              <Plus />
            </el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="自动分组" placement="bottom">
          <button class="action-btn" @click="handleAutoGroup">
            <el-icon>
              <MagicStick />
            </el-icon>
          </button>
        </el-tooltip>
        <div class="action-divider"></div>
        <el-tooltip content="撤销" placement="bottom" :disabled="!canUndo">
          <button class="action-btn" :disabled="!canUndo" @click="handleUndo">
            <el-icon>
              <RefreshLeft />
            </el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="重做" placement="bottom" :disabled="!canRedo">
          <button class="action-btn" :disabled="!canRedo" @click="handleRedo">
            <el-icon>
              <RefreshRight />
            </el-icon>
          </button>
        </el-tooltip>
        <div class="action-divider"></div>
        <el-tooltip content="导出分组" placement="bottom">
          <button class="action-btn" @click="showExportDialog = true">
            <el-icon>
              <Download />
            </el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="清空分组" placement="bottom">
          <button class="action-btn danger" @click="handleClearAll">
            <el-icon>
              <Delete />
            </el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>
    <div class="panel-stats">
      <div class="stat-card">
        <div class="stat-row">
          <div class="stat-icon blue">
            <el-icon>
              <Grid />
            </el-icon>
          </div>
          <span class="stat-value">{{ totalGroups }}</span>
        </div>
        <span class="stat-label">分组数</span>
      </div>
      <div class="stat-card">
        <div class="stat-row">
          <div class="stat-icon green">
            <el-icon>
              <UserFilled />
            </el-icon>
          </div>
          <span class="stat-value">{{ groupedCount }}</span>
        </div>
        <span class="stat-label">已分组</span>
      </div>
      <div class="stat-card">
        <div class="stat-row">
          <div class="stat-icon orange">
            <el-icon>
              <User />
            </el-icon>
          </div>
          <span class="stat-value">{{ ungroupedCount }}</span>
        </div>
        <span class="stat-label">待分组</span>
      </div>
    </div>

    <div class="panel-content">
      <div v-if="groups.length === 0" class="empty-state">
        <el-icon :size="48">
          <FolderOpened />
        </el-icon>
        <p>暂无分组</p>
        <p class="hint">点击"新建分组"创建分组，或将学生拖拽到此处</p>
      </div>
      <TransitionGroup v-else name="group-list" tag="div" class="group-list">
        <GroupArea v-for="group in groups" :key="group.id" :group="group" @active="handleGroupActive" />
      </TransitionGroup>
    </div>

    <el-dialog v-model="showExportDialog" title="导出分组结果" width="500px">
      <el-form label-width="100px">
        <el-form-item label="文件名">
          <el-input v-model="exportFilename" placeholder="请输入文件名" />
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="word">Word 文档</el-radio>
            <el-radio value="excel">Excel 表格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含信息">
          <el-checkbox-group v-model="exportFields">
            <el-checkbox value="name">姓名</el-checkbox>
            <el-checkbox value="studentId">学号</el-checkbox>
            <el-checkbox value="gender">性别</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport">导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAutoGroupDialog" title="自动分组" width="400px">
      <el-form label-width="100px">
        <el-form-item label="分组数量">
          <el-input-number v-model="autoGroupCount" :min="2" :max="20" />
        </el-form-item>
        <el-form-item label="分组方式">
          <el-radio-group v-model="autoGroupMode">
            <el-radio value="random">随机分组</el-radio>
            <el-radio value="gender">男女均衡</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAutoGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="executeAutoGroup">开始分组</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Grid, Plus, Delete, Download, RefreshLeft, RefreshRight,
  MagicStick, FolderOpened, UserFilled, User
} from '@element-plus/icons-vue'
import { useGroupStore } from '@/stores/group'
import { useStudentStore } from '@/stores/student'
import GroupArea from './GroupArea.vue'
import { exportGroupsToWord, exportGroupsToExcel } from '@/utils/groupExporter'

const groupStore = useGroupStore()
const studentStore = useStudentStore()

const showExportDialog = ref(false)
const showAutoGroupDialog = ref(false)
const exportFilename = ref('')
const exportFormat = ref<'word' | 'excel'>('word')
const exportFields = ref(['name', 'studentId'])
const autoGroupCount = ref(4)
const autoGroupMode = ref<'random' | 'gender'>('random')

const groups = computed(() => groupStore.groups)
const totalGroups = computed(() => groupStore.totalGroups)
const canUndo = computed(() => groupStore.canUndo())
const canRedo = computed(() => groupStore.canRedo())

const groupedCount = computed(() => groupStore.groupedStudentIds.size)

const ungroupedCount = computed(() => {
  return studentStore.students.length - groupedCount.value
})

onMounted(() => {
  exportFilename.value = `分组结果_${new Date().toLocaleDateString()}`
})

function handleCreateGroup() {
  groupStore.createGroup()
  ElMessage.success('分组创建成功')
}

function handleGroupActive(groupId: string) {
  groupStore.setActiveGroup(groupId)
}

async function handleClearAll() {
  if (groups.value.length === 0) return

  await ElMessageBox.confirm('确定要清空所有分组吗？此操作不可撤销。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  groupStore.clearAllGroups()
  ElMessage.success('已清空所有分组')
}

function handleUndo() {
  if (groupStore.undo()) {
    ElMessage.success('已撤销')
  }
}

function handleRedo() {
  if (groupStore.redo()) {
    ElMessage.success('已重做')
  }
}

function handleAutoGroup() {
  if (studentStore.students.length === 0) {
    ElMessage.warning('没有学生数据，请先导入学生')
    return
  }
  showAutoGroupDialog.value = true
}

function executeAutoGroup() {
  groupStore.clearAllGroups()

  for (let i = 0; i < autoGroupCount.value; i++) {
    groupStore.createGroup(`第${i + 1}组`)
  }

  const students = [...studentStore.students]

  if (autoGroupMode.value === 'random') {
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = students[i]
      const swapTemp = students[j]
      if (temp && swapTemp) {
        students[i] = swapTemp
        students[j] = temp
      }
    }
  } else if (autoGroupMode.value === 'gender') {
    const males = students.filter(s => s.gender === 'male')
    const females = students.filter(s => s.gender === 'female')
    const others = students.filter(s => !s.gender)

    for (let i = males.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = males[i]
      const swapTemp = males[j]
      if (temp && swapTemp) {
        males[i] = swapTemp
        males[j] = temp
      }
    }
    for (let i = females.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = females[i]
      const swapTemp = females[j]
      if (temp && swapTemp) {
        females[i] = swapTemp
        females[j] = temp
      }
    }

    students.length = 0
    const maxLen = Math.max(males.length, females.length)
    for (let i = 0; i < maxLen; i++) {
      const male = males[i]
      const female = females[i]
      if (male) students.push(male)
      if (female) students.push(female)
    }
    students.push(...others)
  }

  students.forEach((student, index) => {
    const groupIndex = index % autoGroupCount.value
    const group = groupStore.groups[groupIndex]
    if (group) {
      groupStore.addStudentToGroup(group.id, student.id)
    }
  })

  showAutoGroupDialog.value = false
  ElMessage.success(`已自动分成 ${autoGroupCount.value} 组`)
}

async function handleExport() {
  if (groups.value.length === 0) {
    ElMessage.warning('没有分组数据可导出')
    return
  }

  try {
    if (exportFormat.value === 'word') {
      await exportGroupsToWord(
        groups.value,
        studentStore.students,
        {
          filename: exportFilename.value,
          fields: exportFields.value as ('name' | 'studentId' | 'gender')[],
        }
      )
    } else {
      exportGroupsToExcel(
        groups.value,
        studentStore.students,
        {
          filename: exportFilename.value,
          fields: exportFields.value as ('name' | 'studentId' | 'gender')[],
        }
      )
    }
    ElMessage.success('导出成功')
    showExportDialog.value = false
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败，请重试')
  }
}
</script>

<style scoped>
.group-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-tertiary);
}

.panel-header {
  padding: 8px 12px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.action-btn.primary {
  background: var(--primary-color);
  color: #fff;
}

.action-btn.primary:hover {
  background: var(--primary-dark);
  color: #fff;
}

.action-btn.danger:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--border-light);
  margin: 0 8px;
}

.panel-stats {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--bg-tertiary);
  border-radius: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 16px;
}

.stat-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.green {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-icon.orange {
  background: #fffbeb;
  color: #d97706;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state p {
  margin-top: 16px;
  font-size: 15px;
  letter-spacing: -0.1px;
}

.empty-state .hint {
  font-size: 13px;
  margin-top: 8px;
  text-align: center;
  line-height: 1.5;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.group-list-enter-active,
.group-list-leave-active {
  transition: all 0.3s ease;
}

.group-list-enter-from,
.group-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
