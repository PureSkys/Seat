import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Seat, SeatGrid, SeatPosition } from '@/types'
import { createSeatId } from '@/types'
import { DEFAULT_CONFIG } from '@/types/config'
import { useSchemeStore } from './scheme'

export const useSeatStore = defineStore('seat', () => {
  const schemeStore = useSchemeStore()

  const rows = ref(DEFAULT_CONFIG.rows)
  const cols = ref(DEFAULT_CONFIG.cols)
  const seats = ref<Map<string, Seat>>(new Map())

  function syncFromScheme(): void {
    const scheme = schemeStore.activeScheme
    if (scheme) {
      rows.value = scheme.config.seat.rows
      cols.value = scheme.config.seat.cols
      const newSeats = new Map<string, Seat>()
      scheme.seats.forEach((seat) => {
        newSeats.set(seat.id, { ...seat })
      })

      for (let r = 0; r < rows.value; r++) {
        for (let c = 0; c < cols.value; c++) {
          const id = createSeatId(r, c)
          if (!newSeats.has(id)) {
            newSeats.set(id, {
              id,
              row: r,
              col: c,
              isLocked: false,
            })
          }
        }
      }
      seats.value = newSeats
    } else {
      rows.value = DEFAULT_CONFIG.rows
      cols.value = DEFAULT_CONFIG.cols
      seats.value = new Map()
    }
  }

  function syncToScheme(): void {
    const seatsArray = Array.from(seats.value.values())
    schemeStore.updateActiveSchemeSeats(seatsArray)
  }

  const seatGrid = computed<SeatGrid>(() => {
    const grid: SeatGrid = []
    for (let r = 0; r < rows.value; r++) {
      const row: Seat[] = []
      for (let c = 0; c < cols.value; c++) {
        const id = createSeatId(r, c)
        let seat = seats.value.get(id)
        if (!seat) {
          seat = {
            id,
            row: r,
            col: c,
            isLocked: false,
          }
          seats.value.set(id, seat)
        }
        row.push(seat)
      }
      grid.push(row)
    }
    return grid
  })

  const occupiedSeats = computed(() => {
    const occupied = new Map<string, string>()
    seats.value.forEach((seat, id) => {
      if (seat.studentId) {
        occupied.set(id, seat.studentId)
      }
    })
    return occupied
  })

  const emptySeats = computed(() => {
    const empty: Seat[] = []
    for (let r = 0; r < rows.value; r++) {
      for (let c = 0; c < cols.value; c++) {
        const id = createSeatId(r, c)
        const seat = seats.value.get(id)
        if (!seat?.studentId && !seat?.isLocked) {
          empty.push(seat || { id, row: r, col: c, isLocked: false })
        }
      }
    }
    return empty
  })

  const totalSeats = computed(() => rows.value * cols.value)

  const occupiedCount = computed(() => occupiedSeats.value.size)

  function initSeats(r: number, c: number) {
    rows.value = r
    cols.value = c
    const newSeats = new Map<string, Seat>()
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        const id = createSeatId(row, col)
        newSeats.set(id, {
          id,
          row,
          col,
          isLocked: false,
          studentId: undefined,
        })
      }
    }
    seats.value = newSeats
    syncToScheme()
  }

  function getSeat(row: number, col: number): Seat | undefined {
    return seats.value.get(createSeatId(row, col))
  }

  function getSeatById(id: string): Seat | undefined {
    return seats.value.get(id)
  }

  function setStudentToSeat(seatId: string, studentId: string | undefined) {
    const seat = seats.value.get(seatId)
    if (seat && !seat.isLocked) {
      if (studentId) {
        seats.value.forEach((s) => {
          if (s.studentId === studentId) {
            s.studentId = undefined
          }
        })
      }
      seat.studentId = studentId
      syncToScheme()
    }
  }

  function forceSetSeat(seatId: string, studentId: string | undefined, isLocked: boolean) {
    const seat = seats.value.get(seatId)
    if (seat) {
      seat.studentId = studentId
      seat.isLocked = isLocked
      syncToScheme()
    }
  }

  function removeStudentFromSeat(studentId: string) {
    seats.value.forEach((seat) => {
      if (seat.studentId === studentId) {
        seat.studentId = undefined
      }
    })
    syncToScheme()
  }

  function toggleSeatLock(seatId: string) {
    const seat = seats.value.get(seatId)
    if (seat) {
      seat.isLocked = !seat.isLocked
      syncToScheme()
    }
  }

  function clearAllSeats() {
    seats.value.forEach((seat) => {
      if (!seat.isLocked) {
        seat.studentId = undefined
      }
    })
    syncToScheme()
  }

  function getStudentSeatPosition(studentId: string): SeatPosition | null {
    for (const seat of seats.value.values()) {
      if (seat.studentId === studentId) {
        return { row: seat.row, col: seat.col }
      }
    }
    return null
  }

  function swapStudents(seatId1: string, seatId2: string) {
    const seat1 = seats.value.get(seatId1)
    const seat2 = seats.value.get(seatId2)
    if (seat1 && seat2 && !seat1.isLocked && !seat2.isLocked) {
      const temp = seat1.studentId
      seat1.studentId = seat2.studentId
      seat2.studentId = temp
      syncToScheme()
    }
  }

  function $reset() {
    rows.value = DEFAULT_CONFIG.rows
    cols.value = DEFAULT_CONFIG.cols
    seats.value = new Map()
  }

  watch(
    () => schemeStore.activeSchemeId,
    () => {
      syncFromScheme()
    },
    { immediate: true },
  )

  return {
    rows,
    cols,
    seats,
    seatGrid,
    occupiedSeats,
    emptySeats,
    totalSeats,
    occupiedCount,
    initSeats,
    getSeat,
    getSeatById,
    setStudentToSeat,
    forceSetSeat,
    removeStudentFromSeat,
    toggleSeatLock,
    clearAllSeats,
    getStudentSeatPosition,
    swapStudents,
    syncFromScheme,
    $reset,
  }
})
