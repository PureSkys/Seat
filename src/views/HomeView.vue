<template>
  <div class="home-view" :class="{ 'is-mobile': responsive.isMobile }">
    <MobileNav v-if="responsive.isMobile" @toggle-left="showLeftDrawer = true" @toggle-right="showRightDrawer = true" />

    <div v-if="!responsive.isMobile" class="toolbar-card">
      <Toolbar @random-arrange="handleRandomArrange" @smart-arrange="handleSmartArrangeFromToolbar"
        @export="showExportDialog = true" @save-scheme="handleSaveScheme" @load-scheme="handleLoadScheme"
        @switch-scheme="handleSwitchScheme" />
    </div>

    <div v-else class="mobile-toolbar">
      <el-button type="primary" size="small" @click="handleRandomArrange">
        <el-icon>
          <Refresh />
        </el-icon>
        随机排座
      </el-button>
      <el-dropdown @command="handleSmartArrangeFromDropdown">
        <el-button type="primary" size="small">
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
      <el-button size="small" @click="showExportDialog = true">
        <el-icon>
          <Download />
        </el-icon>
        导出
      </el-button>
      <el-button size="small" @click="showMobileSettings = true">
        <el-icon>
          <Setting />
        </el-icon>
        设置
      </el-button>
    </div>

    <main class="main-content">
      <aside v-if="!responsive.isMobile" class="sidebar sidebar-left">
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
        <SeatGrid ref="seatGridRef" :scale="seatGridScale" @scale-change="handleScaleChange" />
      </section>

      <aside v-if="responsive.isDesktop" class="sidebar sidebar-right">
        <GroupPanel />
      </aside>
    </main>

    <MobileDrawer v-model="showLeftDrawer" title="学生管理" position="left">
      <div class="drawer-sidebar">
        <div class="drawer-section">
          <StudentImport />
        </div>
        <div class="drawer-section drawer-section-flex">
          <div class="section-title">
            <el-icon>
              <User />
            </el-icon>
            待排学生
          </div>
          <StudentList class="student-list-container" />
        </div>
      </div>
    </MobileDrawer>

    <MobileDrawer v-model="showRightDrawer" title="分组管理" position="right">
      <div class="drawer-sidebar">
        <GroupPanel />
      </div>
    </MobileDrawer>

    <el-drawer v-model="showMobileSettings" title="座位设置" direction="btt" size="70%">
      <SeatConfig />
    </el-drawer>

    <ExportPanel v-model="showExportDialog" :target-element="seatGridElement" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Refresh, MagicStick, Download, Setting, ArrowDown } from '@element-plus/icons-vue'
import StudentImport from '@/components/student/StudentImport.vue'
import StudentList from '@/components/student/StudentList.vue'
import SeatGrid from '@/components/seat/SeatGrid.vue'
import Toolbar from '@/components/common/Toolbar.vue'
import ExportPanel from '@/components/export/ExportPanel.vue'
import GroupPanel from '@/components/group/GroupPanel.vue'
import MobileNav from '@/components/common/MobileNav.vue'
import MobileDrawer from '@/components/common/MobileDrawer.vue'
import SeatConfig from '@/components/seat/SeatConfig.vue'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useGroupStore } from '@/stores/group'
import { useSchemeStore } from '@/stores/scheme'
import { useArrange, useResponsive } from '@/composables'
import type { SmartArrangeRule } from '@/types'

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const groupStore = useGroupStore()
const schemeStore = useSchemeStore()
const { randomArrange, smartArrange } = useArrange()
const responsive = useResponsive()

const seatGridRef = ref<InstanceType<typeof SeatGrid> | null>(null)
const showExportDialog = ref(false)
const showLeftDrawer = ref(false)
const showRightDrawer = ref(false)
const showMobileSettings = ref(false)
const seatGridScale = ref(1)

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

function handleSmartArrangeFromToolbar(rule: SmartArrangeRule) {
  executeSmartArrange(rule)
}

function handleSmartArrangeFromDropdown(command: string) {
  const [type, order] = command.split('-')
  const rule: SmartArrangeRule = {
    type: type as SmartArrangeRule['type'],
    ascending: order === 'asc',
  }
  executeSmartArrange(rule)
}

function executeSmartArrange(rule: SmartArrangeRule) {
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

function handleScaleChange(scale: number) {
  seatGridScale.value = scale
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
  width: var(--sidebar-width);
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

.mobile-toolbar {
  display: none;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.mobile-toolbar :deep(.el-button) {
  flex: 1;
  min-width: 0;
}

.drawer-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 12px;
}

.drawer-section {
  padding: 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
}

.drawer-section-flex {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (max-width: 991px) {
  .home-view {
    padding: 16px;
    gap: 12px;
  }

  .sidebar-left {
    width: var(--sidebar-width-tablet);
  }

  .sidebar-right {
    display: none;
  }
}

@media (max-width: 767px) {
  .home-view {
    padding: 0;
    gap: 0;
  }

  .home-view.is-mobile {
    padding-top: 0;
  }

  .toolbar-card {
    display: none;
  }

  .mobile-toolbar {
    display: flex;
  }

  .main-content {
    gap: 0;
    padding: 12px;
  }

  .sidebar {
    display: none;
  }

  .seat-area {
    padding: 0;
    overflow: auto;
    align-items: center;
    justify-content: flex-start;
  }
}

@media (max-width: 575px) {
  .mobile-toolbar {
    gap: 6px;
    padding: 8px 10px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .mobile-toolbar :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
  }

  .mobile-toolbar :deep(.el-button .el-icon) {
    font-size: 14px;
  }
}
</style>
