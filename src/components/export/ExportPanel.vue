<template>
  <el-dialog v-model="visible" title="导出座位表" width="500px">
    <el-form :model="exportOptions" label-width="100px">
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportOptions.format">
          <el-radio-button value="excel">Excel 表格</el-radio-button>
          <el-radio-button value="word">Word 文档</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="显示讲台">
        <el-switch v-model="exportOptions.showPodium" />
      </el-form-item>

      <el-form-item label="文件名">
        <el-input v-model="exportOptions.filename" placeholder="座位表" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting">
        导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import { useSeatStore } from '@/stores/seat'
import { useConfigStore } from '@/stores/config'
import { exportSeatTable } from '@/utils/exporter'
import type { ExportOptions } from '@/utils/exporter'

const props = defineProps<{
  modelValue: boolean
  targetElement: HTMLElement | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const studentStore = useStudentStore()
const seatStore = useSeatStore()
const configStore = useConfigStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const exporting = ref(false)

const exportOptions = ref<ExportOptions>({
  format: 'excel',
  quality: 1,
  backgroundColor: '#ffffff',
  filename: 'seat-table',
  showPodium: true
})

watch(() => props.modelValue, (val) => {
  if (val) {
    exportOptions.value.showPodium = configStore.showPodium
  }
})

async function handleExport() {
  exporting.value = true

  try {
    await exportSeatTable(
      props.targetElement,
      studentStore.students,
      seatStore.seats,
      configStore.seatConfig,
      {
        format: exportOptions.value.format,
        quality: exportOptions.value.quality,
        backgroundColor: exportOptions.value.backgroundColor,
        filename: exportOptions.value.filename,
        showPodium: exportOptions.value.showPodium
      }
    )

    ElMessage.success('导出成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    exporting.value = false
  }
}
</script>
