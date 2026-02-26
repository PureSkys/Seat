<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="drawer-overlay" @click.self="handleClose">
        <div class="drawer-container" :class="[`drawer-${position}`]">
          <div class="drawer-header">
            <h3 class="drawer-title">{{ title }}</h3>
            <button class="drawer-close" @click="handleClose" aria-label="关闭">
              <el-icon :size="20">
                <Close />
              </el-icon>
            </button>
          </div>
          <div class="drawer-content">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    position?: 'left' | 'right'
  }>(),
  {
    title: '',
    position: 'left'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function handleClose() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  transition: opacity var(--transition-base);
}

.drawer-container {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 85%;
  max-width: 360px;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  transition: transform var(--transition-base);
}

.drawer-left {
  left: 0;
  border-radius: 0 var(--radius-2xl) var(--radius-2xl) 0;
}

.drawer-right {
  right: 0;
  border-radius: var(--radius-2xl) 0 0 var(--radius-2xl);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.drawer-left .drawer-header {
  border-radius: 0 var(--radius-2xl) 0 0;
}

.drawer-right .drawer-header {
  border-radius: var(--radius-2xl) 0 0 0;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.drawer-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-close:active {
  background: var(--bg-tertiary);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--transition-base);
}

.drawer-enter-active .drawer-container,
.drawer-leave-active .drawer-container {
  transition: transform var(--transition-base);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-left,
.drawer-leave-to .drawer-left {
  transform: translateX(-100%);
}

.drawer-enter-from .drawer-right,
.drawer-leave-to .drawer-right {
  transform: translateX(100%);
}

@media (min-width: 768px) {
  .drawer-container {
    width: 320px;
  }
}
</style>
