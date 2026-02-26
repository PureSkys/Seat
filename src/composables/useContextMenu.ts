import { ref } from 'vue'

const activeDropdownRef = ref<{ handleClose: () => void } | null>(null)

export function useContextMenu() {
  function openMenu(dropdown: { handleClose: () => void }) {
    if (activeDropdownRef.value && activeDropdownRef.value !== dropdown) {
      activeDropdownRef.value.handleClose()
    }
    activeDropdownRef.value = dropdown
  }

  function closeMenu() {
    if (activeDropdownRef.value) {
      activeDropdownRef.value.handleClose()
      activeDropdownRef.value = null
    }
  }

  return {
    openMenu,
    closeMenu,
  }
}
