<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-button-group>
        <el-button type="primary" @click="$emit('randomArrange')">
          <el-icon>
            <Refresh />
          </el-icon>
          随机排座
        </el-button>
        <el-dropdown @command="handleSmartArrange">
          <el-button type="primary">
            <el-icon>
              <MagicStick />
            </el-icon>
            智能排座
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="height-asc">按身高升序</el-dropdown-item>
              <el-dropdown-item command="height-desc">按身高降序</el-dropdown-item>
              <el-dropdown-item command="score-asc">按成绩升序</el-dropdown-item>
              <el-dropdown-item command="score-desc">按成绩降序</el-dropdown-item>
              <el-dropdown-item command="gender-asc">按性别分组</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-button-group>

      <el-button type="warning" @click="handleReset">
        <el-icon>
          <RefreshRight />
        </el-icon>
        重置
      </el-button>
    </div>

    <div class="toolbar-right">
      <el-button @click="showConfigDrawer = true">
        <el-icon>
          <Setting />
        </el-icon>
        座位设置
      </el-button>

      <el-button type="success" @click="$emit('export')">
        <el-icon>
          <Download />
        </el-icon>
        导出
      </el-button>

      <SchemeSwitcher @scheme-changed="handleSchemeChanged" />
    </div>

    <el-drawer v-model="showConfigDrawer" title="座位设置" direction="rtl" size="300px">
      <SeatConfig />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  RefreshRight,
  MagicStick,
  Setting,
  Download,
  ArrowDown,
} from '@element-plus/icons-vue'
import SeatConfig from '@/components/seat/SeatConfig.vue'
import SchemeSwitcher from '@/components/scheme/SchemeSwitcher.vue'
import { useSchemeStore } from '@/stores/scheme'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useGroupStore } from '@/stores/group'
import type { SmartArrangeRule } from '@/types'

const emit = defineEmits<{
  randomArrange: []
  smartArrange: [rule: SmartArrangeRule]
  reset: []
  export: []
  saveScheme: [name: string]
  loadScheme: [id: string]
  switchScheme: [id: string]
}>()

const schemeStore = useSchemeStore()
const studentStore = useStudentStore()
const seatStore = useSeatStore()
const groupStore = useGroupStore()

const showConfigDrawer = ref(false)

function handleSmartArrange(command: string) {
  const [type, order] = command.split('-')
  const rule: SmartArrangeRule = {
    type: type as SmartArrangeRule['type'],
    ascending: order === 'asc',
  }
  emit('smartArrange', rule)
}

function handleReset() {
  const scheme = schemeStore.activeScheme
  const schemeName = scheme?.name || '当前方案'

  ElMessageBox.confirm(
    `确定要重置"${schemeName}"的数据吗？这将清空该方案的所有学生、座位和分组信息。`,
    '重置确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      studentStore.$reset()
      seatStore.$reset()
      groupStore.$reset()

      seatStore.initSeats(schemeStore.activeScheme?.config.seat.rows || 5, schemeStore.activeScheme?.config.seat.cols || 8)

      ElMessage.success(`已重置"${schemeName}"的数据`)
    })
    .catch(() => { })
}

function handleSchemeChanged(id: string) {
  emit('switchScheme', id)
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  background: transparent;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 0 0 auto;
}

.toolbar-left {
  justify-content: flex-start;
}

.toolbar-right {
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .toolbar {
    gap: 8px;
  }

  .toolbar-left,
  .toolbar-right {
    gap: 6px;
  }

  .toolbar :deep(.el-button) {
    padding: 6px 10px;
    font-size: 12px;
  }
}

.toolbar :deep(.el-button) {
  border-radius: var(--radius-lg);
  font-weight: 500;
  padding: 8px 14px;
  height: auto;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.toolbar :deep(.el-button::after) {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.toolbar :deep(.el-button:active::after) {
  opacity: 1;
  transform: scale(2);
}

.toolbar :deep(.el-button:hover) {
  transform: translateY(-2px);
}

.toolbar :deep(.el-button:active) {
  transform: translateY(0) scale(0.98);
}

.toolbar :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar :deep(.el-button--primary:hover) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.toolbar :deep(.el-button--primary:active) {
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
}

.toolbar :deep(.el-button--success) {
  background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar :deep(.el-button--success:hover) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.toolbar :deep(.el-button--success:active) {
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
}

.toolbar :deep(.el-button--warning) {
  background: linear-gradient(135deg, var(--warning-color) 0%, #d97706 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar :deep(.el-button--warning:hover) {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.toolbar :deep(.el-button--warning:active) {
  box-shadow: 0 1px 4px rgba(245, 158, 11, 0.3);
}

.toolbar :deep(.el-button.is-text) {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar :deep(.el-button.is-text:hover) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.toolbar :deep(.el-button.is-text:active) {
  background: var(--bg-secondary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar :deep(.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.is-text)) {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar :deep(.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.is-text):hover) {
  background: var(--bg-hover);
  border-color: var(--primary-light);
  color: var(--primary-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.toolbar :deep(.el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.is-text):active) {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
}

.toolbar :deep(.el-button-group) {
  display: flex;
}

.toolbar :deep(.el-button-group .el-button) {
  border-radius: 0;
}

.toolbar :deep(.el-button-group .el-button:first-child) {
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
}

.toolbar :deep(.el-button-group .el-button:last-child) {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.toolbar :deep(.el-dropdown) {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.toolbar :deep(.el-dropdown .el-button) {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
}

.toolbar :deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--primary-bg);
  color: var(--primary-color);
  font-weight: 600;
}
</style>
