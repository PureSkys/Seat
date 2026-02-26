<template>
  <div class="mobile-nav">
    <button class="nav-btn" @click="$emit('toggleLeft')" aria-label="学生列表">
      <el-icon :size="22">
        <User />
      </el-icon>
      <span class="nav-label">学生</span>
    </button>

    <div class="nav-center">
      <span class="nav-title">座位编排</span>
    </div>

    <button class="nav-btn" @click="$emit('toggleRight')" aria-label="分组">
      <el-icon :size="22">
        <Grid />
      </el-icon>
      <span class="nav-label">分组</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { User, Grid } from '@element-plus/icons-vue'

defineEmits<{
  toggleLeft: []
  toggleRight: []
}>()
</script>

<style scoped>
.mobile-nav {
  display: none;
  align-items: center;
  justify-content: space-between;
  height: var(--mobile-nav-height);
  padding: 0 8px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-btn:active {
  background: var(--bg-tertiary);
  color: var(--primary-color);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

.nav-center {
  flex: 1;
  text-align: center;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

@media (max-width: 767px) {
  .mobile-nav {
    display: flex;
  }
}
</style>
