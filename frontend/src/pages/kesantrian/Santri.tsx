import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Edit2, Eye, Shuffle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SantriForm from './components/SantriForm'
import type { Santri } from './components/SantriForm'
import { listSantri, deleteSantri } from '@/api/santri'
import MutasiKeluarModal from './components/MutasiKeluarModal'
import { toast } from 'sonner'

type Row = Santri & { aksi?: string }

export default function KesantrianSantri() {
  // Mulai dengan data kosong; sebelumnya ada data dummy untuk demo yang membuat tabel menampilkan 3 baris saat reload
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [mutasiModalOpen, setMutasiModalOpen] = useState(false)
  const [mutasiTarget, setMutasiTarget] = useState<Row | null>(null)
  const [mode, setMode] = useState<'create' | 'edit' | 'preview'>('create')
  const [current, setCurrent] = useState<Row | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState<string>('')

  async function fetchData() {
    try {
      setLoading(true)
      // if search is less than 2 chars, ignore q param to the server
      const q = search && search.trim().length >= 2 ? search.trim() : undefined
      const res = await listSantri(currentPage, pageSize, q)
      const raw: any = res
      
      console.log('API Response:', raw)
      
      // Handle different response structures
      if (raw?.data?.data) {
        // Laravel pagination format
        setItems(raw.data.data)
        setTotalItems(raw.data.total || raw.data.data.length)
        console.log('Items:', raw.data.data.length, 'Total:', raw.data.total)
      } else if (raw?.data) {
        const dataArray = Array.isArray(raw.data) ? raw.data : []
        setItems(dataArray)
        // Jika tidak ada total, asumsikan ada lebih banyak data jika hasil = pageSize
        setTotalItems(raw.total || (dataArray.length === pageSize ? pageSize * 10 : dataArray.length))
        console.log('Items:', dataArray.length, 'Total estimate:', totalItems)
      } else {
        const dataArray = Array.isArray(raw) ? raw : []
        setItems(dataArray)
        setTotalItems(dataArray.length === pageSize ? pageSize * 10 : dataArray.length)
        console.log('Items:', dataArray.length)
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
  }, [currentPage, pageSize])

  // when search changes, debounce and fetch
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1)
      fetchData()
    }, 400)

    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    // when modal closes after create/edit, refresh table
    if (!modalOpen && (mode === 'create' || mode === 'edit')) {
      fetchData()
    }
  }, [modalOpen])

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
        key: 'aksi',
        header: 'Aksi',
        render: (_: any, row: Row) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              title="Edit"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => { setMode('edit'); setCurrent(row); setModalOpen(true) }}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Lihat Detail"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => { setMode('preview'); setCurrent(row); setModalOpen(true) }}
            >
              <Eye size={16} />
            </Button>
            {row.status !== 'mutasi_keluar' && (
            <Button
              variant="outline"
              size="icon"
              title="Mutasi"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => {
                setMutasiTarget(row)
                setMutasiModalOpen(true)
              }}
            >
              <Shuffle size={16} />
            </Button>
            )}
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
            </Button>
          </div>
        ),
      },
    ]
  ), [currentPage, pageSize])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Data Santri</h1>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / NIS (min 2 huruf)"
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            aria-label="Search Santri"
          />
          <button
            type="button"
            onClick={() => setSearch('')}
            title="Bersihkan pencarian"
            className="px-3 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setMode('create'); setCurrent(null); setModalOpen(true) }}
          >
            Tambah Santri
          </button>
        </div>
      </div>
      <Card>
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Memuat data…</div>
        ) : !items || items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Belum ada data santri.</div>
        ) : (
          <>
            <Table columns={columns as any} data={items} getRowKey={(row: Row, idx: number) => String(row?.id ?? idx)} />
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
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
      {mutasiTarget && (
        <Modal open={mutasiModalOpen} title={`Mutasi Keluar: ${mutasiTarget.nama_santri}`} onClose={() => setMutasiModalOpen(false)} footer={null}>
          <MutasiKeluarModal
            santri={mutasiTarget}
            onClose={() => setMutasiModalOpen(false)}
            onSuccess={() => {
              setMutasiModalOpen(false)
              setMutasiTarget(null)
              // Refresh list
              fetchData()
            }}
          />
        </Modal>
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
  const fallback = 'http://127.0.0.1:8001'
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    if (base) {
      const u = new URL(base)
      return u.origin
    }
  } catch {}
  try {
    const loc = window.location.origin
    if (loc.includes(':5173')) return loc.replace(':5173', ':8001')
    if (loc.includes(':5174')) return loc.replace(':5174', ':8001')
    if (loc.includes(':5175')) return loc.replace(':5175', ':8001')
    if (loc.includes(':5176')) return loc.replace(':5176', ':8001')
  } catch {}
  return fallback
}