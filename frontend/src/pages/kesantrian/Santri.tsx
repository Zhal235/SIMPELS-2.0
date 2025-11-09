import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Pencil, Eye, Shuffle, Trash } from 'lucide-react'
import SantriForm from './components/SantriForm'
import type { Santri } from './components/SantriForm'
import { listSantri, deleteSantri } from '@/api/santri'
import { toast } from 'sonner'

type Row = Santri & { aksi?: string }

export default function KesantrianSantri() {
  // Mulai dengan data kosong; sebelumnya ada data dummy untuk demo yang membuat tabel menampilkan 3 baris saat reload
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit' | 'preview'>('create')
  const [current, setCurrent] = useState<Row | null>(null)

  async function fetchData() {
    try {
      setLoading(true)
      const res = await listSantri(currentPage, pageSize)
      const raw: any = res
      const list: Row[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.data?.data) ? raw.data.data : []))
      setItems(list)
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
  }, [])

  useEffect(() => {
    // when modal closes after create/edit, refresh table
    if (!modalOpen && (mode === 'create' || mode === 'edit')) {
      fetchData()
    }
  }, [modalOpen])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
            <button className="btn" onClick={() => { setMode('edit'); setCurrent(row); setModalOpen(true) }} title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button className="btn" onClick={() => { setMode('preview'); setCurrent(row); setModalOpen(true) }} title="Preview">
              <Eye className="w-4 h-4" />
            </button>
            <button
              className="btn"
              onClick={() => {
                toast.info('Segera hadir: Fitur Mutasi akan ditambahkan.')
              }}
              title="Mutasi"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              className="btn"
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
              title="Hapus"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ]
  ), [currentPage, pageSize])

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Data Santri</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setMode('create'); setCurrent(null); setModalOpen(true) }}
        >
          Tambah Santri
        </button>
      </div>
      <Card>
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Memuat data…</div>
        ) : (
          <Table columns={columns as any} data={items} />
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
    if (/^https?:\/\//i.test(s)) return s
    const origin = getBackendOrigin()
    if (s.startsWith('/')) return origin + s
    if (s.startsWith('storage') || s.startsWith('uploads')) return `${origin}/${s}`
    return s
  } catch {
    return null
  }
}

function getBackendOrigin(): string {
  const fallback = 'http://127.0.0.1:8000'
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    if (base) {
      const u = new URL(base)
      return u.origin
    }
  } catch {}
  try {
    const loc = window.location.origin
    if (loc.includes(':5173')) return loc.replace(':5173', ':8000')
    if (loc.includes(':5174')) return loc.replace(':5174', ':8000')
    if (loc.includes(':5175')) return loc.replace(':5175', ':8000')
    if (loc.includes(':5176')) return loc.replace(':5176', ':8000')
  } catch {}
  return fallback
}