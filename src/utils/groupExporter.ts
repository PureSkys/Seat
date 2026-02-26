import * as XLSX from 'xlsx-js-style'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TextRun,
  VerticalAlign,
  HeadingLevel,
  convertInchesToTwip,
} from 'docx'
import type { StudentGroup, Student } from '@/types'

export interface GroupExportOptions {
  filename: string
  fields: ('name' | 'studentId' | 'gender')[]
}

function getStudentFieldValue(student: Student, field: string): string {
  switch (field) {
    case 'name':
      return student.name
    case 'studentId':
      return student.studentId || ''
    case 'gender':
      return student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : ''
    default:
      return ''
  }
}

function getFieldLabel(field: string): string {
  switch (field) {
    case 'name':
      return '姓名'
    case 'studentId':
      return '学号'
    case 'gender':
      return '性别'
    default:
      return field
  }
}

export async function exportGroupsToWord(
  groups: StudentGroup[],
  students: Student[],
  options: GroupExportOptions,
): Promise<void> {
  const children: (Paragraph | Table)[] = []

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '学生分组结果',
          size: 48,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `导出时间：${new Date().toLocaleString()}`,
          size: 20,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  )

  let totalStudents = 0
  groups.forEach((group) => {
    totalStudents += group.studentIds.length
  })

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `共 ${groups.length} 个分组，${totalStudents} 名学生`,
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    }),
  )

  for (const group of groups) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: group.name,
            size: 28,
            bold: true,
          }),
          new TextRun({
            text: `（${group.studentIds.length}人）`,
            size: 22,
            color: '666666',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    )

    if (group.studentIds.length > 0) {
      const headerCells: TableCell[] = options.fields.map(
        (field) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: getFieldLabel(field),
                    size: 22,
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: {
              size: 100 / options.fields.length,
              type: WidthType.PERCENTAGE,
            },
            shading: {
              fill: group.color?.replace('#', '') || 'E0E0E0',
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

      const rows: TableRow[] = [
        new TableRow({
          children: headerCells,
        }),
      ]

      group.studentIds.forEach((studentId) => {
        const student = students.find((s) => s.id === studentId)
        if (student) {
          const cells: TableCell[] = options.fields.map(
            (field) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: getStudentFieldValue(student, field),
                        size: 22,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: {
                  size: 100 / options.fields.length,
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

          rows.push(
            new TableRow({
              children: cells,
            }),
          )
        }
      })

      children.push(
        new Table({
          rows: rows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        }),
      )
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '（暂无学生）',
              size: 20,
              color: '999999',
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        }),
      )
    }

    children.push(
      new Paragraph({
        spacing: { after: 200 },
      }),
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children: children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const link = document.createElement('a')
  link.download = `${options.filename}.docx`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

export function exportGroupsToExcel(
  groups: StudentGroup[],
  students: Student[],
  options: GroupExportOptions,
): void {
  const wb = XLSX.utils.book_new()

  const summaryData: (string | number)[][] = [['学生分组汇总'], [], ['分组名称', '人数']]

  groups.forEach((group) => {
    summaryData.push([group.name, group.studentIds.length])
  })

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 10 }]

  const summaryRange = XLSX.utils.decode_range(summaryWs['!ref'] || 'A1')
  for (let R = summaryRange.s.r; R <= summaryRange.e.r; ++R) {
    for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      if (!summaryWs[cellAddress]) {
        summaryWs[cellAddress] = { v: '' }
      }

      if (R === 0) {
        summaryWs[cellAddress].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center', vertical: 'center' },
        }
      } else if (R === 2) {
        summaryWs[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        }
      } else if (R > 2) {
        summaryWs[cellAddress].s = {
          alignment: { horizontal: C === 1 ? 'center' : 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, summaryWs, '汇总')

  groups.forEach((group) => {
    const data: (string | number)[][] = []

    data.push([group.name])
    data.push([])

    const headers = options.fields.map(getFieldLabel)
    data.push(headers)

    group.studentIds.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId)
      if (student) {
        const row = options.fields.map((field) => getStudentFieldValue(student, field))
        data.push(row)
      }
    })

    const ws = XLSX.utils.aoa_to_sheet(data)

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: options.fields.length - 1 } }]

    ws['!cols'] = options.fields.map(() => ({ wch: 15 }))

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) {
          ws[cellAddress] = { v: '' }
        }

        if (R === 0) {
          const colorHex = group.color?.replace('#', '') || '4472C4'
          ws[cellAddress].s = {
            font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: colorHex } },
            alignment: { horizontal: 'center', vertical: 'center' },
          }
        } else if (R === 2) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'D9E2F3' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          }
        } else if (R > 2) {
          ws[cellAddress].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          }
        }
      }
    }

    const sheetName = group.name.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  XLSX.writeFile(wb, `${options.filename}.xlsx`)
}
