import { useEffect, useMemo, useState, useRef } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Edit2, Eye, Shuffle, Trash2, Download, Upload, Search, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import SantriForm from './components/SantriForm'
import type { Santri } from './components/SantriForm'
import { listSantri, deleteSantri, updateSantri, getSantri, exportSantri, importSantri, downloadTemplate, validateImportSantri } from '@/api/santri'
import { listKelas } from '@/api/kelas'
import { listAsrama } from '@/api/asrama'
import { getTagihanBySantri } from '@/api/pembayaran'
import { deleteTagihanSantri } from '@/api/tagihanSantri'
import { createMutasiKeluar } from '@/api/mutasiKeluar'
import { useAuthStore, hasAccess } from '../../stores/useAuthStore'
import { toast } from 'sonner'

type Row = Santri & { aksi?: string }

export default function KesantrianSantri() {
  if (!hasAccess('kesantrian.santri.view')) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-600">Anda tidak memiliki izin untuk melihat data santri.</p>
      </div>
    )
  }

  // Mulai dengan data kosong; sebelumnya ada data dummy untuk demo yang membuat tabel menampilkan 3 baris saat reload
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Import validation modal state
  const [validationModalOpen, setValidationModalOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'preview'>('create')
  const [current, setCurrent] = useState<Row | null>(null)
  const [mutasiModalOpen, setMutasiModalOpen] = useState(false)
  const [mutasiTarget, setMutasiTarget] = useState<Row | null>(null)
  const [tanggalKeluar, setTanggalKeluar] = useState<string>('')
  const [alasan, setAlasan] = useState<string>('')
  const [tujuanMutasi, setTujuanMutasi] = useState<string>('')
  const [tagihanPreview, setTagihanPreview] = useState<any[]>([])
  const [previewDelete, setPreviewDelete] = useState<any[]>([])
  const [previewKeep, setPreviewKeep] = useState<any[]>([])
  const totalDelete = useMemo(() => previewDelete.reduce((s: number, t: any) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewDelete])
  const totalKeep = useMemo(() => previewKeep.reduce((s: number, t: any) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewKeep])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const navigate = useNavigate()

  // Filters State
  const [kelasOptions, setKelasOptions] = useState<any[]>([])
  const [asramaOptions, setAsramaOptions] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [selectedAsrama, setSelectedAsrama] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('aktif')

  useEffect(() => {
    listKelas().then((res: any) => setKelasOptions(Array.isArray(res) ? res : res?.data || []))
    listAsrama().then((res: any) => setAsramaOptions(Array.isArray(res) ? res : res?.data || []))
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const res = await listSantri(currentPage, pageSize, {
         q: searchQuery,
         kelas_id: selectedKelas,
         asrama_id: selectedAsrama,
         status: selectedStatus
      })
      const raw: any = res
      
      // Handle different response structures
      if (raw?.data?.data) {
        // Laravel pagination format
        setItems(raw.data.data)
        setTotalItems(raw.data.total ?? raw.data.data.length)
      } else if (raw?.data) {
        const dataArray = Array.isArray(raw.data) ? raw.data : []
        setItems(dataArray)
        // Jika tidak ada total, asumsikan ada lebih banyak data jika hasil = pageSize
        setTotalItems(raw.total ?? dataArray.length)
      } else {
        const dataArray = Array.isArray(raw) ? raw : []
        setItems(dataArray)
        setTotalItems(dataArray.length)
      }
    } catch (e: any) {
      console.error('Failed to fetch santri list', e)
      if (String(e?.message || '').includes('CORS')) {
        toast.error('CORS terblokir. Pastikan backend mengizinkan origin localhost:*')
      } else if (e?.response?.status === 419) {
        toast.error('419 (CSRF) terdeteksi. Pastikan API stateless / tidak pakai CSRF.')
      } else if (String(e?.message || '').toLowerCase().includes('network')) {
        toast.error('Gagal konek API. Cek CORS/URL backend.')
      } else {
        toast.error('Gagal memuat data santri.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage, pageSize, searchQuery, selectedKelas, selectedAsrama, selectedStatus])

  useEffect(() => {
    // when modal closes after create/edit, refresh table
    if (!modalOpen && (mode === 'create' || mode === 'edit')) {
      fetchData()
    }
  }, [modalOpen])

  useEffect(() => {
    const fetchTagihan = async () => {
      if (!mutasiTarget) return
      try {
        const res: any = await getTagihanBySantri((mutasiTarget as any).id)
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        setTagihanPreview(list)
      } catch (e) {
        console.error('Gagal mengambil tagihan santri', e)
        setTagihanPreview([])
      }
    }
    if (mutasiModalOpen) fetchTagihan()
  }, [mutasiModalOpen, mutasiTarget])

  function bulanToNum(b: string) {
    const map: Record<string, number> = {
      Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
      Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
    }
    return map[b] || 1
  }

  useEffect(() => {
    if (!tanggalKeluar || tagihanPreview.length === 0) {
      setPreviewDelete([])
      setPreviewKeep(tagihanPreview)
      return
    }
    const dt = new Date(tanggalKeluar)
    const outY = dt.getFullYear()
    const outM = dt.getMonth() + 1
    const del: any[] = []
    const keep: any[] = []
    tagihanPreview.forEach((t: any) => {
      const tY = Number(t?.tahun || 0)
      const tM = bulanToNum(String(t?.bulan || ''))
      const shouldDelete = tY > outY || (tY === outY && tM > outM)
      if (shouldDelete) del.push(t)
      else keep.push(t)
    })
    setPreviewDelete(del)
    setPreviewKeep(keep)
  }, [tanggalKeluar, tagihanPreview])

  const columns = useMemo(() => (
    [
      {
        key: 'no' as any,
        header: 'No',
        render: (_: any, __: Row, idx: number) => {
          const hasPagination = typeof currentPage === 'number' && typeof pageSize === 'number'
          const base = hasPagination ? (currentPage - 1) * pageSize : 0
          const display = typeof idx === 'number' ? base + idx + 1 : base + 1
          return String(display)
        },
      },
      {
        key: 'nama_santri',
        header: 'Nama Santri',
        render: (_: any, row: Row) => {
          const src = getFotoSrc(row?.foto as any)
          const initial = (row?.nama_santri ?? '').trim().charAt(0) || '?'
          return (
            <div className="flex items-center gap-2">
              {src ? (
                <img src={src} alt={row?.nama_santri ?? 'Foto'} className="h-8 w-8 rounded-full object-cover border" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 border flex items-center justify-center text-xs text-gray-600">
                  {initial}
                </div>
              )}
              <span>{row?.nama_santri}</span>
            </div>
          )
        },
      },
      { key: 'nis', header: 'NIS' },
      { key: 'nisn', header: 'NISN' },
      { key: 'jenis_kelamin', header: 'Jenis Kelamin', render: (v: string) => (v === 'L' ? 'Laki-laki' : 'Perempuan') },
      {
        key: 'ttl',
        header: 'TTL',
        render: (_: any, row: Row) => {
          const tempat = row?.tempat_lahir || '';
          const tanggal = row?.tanggal_lahir || '';
          if (!tempat && !tanggal) return '-';
          return `${tempat}${tempat && tanggal ? ', ' : ''}${tanggal}`;
        }
      },
      {
        key: 'aksi',
        header: 'Aksi',
        render: (_: any, row: Row) => (
          <div className="flex gap-2">
            {hasAccess('kesantrian.santri.edit') && (
            <Button
              variant="outline"
              size="icon"
              title="Edit"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => { setMode('edit'); setCurrent(row); setModalOpen(true) }}
            >
              <Edit2 size={16} />
            </Button>)}
            <Button
              variant="outline"
              size="icon"
              title="Lihat Detail"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => { setMode('preview'); setCurrent(row); setModalOpen(true) }}
            >
              <Eye size={16} />
            </Button>
            {hasAccess('kesantrian.mutasi.masuk') && (
            <Button
              variant="outline"
              size="icon"
              title={['keluar', 'mutasi_keluar'].includes(row.status || '') ? 'Santri sudah dimutasi keluar' : 'Mutasi'}
              className={`border-gray-200 text-gray-700 transition-all duration-150 rounded-lg shadow-sm bg-white ${['keluar', 'mutasi_keluar'].includes(row.status || '') ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand hover:border-brand'}`}
              disabled={['keluar', 'mutasi_keluar'].includes(row.status || '')}
              onClick={() => {
                if (['keluar', 'mutasi_keluar'].includes(row.status || '')) return;
                
                if (row.id) {
                  setMutasiTarget(row)
                  setTanggalKeluar('')
                  setAlasan('')
                  setMutasiModalOpen(true)
                } else {
                  toast.info('ID santri tidak ditemukan')
                }
              }}
            >
              <Shuffle size={16} />
            </Button>)}
            {hasAccess('kesantrian.santri.delete') && (
            <Button
              variant="outline"
              size="icon"
              title="Hapus"
              className="border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-300 transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={async () => {
                const ok = confirm('Yakin ingin hapus data santri ini?')
                if (!ok) return
                try {
                  if (row.id) {
                    await deleteSantri(row.id)
                    await fetchData()
                    toast.success('✅ Data santri dihapus.')
                  } else {
                    // local-only fallback
                    setItems((prev) => prev.filter((it) => it.id !== row.id))
                  }
                } catch (err) {
                  console.error('Gagal menghapus santri', err)
                  const isNetwork = String((err as any)?.message || '').toLowerCase().includes('network')
                  if (isNetwork) {
                    toast.error('🌐 Tidak dapat terhubung ke server backend.')
                  } else {
                    toast.error('⚠️ Terjadi kesalahan server saat menghapus.')
                  }
                }
              }}
            >
              <Trash2 size={16} />
            </Button>)}
          </div>
        ),
      },
    ]
  ), [currentPage, pageSize])

  // Filter items based on search query (Backend handles filtering now)
  const filteredItems = items

  // Handle download template
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
    } catch (error: any) {
      console.error('Download template error:', error)
      toast.error('❌ Gagal download template')
    }
  }

  // Handle export
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
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('❌ Gagal export data santri')
    }
  }

  // Handle file selection and validation
  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file extension
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('❌ File harus berformat Excel (.xlsx atau .xls)')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
      console.error('Validation error:', error)
      const msg = error?.response?.data?.message || 'Gagal memvalidasi file'
      toast.error('❌ ' + msg)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setValidating(false)
    }
  }

  // Handle actual import after validation
  async function handleConfirmImport() {
    if (!selectedFile) return

    setImporting(true)
    
    try {
      toast.info('Mengimport data...')
      const result = await importSantri(selectedFile)
      
      const total = (result.imported || 0) + (result.updated || 0)
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Import warnings:', result.errors)
        toast.warning(`Import selesai dengan ${result.errors.length} peringatan. Sukses: ${total} data`)
      } else {
        let msg = `✅ Berhasil import ${result.imported} data baru`
        if (result.updated > 0) {
          msg += ` dan update ${result.updated} data`
        }
        toast.success(msg)
      }
      
      // Close modal and refresh data
      setValidationModalOpen(false)
      setValidationResult(null)
      setSelectedFile(null)
      await fetchData()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Import error:', error)
      const msg = error?.response?.data?.message || 'Gagal import data santri'
      toast.error('❌ ' + msg)
    } finally {
      setImporting(false)
    }
  }

  // Handle cancel import
  function handleCancelImport() {
    setValidationModalOpen(false)
    setValidationResult(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Data Santri</h1>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          {hasAccess('kesantrian.santri.edit') && (
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-400 hover:bg-blue-50"
          >
            <FileDown size={16} className="mr-2" />
            Download Template
          </Button>)}
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand"
          >
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
          {hasAccess('kesantrian.santri.edit') && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand"
          >
            <Upload size={16} className="mr-2" />
            Import Excel
          </Button>)}
          {hasAccess('kesantrian.santri.edit') && (
          <button
            className="btn btn-primary"
            onClick={() => { setMode('create'); setCurrent(null); setModalOpen(true) }}
          >
            Tambah Santri
          </button>)}
        </div>
      </div>
      
      {/* Search Bar & Filters */}
      <Card>
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NIS, atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
              {/* Kelas Filter */}
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on filter change
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k: any) => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>

              {/* Asrama Filter */}
              <select
                value={selectedAsrama}
                onChange={(e) => {
                  setSelectedAsrama(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
              >
                <option value="">Semua Asrama</option>
                <option value="non_asrama">Non Asrama</option>
                {asramaOptions.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nama_asrama}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="lulus">Lulus</option>
                <option value="keluar">Keluar</option>
                <option value="mutasi_keluar">Mutasi Keluar</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      <Card>
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Memuat data…</div>
        ) : !items || items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Belum ada data santri.</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Tidak ada data yang sesuai dengan pencarian "{searchQuery}"</div>
        ) : (
          <>
            <Table columns={columns as any} data={filteredItems} getRowKey={(row: Row, idx: number) => String((row as any)?.id ?? idx)} />
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
                  {searchQuery && ` (${filteredItems.length} hasil pencarian)`}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Per halaman:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1) // Reset ke halaman 1 saat ganti page size
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      const totalPages = Math.ceil(totalItems / pageSize)
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    })
                    .map((page, idx, arr) => (
                      <div key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 border rounded ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={mode === 'create' ? 'Tambah Santri' : mode === 'edit' ? 'Edit Santri' : 'Preview Santri'}
        onClose={() => setModalOpen(false)}
        footer={null}
      >
        <SantriForm
          mode={mode}
          initial={current ?? undefined}
          onCancel={() => setModalOpen(false)}
          onSubmit={() => { fetchData() }}
        />
      </Modal>

      {mutasiModalOpen && mutasiTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Konfirmasi Mutasi Keluar</h2>
              <p className="text-sm text-gray-600">{mutasiTarget.nama_santri}</p>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Tanggal Keluar</label>
                <input type="date" className="w-full border rounded px-3 py-2" value={tanggalKeluar} onChange={(e) => setTanggalKeluar(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Alasan</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-700">Tujuan Mutasi</label>
                <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nama sekolah/pesantren tujuan" value={tujuanMutasi} onChange={(e) => setTujuanMutasi(e.target.value)} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Preview Tagihan Setelah Mutasi</h3>
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">Total Dihapus: {totalDelete.toLocaleString('id-ID')}</div>
                  <div className="font-medium">Total Tunggakan: {totalKeep.toLocaleString('id-ID')}</div>
                </div>
                {!tanggalKeluar ? (
                  <p className="text-xs text-gray-500">Pilih tanggal keluar untuk melihat preview perubahan tagihan.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded p-2">
                      <div className="font-medium text-sm text-gray-800 mb-1">Dihapus (setelah bulan keluar)</div>
                      {previewDelete.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada tagihan yang akan dihapus.</div>
                      ) : (
                        <ul className="space-y-1 max-h-[40vh] overflow-auto pr-1">
                          {previewDelete.map((t: any) => (
                            <li key={`del-${t.id}`} className="text-xs flex justify-between">
                              <span>{t.jenis_tagihan?.nama_tagihan ?? t.jenis_tagihan} — {t.bulan} {t.tahun}</span>
                              <span className="font-medium">{Number(t.nominal ?? t.sisa ?? 0).toLocaleString('id-ID')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-2 mt-2 border-t text-xs font-semibold flex justify-between">
                        <span>Total</span>
                        <span>{totalDelete.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="border rounded p-2">
                      <div className="font-medium text-sm text-gray-800 mb-1">Tetap (sebagai tunggakan)</div>
                      {previewKeep.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada tagihan tersisa.</div>
                      ) : (
                        <ul className="space-y-1 max-h-[40vh] overflow-auto pr-1">
                          {previewKeep.map((t: any) => (
                            <li key={`keep-${t.id}`} className="text-xs flex justify-between">
                              <span>{t.jenis_tagihan?.nama_tagihan ?? t.jenis_tagihan} — {t.bulan} {t.tahun}</span>
                              <span className="font-medium">{Number(t.nominal ?? t.sisa ?? 0).toLocaleString('id-ID')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-2 mt-2 border-t text-xs font-semibold flex justify-between">
                        <span>Total</span>
                        <span>{totalKeep.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => { setMutasiModalOpen(false); setMutasiTarget(null); setTanggalKeluar(''); setAlasan('') }}>Batal</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50" disabled={!tanggalKeluar} onClick={async () => {
                if (!mutasiTarget) return
                try {
                  // Gunakan API createMutasiKeluar yang sudah handle update santri dan delete tagihan
                  await createMutasiKeluar({
                    santri_id: (mutasiTarget as any).id,
                    tanggal_mutasi: tanggalKeluar,
                    tujuan: tujuanMutasi || null,
                    alasan: alasan || null,
                  })
                  
                  const info = {
                    tanggalKeluar,
                    alasan,
                    kelasTertinggal: (mutasiTarget as any).kelas ?? (mutasiTarget as any).kelas_nama ?? null,
                    tujuanMutasi: tujuanMutasi || '-',
                  }
                  try { localStorage.setItem(`mutasi_keluar:${(mutasiTarget as any).id}`, JSON.stringify(info)) } catch {}
                  toast.success('Mutasi keluar berhasil diproses')
                  setMutasiModalOpen(false)
                  setMutasiTarget(null)
                  setTanggalKeluar('')
                  setAlasan('')
                  setTujuanMutasi('')
                  fetchData()
                } catch (e: any) {
                  if (e?.response?.status === 422) {
                    toast.error('Validasi gagal. Lengkapi data profil santri sebelum mutasi.')
                  } else {
                    console.error(e)
                  }
                }
              }}>Konfirmasi Mutasi</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {validationModalOpen && validationResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Preview & Validasi Import Data</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedFile?.name} • {validationResult.summary.total_rows} baris data
              </p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">{validationResult.summary.valid_rows}</div>
                  <div className="text-sm text-green-600">Data Valid</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-700">{validationResult.summary.invalid_rows}</div>
                  <div className="text-sm text-red-600">Data Error</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-700">{validationResult.summary.warnings_count}</div>
                  <div className="text-sm text-yellow-600">Peringatan</div>
                </div>
              </div>

              {/* Status Message */}
              <div className={`p-4 rounded-lg ${validationResult.can_import ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium ${validationResult.can_import ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.message}
                </p>
              </div>

              {/* Invalid Rows */}
              {validationResult.invalid_rows && validationResult.invalid_rows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <span className="bg-red-100 px-2 py-1 rounded text-sm">{validationResult.invalid_rows.length}</span>
                    Baris dengan Error (Wajib Diperbaiki)
                  </h3>
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {validationResult.invalid_rows.map((row: any, idx: number) => (
                      <div key={idx} className="p-3 hover:bg-red-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            Baris {row.row}: {row.nama || 'Nama tidak tersedia'}
                          </div>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            NIS: {row.nis || 'Kosong'}
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {row.errors.map((error: string, i: number) => (
                            <li key={i} className="text-sm text-red-600">❌ {error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-700 flex items-center gap-2">
                    <span className="bg-yellow-100 px-2 py-1 rounded text-sm">{validationResult.warnings.length}</span>
                    Peringatan (Opsional, tetap bisa diimport)
                  </h3>
                  <div className="border rounded-lg p-3 bg-yellow-50 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {validationResult.warnings.map((warning: string, idx: number) => (
                        <li key={idx} className="text-sm text-yellow-700">⚠️ {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Valid Rows Preview */}
              {validationResult.valid_rows && validationResult.valid_rows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2">
                    <span className="bg-green-100 px-2 py-1 rounded text-sm">{validationResult.summary.valid_rows}</span>
                    Data Valid (Preview 10 baris pertama)
                  </h3>
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {validationResult.valid_rows.slice(0, 10).map((row: any, idx: number) => (
                      <div key={idx} className="p-3 hover:bg-green-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{row.nama}</div>
                            <div className="text-sm text-gray-600">
                              NIS: {row.nis} • {row.jenis_kelamin} • {row.tempat_lahir}, {row.tanggal_lahir}
                            </div>
                          </div>
                          {row.warnings && row.warnings.length > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              {row.warnings.length} warning
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {validationResult.can_import ? (
                  <span className="text-green-700 font-medium">✓ File siap diimport</span>
                ) : (
                  <span className="text-red-700 font-medium">✗ Perbaiki error sebelum import</span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  onClick={handleCancelImport}
                  disabled={importing}
                >
                  Batal
                </button>
                {validationResult.can_import && (
                  <button 
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirmImport}
                    disabled={importing}
                  >
                    {importing ? 'Mengimport...' : `Import ${validationResult.summary.valid_rows} Data`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helpers to resolve foto URL to backend origin
function getFotoSrc(foto: string | Blob | undefined): string | null {
  try {
    if (!foto) return null
    if (foto instanceof Blob) return URL.createObjectURL(foto)
    const s = String(foto || '')
    if (!s) return null
    if (/^data:/i.test(s)) return s
    const origin = getBackendOrigin()
    if (/^https?:\/\//i.test(s)) {
      // Jika URL absolut mengarah ke localhost:8000, ubah ke origin backend saat ini (mis. 8001)
      try {
        const u = new URL(s)
        const o = new URL(origin)
        const isLocalHost = ['localhost', '127.0.0.1'].includes(u.hostname)
        if (isLocalHost && u.port && o.port && u.port !== o.port) {
          u.protocol = o.protocol
          u.hostname = o.hostname
          u.port = o.port
          return u.toString()
        }
      } catch {}
      return s
    }
    if (s.startsWith('/')) return origin + s
    if (s.startsWith('storage') || s.startsWith('uploads')) return `${origin}/${s}`
    return s
  } catch {
    return null
  }
}

function getBackendOrigin(): string {
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    if (base) {
      // If base is a relative path (/api), use current origin
      if (base.startsWith('/')) {
        return window.location.origin
      }
      const u = new URL(base)
      return u.origin
    }
  } catch {}
  try {
    const loc = window.location.origin
    if (loc.includes(':5173')) return loc.replace(':5173', ':8001')
    if (loc.includes(':5174')) return loc.replace(':5174', ':8001')
    if (loc.includes(':5175')) return loc.replace(':5175', ':8001')
    // For production or any other port, use current origin (assume /api relative path used)
    return loc
  } catch {}
  // Final fallback: assume current origin
  return window.location.origin
}