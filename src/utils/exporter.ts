import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx-js-style'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeightRule,
  AlignmentType,
  BorderStyle,
  TextRun,
  VerticalAlign,
  PageOrientation,
  convertInchesToTwip,
} from 'docx'
import type { Seat, Student, SeatConfig } from '@/types'
import { createSeatId } from '@/types'

export interface ExportOptions {
  format: 'excel' | 'word' | 'jpg' | 'png' | 'pdf'
  quality: number
  backgroundColor: string
  filename?: string
  showPodium?: boolean
}

export async function exportToImage(element: HTMLElement, options: ExportOptions): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor,
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const link = document.createElement('a')
  const filename = options.filename || `座位表_${new Date().toLocaleDateString()}`

  if (options.format === 'jpg') {
    link.download = `${filename}.jpg`
    link.href = canvas.toDataURL('image/jpeg', options.quality)
  } else {
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
  }

  link.click()
}

export async function exportToPDF(element: HTMLElement, options: ExportOptions): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor,
    scale: 3,
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)

  const scaledWidth = imgWidth * ratio
  const scaledHeight = imgHeight * ratio
  const x = (pageWidth - scaledWidth) / 2
  const y = (pageHeight - scaledHeight) / 2

  pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight)

  const filename = options.filename || `座位表_${new Date().toLocaleDateString()}`
  pdf.save(`${filename}.pdf`)
}

export function exportToExcel(
  students: Student[],
  seats: Map<string, Seat>,
  config: SeatConfig,
  options: ExportOptions,
): void {
  const data: (string | number)[][] = []

  for (let row = 0; row < config.rows; row++) {
    const rowData: (string | number)[] = []
    for (let col = 0; col < config.cols; col++) {
      const seatId = createSeatId(row, col)
      const seat = seats.get(seatId)
      if (seat?.studentId) {
        const student = students.find((s) => s.id === seat.studentId)
        rowData.push(student?.name || '')
      } else {
        rowData.push('')
      }
    }
    data.push(rowData)
  }

  if (options.showPodium) {
    const podiumRow: (string | number)[] = []
    for (let col = 0; col < config.cols; col++) {
      if (col === 0) {
        podiumRow.push('讲台')
      } else {
        podiumRow.push('')
      }
    }
    data.push(podiumRow)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cellAddress]) {
        ws[cellAddress] = { v: '' }
      }
      ws[cellAddress].s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
        font: {
          sz: 12,
        },
      }
    }
  }

  if (options.showPodium && data.length > 0) {
    const lastRowIndex = data.length - 1
    if (!ws['!merges']) {
      ws['!merges'] = []
    }
    ws['!merges'].push({ s: { r: lastRowIndex, c: 0 }, e: { r: lastRowIndex, c: config.cols - 1 } })

    const podiumCell = ws[XLSX.utils.encode_cell({ r: lastRowIndex, c: 0 })]
    if (podiumCell) {
      podiumCell.s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
        fill: {
          fgColor: { rgb: '667EEA' },
        },
        font: {
          color: { rgb: 'FFFFFF' },
          bold: true,
          sz: 14,
        },
      }
    }
  }

  ws['!cols'] = []
  for (let col = 0; col < config.cols; col++) {
    ws['!cols'].push({ wch: 10 })
  }

  ws['!rows'] = []
  for (let row = 0; row < data.length; row++) {
    ws['!rows'].push({ hpt: 25 })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '座位表')

  const filename = options.filename || `座位表_${new Date().toLocaleDateString()}`
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportToWord(
  students: Student[],
  seats: Map<string, Seat>,
  config: SeatConfig,
  options: ExportOptions,
): Promise<void> {
  const rows: TableRow[] = []

  for (let row = 0; row < config.rows; row++) {
    const cells: TableCell[] = []
    for (let col = 0; col < config.cols; col++) {
      const seatId = createSeatId(row, col)
      const seat = seats.get(seatId)
      let cellContent = ''
      if (seat?.studentId) {
        const student = students.find((s) => s.id === seat.studentId)
        cellContent = student?.name || ''
      }

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellContent,
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: {
            size: 100 / config.cols,
            type: WidthType.PERCENTAGE,
          },
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          },
        }),
      )
    }
    rows.push(
      new TableRow({
        children: cells,
        height: {
          value: convertInchesToTwip(0.5),
          rule: HeightRule.ATLEAST,
        },
      }),
    )
  }

  if (options.showPodium) {
    const podiumCell = new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: '讲 台',
              size: 28,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      columnSpan: config.cols,
      verticalAlign: VerticalAlign.CENTER,
      shading: {
        fill: '667EEA',
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
    })

    rows.push(
      new TableRow({
        children: [podiumCell],
        height: {
          value: convertInchesToTwip(0.4),
          rule: HeightRule.ATLEAST,
        },
      }),
    )
  }

  const table = new Table({
    rows: rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: [table],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const link = document.createElement('a')
  const filename = options.filename || `座位表_${new Date().toLocaleDateString()}`
  link.download = `${filename}.docx`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

export async function exportSeatTable(
  element: HTMLElement | null,
  students: Student[],
  seats: Map<string, Seat>,
  config: SeatConfig,
  options: ExportOptions,
): Promise<void> {
  switch (options.format) {
    case 'excel':
      exportToExcel(students, seats, config, options)
      break
    case 'word':
      await exportToWord(students, seats, config, options)
      break
  }
}
