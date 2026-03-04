<template>
  <span class="gender-icon" :class="[genderClass, sizeClass]" :title="titleText" role="img" :aria-label="titleText">
    <svg v-if="gender === 'male'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="gender-svg">
      <circle cx="10" cy="14" r="5" stroke="currentColor" stroke-width="2" />
      <path d="M14 10L19 5M19 5H15M19 5V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <svg v-else-if="gender === 'female'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="gender-svg">
      <circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="2" />
      <path d="M12 14V22M9 19H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="gender-svg">
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type GenderType = 'male' | 'female' | undefined

const props = withDefaults(defineProps<{
  gender?: GenderType
  size?: 'small' | 'default' | 'large'
}>(), {
  gender: undefined,
  size: 'default'
})

const genderClass = computed(() => {
  if (props.gender === 'male') return 'gender-male'
  if (props.gender === 'female') return 'gender-female'
  return 'gender-unknown'
})

const sizeClass = computed(() => `size-${props.size}`)

const titleText = computed(() => {
  if (props.gender === 'male') return '男'
  if (props.gender === 'female') return '女'
  return '未知'
})
</script>

<style scoped>
.gender-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: all var(--transition-base, 0.2s ease);
}

.gender-svg {
  width: 100%;
  height: 100%;
}

.size-small {
  width: 14px;
  height: 14px;
}

.size-default {
  width: 16px;
  height: 16px;
}

.size-large {
  width: 20px;
  height: 20px;
}

.gender-male {
  color: #3b82f6;
}

.gender-male:hover {
  background: rgba(59, 130, 246, 0.1);
}

.gender-female {
  color: #ec4899;
}

.gender-female:hover {
  background: rgba(236, 72, 153, 0.1);
}

.gender-unknown {
  color: #94a3b8;
}

.gender-unknown:hover {
  background: rgba(148, 163, 184, 0.1);
}

@media (max-width: 575px) {
  .size-small {
    width: 12px;
    height: 12px;
  }

  .size-default {
    width: 14px;
    height: 14px;
  }

  .size-large {
    width: 16px;
    height: 16px;
  }
}
</style>
