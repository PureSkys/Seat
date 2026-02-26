import { ref, onMounted, onUnmounted } from 'vue'

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  isTouch: boolean
}

const breakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
}

function checkScreenSize(): ResponsiveState {
  const width = window.innerWidth
  const height = window.innerHeight

  return {
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    screenWidth: width,
    screenHeight: height,
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }
}

export function useResponsive() {
  const state = ref<ResponsiveState>(checkScreenSize())

  function updateState() {
    state.value = checkScreenSize()
  }

  onMounted(() => {
    window.addEventListener('resize', updateState)
    updateState()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateState)
  })

  return state
}

let globalState: ResponsiveState | null = null
let listeners = 0

function updateGlobalState() {
  globalState = checkScreenSize()
}

export function useResponsiveGlobal() {
  const state = ref<ResponsiveState>(globalState || checkScreenSize())

  if (listeners === 0) {
    globalState = checkScreenSize()
    window.addEventListener('resize', updateGlobalState)
  }

  function syncState() {
    if (globalState) {
      state.value = { ...globalState }
    }
  }

  onMounted(() => {
    listeners++
    syncState()
    window.addEventListener('resize', syncState)
  })

  onUnmounted(() => {
    listeners--
    window.removeEventListener('resize', syncState)
    if (listeners === 0) {
      window.removeEventListener('resize', updateGlobalState)
      globalState = null
    }
  })

  return state
}

export function isMobileDevice(): boolean {
  return window.innerWidth < breakpoints.md
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}
