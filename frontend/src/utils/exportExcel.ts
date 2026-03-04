import * as XLSX from 'xlsx'

export function exportToExcel(
  rows: Record<string, any>[],
  headers: Record<string, string>,
  filename: string,
  sheetName = 'Sheet1'
) {
  const headerRow = Object.values(headers)
  const keys = Object.keys(headers)
  const dataRows = rows.map(row => keys.map(k => row[k] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

  // Auto column width
  const colWidths = headerRow.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...dataRows.map(r => String(r[i] ?? '').length)
    )
    return { wch: Math.min(maxLen + 2, 50) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function formatRupiahRaw(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}
