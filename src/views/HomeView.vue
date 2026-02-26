<template>
  <div class="home-view">
    <div class="toolbar-card">
      <Toolbar @random-arrange="handleRandomArrange" @smart-arrange="handleSmartArrange"
        @export="showExportDialog = true" @save-scheme="handleSaveScheme" @load-scheme="handleLoadScheme"
        @switch-scheme="handleSwitchScheme" />
    </div>

    <main class="main-content">
      <aside class="sidebar sidebar-left">
        <div class="sidebar-section">
          <StudentImport />
        </div>

        <div class="sidebar-section flex-1">
          <div class="section-title">
            <el-icon>
              <User />
            </el-icon>
            待排学生
          </div>
          <StudentList class="student-list-container" />
        </div>
      </aside>

      <section class="seat-area">
        <SeatGrid ref="seatGridRef" />
      </section>

      <aside class="sidebar sidebar-right">
        <GroupPanel />
      </aside>
    </main>

    <ExportPanel v-model="showExportDialog" :target-element="seatGridElement" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import StudentImport from '@/components/student/StudentImport.vue'
import StudentList from '@/components/student/StudentList.vue'
import SeatGrid from '@/components/seat/SeatGrid.vue'
import Toolbar from '@/components/common/Toolbar.vue'
import ExportPanel from '@/components/export/ExportPanel.vue'
import GroupPanel from '@/components/group/GroupPanel.vue'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useGroupStore } from '@/stores/group'
import { useSchemeStore } from '@/stores/scheme'
import { useArrange } from '@/composables'
import type { SmartArrangeRule } from '@/types'

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const groupStore = useGroupStore()
const schemeStore = useSchemeStore()
const { randomArrange, smartArrange } = useArrange()

const seatGridRef = ref<InstanceType<typeof SeatGrid> | null>(null)
const showExportDialog = ref(false)

const seatGridElement = computed(() => seatGridRef.value?.gridRef || null)

function handleRandomArrange() {
  if (studentStore.unseatedStudents.length === 0) {
    ElMessage.warning('没有待排座的学生')
    return
  }
  if (seatStore.emptySeats.length === 0) {
    ElMessage.warning('没有空座位')
    return
  }
  randomArrange()
  ElMessage.success('随机排座完成')
}

function handleSmartArrange(rule: SmartArrangeRule) {
  if (studentStore.unseatedStudents.length === 0) {
    ElMessage.warning('没有待排座的学生')
    return
  }
  if (seatStore.emptySeats.length === 0) {
    ElMessage.warning('没有空座位')
    return
  }
  smartArrange(rule)
  ElMessage.success('智能排座完成')
}

function handleSaveScheme(name: string) {
  const seatsData = Array.from(seatStore.seats.values())
  const groupsData = groupStore.exportGroups()
  const result = schemeStore.createScheme(name)
  if (result.success && result.data) {
    schemeStore.saveCurrentData(studentStore.students, seatsData, groupsData)
    schemeStore.switchScheme(result.data.id)
    ElMessage.success('方案保存成功')
  }
}

function handleLoadScheme(id: string) {
  const result = schemeStore.switchScheme(id)
  if (result.success) {
    ElMessage.success('方案加载成功')
  } else {
    ElMessage.error(result.message)
  }
}

function handleSwitchScheme(id: string) {
  if (id === 'default') {
    const firstScheme = schemeStore.schemes[0]
    if (firstScheme) {
      handleLoadScheme(firstScheme.id)
    }
    return
  }
  handleLoadScheme(id)
}

onMounted(() => {
  if (schemeStore.isInitialized) {
    seatStore.syncFromScheme()
    studentStore.syncFromScheme()
    groupStore.syncFromScheme()
  }
})

watch(
  () => schemeStore.activeSchemeId,
  () => {
    seatStore.syncFromScheme()
    studentStore.syncFromScheme()
    groupStore.syncFromScheme()
  }
)
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
  gap: 16px;
}

.toolbar-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  padding: 10px 16px;
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 20px;
  height: 100%;
}

.sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.sidebar-left {
  gap: 12px;
  padding: 16px;
}

.sidebar-right {
  padding: 0;
}

.sidebar-section {
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
}

.sidebar-section.flex-1 {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  margin: 0;
  border-radius: var(--radius-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-size: 14px;
  letter-spacing: -0.2px;
}

.section-title .el-icon {
  color: var(--primary-color);
  font-size: 16px;
}

.student-list-container {
  flex: 1;
  min-height: 0;
}

.seat-area {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: transparent;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
</style>
