<template>
  <div class="scheme-manager">
    <div class="scheme-header">
      <h3>方案管理</h3>
      <div class="storage-info">
        <el-tag size="small" type="info">
          存储占用: {{ storageUsed.toFixed(2) }} MB
        </el-tag>
      </div>
    </div>

    <div class="scheme-list">
      <div v-for="scheme in schemes" :key="scheme.id" class="scheme-item"
        :class="{ 'is-active': scheme.id === activeSchemeId }" @click="handleSelectScheme(scheme.id)">
        <div class="scheme-info">
          <div class="scheme-name">
            <el-icon v-if="scheme.id === activeSchemeId" color="#3b82f6">
              <FolderOpened />
            </el-icon>
            <el-icon v-else>
              <Document />
            </el-icon>
            <span>{{ scheme.name }}</span>
          </div>
          <div class="scheme-meta">
            <span class="scheme-date">{{ formatDate(scheme.updatedAt) }}</span>
            <span class="scheme-stats">
              {{ scheme.students.length }} 学生 / {{ scheme.groups.length }} 分组
            </span>
          </div>
        </div>
        <div class="scheme-actions" @click.stop>
          <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, scheme.id)">
            <el-button text size="small">
              <el-icon>
                <MoreFilled />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon>
                    <Edit />
                  </el-icon>重命名
                </el-dropdown-item>
                <el-dropdown-item command="duplicate">
                  <el-icon>
                    <CopyDocument />
                  </el-icon>复制
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon>
                    <Download />
                  </el-icon>导出
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided :disabled="schemes.length <= 1">
                  <el-icon>
                    <Delete />
                  </el-icon>删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div class="scheme-footer">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon>
          <Plus />
        </el-icon>新建方案
      </el-button>
      <el-button @click="showImportDialog = true">
        <el-icon>
          <Upload />
        </el-icon>导入方案
      </el-button>
    </div>

    <el-dialog v-model="showCreateDialog" title="新建方案" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="方案名称">
          <el-input v-model="createForm.name" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="可选：方案描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRenameDialog" title="重命名方案" width="400px">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="方案名称">
          <el-input v-model="renameForm.name" placeholder="请输入新的方案名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRename">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="导入方案" width="500px">
      <div class="import-area">
        <el-upload drag :auto-upload="false" :show-file-list="false" accept=".json" :on-change="handleFileSelect">
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽 JSON 文件到此处，或<em>点击选择</em>
          </div>
        </el-upload>
      </div>
      <div v-if="importPreview" class="import-preview">
        <h4>预览</h4>
        <p><strong>名称:</strong> {{ importPreview.name }}</p>
        <p><strong>学生数:</strong> {{ importPreview.students?.length || 0 }}</p>
        <p><strong>分组数:</strong> {{ importPreview.groups?.length || 0 }}</p>
      </div>
      <template #footer>
        <el-button @click="cancelImport">取消</el-button>
        <el-button type="primary" :disabled="!importPreview" @click="confirmImport">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  FolderOpened,
  Document,
  MoreFilled,
  Edit,
  CopyDocument,
  Download,
  Delete,
  Plus,
  Upload,
  UploadFilled,
} from '@element-plus/icons-vue'
import { useSchemeStore } from '@/stores/scheme'
import type { DataScheme } from '@/types'

const emit = defineEmits<{
  schemeChanged: [id: string]
}>()

const schemeStore = useSchemeStore()

const schemes = computed(() => schemeStore.schemes)
const activeSchemeId = computed(() => schemeStore.activeSchemeId)
const storageUsed = computed(() => schemeStore.getStorageUsage().used)

const showCreateDialog = ref(false)
const showRenameDialog = ref(false)
const showImportDialog = ref(false)

const createForm = ref({ name: '', description: '' })
const renameForm = ref({ id: '', name: '' })
const importPreview = ref<DataScheme | null>(null)
const importData = ref('')

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleSelectScheme(id: string) {
  if (id !== activeSchemeId.value) {
    const result = schemeStore.switchScheme(id)
    if (result.success) {
      ElMessage.success(result.message)
      emit('schemeChanged', id)
    }
  }
}

function handleCommand(command: string, schemeId: string) {
  switch (command) {
    case 'rename':
      const scheme = schemeStore.getScheme(schemeId)
      if (scheme) {
        renameForm.value = { id: schemeId, name: scheme.name }
        showRenameDialog.value = true
      }
      break
    case 'duplicate':
      handleDuplicate(schemeId)
      break
    case 'export':
      handleExport(schemeId)
      break
    case 'delete':
      handleDelete(schemeId)
      break
  }
}

function handleCreate() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入方案名称')
    return
  }
  const result = schemeStore.createScheme(
    createForm.value.name.trim(),
    createForm.value.description.trim() || undefined
  )
  if (result.success) {
    ElMessage.success('方案创建成功')
    showCreateDialog.value = false
    createForm.value = { name: '', description: '' }
    if (result.data) {
      schemeStore.switchScheme(result.data.id)
      emit('schemeChanged', result.data.id)
    }
  }
}

function handleRename() {
  if (!renameForm.value.name.trim()) {
    ElMessage.warning('请输入方案名称')
    return
  }
  const result = schemeStore.renameScheme(renameForm.value.id, renameForm.value.name.trim())
  if (result.success) {
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
  }
}

function handleDuplicate(schemeId: string) {
  const result = schemeStore.duplicateScheme(schemeId)
  if (result.success) {
    ElMessage.success('方案复制成功')
  }
}

function handleExport(schemeId: string) {
  const jsonData = schemeStore.exportScheme(schemeId)
  if (jsonData) {
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const scheme = schemeStore.getScheme(schemeId)
    a.href = url
    a.download = `${scheme?.name || 'scheme'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }
}

function handleDelete(schemeId: string) {
  if (schemes.value.length <= 1) {
    ElMessage.warning('至少保留一个方案')
    return
  }
  ElMessageBox.confirm('确定要删除该方案吗？此操作不可撤销。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const wasActive = schemeId === activeSchemeId.value
      const result = schemeStore.deleteScheme(schemeId)
      if (result.success) {
        ElMessage.success('删除成功')
        if (wasActive && activeSchemeId.value) {
          emit('schemeChanged', activeSchemeId.value)
        }
      }
    })
    .catch(() => { })
}

function handleFileSelect(file: { raw: File }) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.name && Array.isArray(data.students) && Array.isArray(data.seats)) {
        importPreview.value = data
        importData.value = e.target?.result as string
      } else {
        ElMessage.error('无效的方案文件格式')
      }
    } catch {
      ElMessage.error('文件解析失败')
    }
  }
  reader.readAsText(file.raw)
}

function cancelImport() {
  showImportDialog.value = false
  importPreview.value = null
  importData.value = ''
}

function confirmImport() {
  if (importData.value) {
    const result = schemeStore.importScheme(importData.value)
    if (result.success) {
      ElMessage.success('导入成功')
      cancelImport()
    } else {
      ElMessage.error(result.message)
    }
  }
}
</script>

<style scoped>
.scheme-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scheme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
}

.scheme-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.scheme-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.scheme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.scheme-item:hover {
  background: var(--bg-hover);
}

.scheme-item.is-active {
  background: var(--primary-bg);
  border-color: var(--primary-color);
}

.scheme-info {
  flex: 1;
  min-width: 0;
}

.scheme-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.scheme-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scheme-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.scheme-actions {
  flex-shrink: 0;
}

.scheme-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-light);
}

.scheme-footer .el-button {
  flex: 1;
}

.import-area {
  margin-bottom: 16px;
}

.import-preview {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.import-preview h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.import-preview p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
