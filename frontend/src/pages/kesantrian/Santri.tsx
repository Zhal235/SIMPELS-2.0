import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import SantriForm from './components/SantriForm'
import type { Santri } from './components/SantriForm'
import SantriToolbar from './components/SantriToolbar'
import SantriFilters from './components/SantriFilters'
import SantriTable from './components/SantriTable'
import MutasiModal from './components/MutasiModal'
import ImportValidationModal from './components/ImportValidationModal'
import { useSantriColumns } from './components/SantriColumns'
import { useSantriImport } from '@/hooks/useSantriImport'
import { listSantri } from '@/api/santri'
import { listKelas } from '@/api/kelas'
import { listAsrama } from '@/api/asrama'
import { hasAccess } from '../../stores/useAuthStore'
import { toast } from 'sonner'

type Row = Santri & { aksi?: string; status?: string }

export default function KesantrianSantri() {
  if (!hasAccess('kesantrian.santri.view')) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-600">Anda tidak memiliki izin untuk melihat data santri.</p>
      </div>
    )
  }

  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'preview'>('create')
  const [current, setCurrent] = useState<Row | null>(null)
  const [mutasiTarget, setMutasiTarget] = useState<Row | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [kelasOptions, setKelasOptions] = useState<any[]>([])
  const [asramaOptions, setAsramaOptions] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [selectedAsrama, setSelectedAsrama] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('aktif')

  const importHook = useSantriImport(fetchData)

  useEffect(() => {
    listKelas().then((res: any) => setKelasOptions(Array.isArray(res) ? res : res?.data || []))
    listAsrama().then((res: any) => setAsramaOptions(Array.isArray(res) ? res : res?.data || []))
  }, [])

  useEffect(() => { fetchData() }, [currentPage, pageSize, searchQuery, selectedKelas, selectedAsrama, selectedStatus])
  useEffect(() => { if (!modalOpen && (mode === 'create' || mode === 'edit')) fetchData() }, [modalOpen])

  async function fetchData() {
    try {
      setLoading(true)
      const res: any = await listSantri(currentPage, pageSize, {
        q: searchQuery, kelas_id: selectedKelas, asrama_id: selectedAsrama, status: selectedStatus,
      })
      if (res?.data?.data) {
        setItems(res.data.data)
        setTotalItems(res.data.total ?? res.data.data.length)
      } else if (res?.data) {
        const arr = Array.isArray(res.data) ? res.data : []
        setItems(arr)
        setTotalItems(res.total ?? arr.length)
      } else {
        const arr = Array.isArray(res) ? res : []
        setItems(arr)
        setTotalItems(arr.length)
      }
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('CORS')) toast.error('CORS terblokir. Pastikan backend mengizinkan origin localhost:*')
      else if (e?.response?.status === 419) toast.error('419 (CSRF) terdeteksi.')
      else if (msg.toLowerCase().includes('network')) toast.error('Gagal konek API. Cek CORS/URL backend.')
      else toast.error('Gagal memuat data santri.')
    } finally {
      setLoading(false)
    }
  }

  const columns = useSantriColumns({
    currentPage, pageSize,
    onEdit: (row) => { setMode('edit'); setCurrent(row); setModalOpen(true) },
    onPreview: (row) => { setMode('preview'); setCurrent(row); setModalOpen(true) },
    onMutasi: (row) => { if (row.id) { setMutasiTarget(row) } else toast.info('ID santri tidak ditemukan') },
    onDeleted: fetchData,
  })

  return (
    <div className="space-y-4">
      <SantriToolbar
        onDownloadTemplate={importHook.handleDownloadTemplate}
        onExport={importHook.handleExport}
        onImportClick={() => importHook.fileInputRef.current?.click()}
        onTambah={() => { setMode('create'); setCurrent(null); setModalOpen(true) }}
        fileInputRef={importHook.fileInputRef}
        onFileSelect={importHook.handleFileSelect}
      />

      <SantriFilters
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        kelasOptions={kelasOptions} asramaOptions={asramaOptions}
        selectedKelas={selectedKelas} selectedAsrama={selectedAsrama} selectedStatus={selectedStatus}
        onKelasChange={(v) => { setSelectedKelas(v); setCurrentPage(1) }}
        onAsramaChange={(v) => { setSelectedAsrama(v); setCurrentPage(1) }}
        onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1) }}
      />

      <SantriTable
        loading={loading} items={items} filteredItems={items} columns={columns as any}
        searchQuery={searchQuery} currentPage={currentPage} pageSize={pageSize} totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
        getRowKey={(row, idx) => String(row?.id ?? idx)}
      />

      <Modal open={modalOpen} title={mode === 'create' ? 'Tambah Santri' : mode === 'edit' ? 'Edit Santri' : 'Preview Santri'} onClose={() => setModalOpen(false)} footer={null}>
        <SantriForm mode={mode} initial={current ?? undefined} onCancel={() => setModalOpen(false)} onSubmit={fetchData} />
      </Modal>

      <MutasiModal mutasiTarget={mutasiTarget} onClose={() => setMutasiTarget(null)} onSuccess={fetchData} />

      <ImportValidationModal
        open={importHook.validationModalOpen}
        validationResult={importHook.validationResult}
        selectedFile={importHook.selectedFile}
        importing={importHook.importing}
        onConfirm={importHook.handleConfirmImport}
        onCancel={importHook.handleCancelImport}
      />
    </div>
  )
}