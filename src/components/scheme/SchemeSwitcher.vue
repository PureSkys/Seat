<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <el-button class="scheme-switcher">
      <el-icon>
        <FolderOpened />
      </el-icon>
      <span class="scheme-name">{{ activeSchemeName }}</span>
      <el-icon class="el-icon--right">
        <ArrowDown />
      </el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu class="scheme-dropdown">
        <div class="dropdown-header">
          <span>切换方案</span>
          <el-button text size="small" @click="showManager = true">
            <el-icon>
              <Setting />
            </el-icon>管理
          </el-button>
        </div>
        <el-dropdown-item v-for="scheme in schemes" :key="scheme.id" :command="scheme.id"
          :class="{ 'is-active': scheme.id === activeSchemeId }">
          <div class="scheme-option">
            <el-icon v-if="scheme.id === activeSchemeId" color="#3b82f6">
              <FolderOpened />
            </el-icon>
            <el-icon v-else>
              <Document />
            </el-icon>
            <span class="name">{{ scheme.name }}</span>
            <span class="stats">{{ scheme.students.length }}人</span>
          </div>
        </el-dropdown-item>
        <el-dropdown-item divided command="__create__">
          <el-icon>
            <Plus />
          </el-icon>
          新建方案
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <el-dialog v-model="showManager" title="方案管理" width="500px" destroy-on-close>
    <SchemeManager @scheme-changed="handleSchemeChanged" />
  </el-dialog>

  <el-dialog v-model="showCreateDialog" title="新建方案" width="400px">
    <el-form :model="createForm" label-width="80px">
      <el-form-item label="方案名称">
        <el-input v-model="createForm.name" placeholder="请输入方案名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showCreateDialog = false">取消</el-button>
      <el-button type="primary" @click="handleCreate">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  FolderOpened,
  ArrowDown,
  Setting,
  Document,
  Plus,
} from '@element-plus/icons-vue'
import { useSchemeStore } from '@/stores/scheme'
import SchemeManager from './SchemeManager.vue'

const emit = defineEmits<{
  schemeChanged: [id: string]
}>()

const schemeStore = useSchemeStore()

const schemes = computed(() => schemeStore.schemes)
const activeSchemeId = computed(() => schemeStore.activeSchemeId)
const activeSchemeName = computed(() => {
  const scheme = schemeStore.activeScheme
  return scheme?.name || '未选择方案'
})

const showManager = ref(false)
const showCreateDialog = ref(false)
const createForm = ref({ name: '' })

function handleCommand(command: string) {
  if (command === '__create__') {
    createForm.value = { name: `方案 ${schemes.value.length + 1}` }
    showCreateDialog.value = true
    return
  }

  if (command !== activeSchemeId.value) {
    const result = schemeStore.switchScheme(command)
    if (result.success) {
      ElMessage.success(result.message)
      emit('schemeChanged', command)
    }
  }
}

function handleCreate() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入方案名称')
    return
  }
  const result = schemeStore.createScheme(createForm.value.name.trim())
  if (result.success) {
    ElMessage.success('方案创建成功')
    showCreateDialog.value = false
    if (result.data) {
      schemeStore.switchScheme(result.data.id)
      emit('schemeChanged', result.data.id)
    }
  }
}

function handleSchemeChanged(id: string) {
  emit('schemeChanged', id)
}
</script>

<style scoped>
.scheme-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-weight: 500;
  transition: all 0.2s;
}

.scheme-switcher:hover {
  background: var(--bg-hover);
  border-color: var(--primary-light);
  color: var(--primary-color);
}

.scheme-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scheme-dropdown .dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-light);
  font-size: 12px;
  color: var(--text-tertiary);
}

.scheme-dropdown .scheme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.scheme-dropdown .scheme-option .name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scheme-dropdown .scheme-option .stats {
  font-size: 12px;
  color: var(--text-tertiary);
}

.scheme-dropdown .el-dropdown-menu__item.is-active {
  background-color: var(--primary-bg);
  color: var(--primary-color);
}
</style>
