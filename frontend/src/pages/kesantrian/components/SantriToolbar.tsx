import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileDown, Upload } from 'lucide-react'
import { hasAccess } from '@/stores/useAuthStore'

interface Props {
  onDownloadTemplate: () => void
  onExport: () => void
  onImportClick: () => void
  onTambah: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SantriToolbar({ onDownloadTemplate, onExport, onImportClick, onTambah, fileInputRef, onFileSelect }: Props) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-900">Data Santri</h1>
      <div className="flex gap-2">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileSelect} className="hidden" />
        {hasAccess('kesantrian.santri.edit') && (
          <Button variant="outline" onClick={onDownloadTemplate} className="border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-400 hover:bg-blue-50">
            <FileDown size={16} className="mr-2" />
            Download Template
          </Button>
        )}
        <Button variant="outline" onClick={onExport} className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand">
          <Download size={16} className="mr-2" />
          Export Excel
        </Button>
        {hasAccess('kesantrian.santri.edit') && (
          <Button variant="outline" onClick={onImportClick} className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand">
            <Upload size={16} className="mr-2" />
            Import Excel
          </Button>
        )}
        {hasAccess('kesantrian.santri.edit') && (
          <button className="btn btn-primary" onClick={onTambah}>Tambah Santri</button>
        )}
      </div>
    </div>
  )
}
