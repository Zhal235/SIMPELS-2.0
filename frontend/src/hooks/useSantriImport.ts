import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { exportSantri, importSantri, downloadTemplate, validateImportSantri } from '@/api/santri'

export function useSantriImport(onImportSuccess: () => void) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [validationModalOpen, setValidationModalOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleDownloadTemplate() {
    try {
      toast.info('Mengunduh template...')
      const blob = await downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template-import-santri.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('✅ Template berhasil diunduh')
    } catch {
      toast.error('❌ Gagal download template')
    }
  }

  async function handleExport() {
    try {
      toast.info('Mengunduh data santri...')
      const blob = await exportSantri()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data-santri-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('✅ Data santri berhasil diunduh')
    } catch {
      toast.error('❌ Gagal export data santri')
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('❌ File harus berformat Excel (.xlsx atau .xls)')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
    setValidating(true)
    try {
      toast.info('Menganalisis file...')
      const result = await validateImportSantri(file)
      setValidationResult(result)
      setValidationModalOpen(true)
      if (result.can_import) {
        toast.success(`✅ File valid: ${result.summary.valid_rows} data siap diimport`)
      } else {
        toast.warning(`⚠️ Ditemukan ${result.summary.invalid_rows} baris dengan error`)
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal memvalidasi file'
      toast.error('❌ ' + msg)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setValidating(false)
    }
  }

  async function handleConfirmImport() {
    if (!selectedFile) return
    setImporting(true)
    try {
      toast.info('Mengimport data...')
      const result = await importSantri(selectedFile)
      const total = (result.imported || 0) + (result.updated || 0)
      if (result.errors && result.errors.length > 0) {
        toast.warning(`Import selesai dengan ${result.errors.length} peringatan. Sukses: ${total} data`)
      } else {
        let msg = `✅ Berhasil import ${result.imported} data baru`
        if (result.updated > 0) msg += ` dan update ${result.updated} data`
        toast.success(msg)
      }
      setValidationModalOpen(false)
      setValidationResult(null)
      setSelectedFile(null)
      onImportSuccess()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal import data santri'
      toast.error('❌ ' + msg)
    } finally {
      setImporting(false)
    }
  }

  function handleCancelImport() {
    setValidationModalOpen(false)
    setValidationResult(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return {
    fileInputRef,
    validationModalOpen,
    validationResult,
    selectedFile,
    validating,
    importing,
    handleDownloadTemplate,
    handleExport,
    handleFileSelect,
    handleConfirmImport,
    handleCancelImport,
  }
}
