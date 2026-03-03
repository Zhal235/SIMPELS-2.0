import { Button } from '@/components/ui/button'
import { Edit2, Eye, Shuffle, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { hasAccess } from '@/stores/useAuthStore'
import { deleteSantri } from '@/api/santri'
import { toast } from 'sonner'
import { getFotoSrc } from '@/utils/fotoUrl'
import type { Santri } from './SantriForm'

type Row = Santri & { aksi?: string; status?: string }

interface Options {
  currentPage: number
  pageSize: number
  onEdit: (row: Row) => void
  onPreview: (row: Row) => void
  onMutasi: (row: Row) => void
  onDeleted: () => void
}

export function useSantriColumns({ currentPage, pageSize, onEdit, onPreview, onMutasi, onDeleted }: Options) {
  return useMemo(() => [
    {
      key: 'no' as any,
      header: 'No',
      render: (_: any, __: Row, idx: number) => {
        const base = (currentPage - 1) * pageSize
        return String(typeof idx === 'number' ? base + idx + 1 : base + 1)
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
    {
      key: 'jenis_kelamin',
      header: 'Jenis Kelamin',
      render: (v: string) => (v === 'L' ? 'Laki-laki' : 'Perempuan'),
    },
    {
      key: 'ttl',
      header: 'TTL',
      render: (_: any, row: Row) => {
        const tempat = row?.tempat_lahir || ''
        const tanggal = row?.tanggal_lahir || ''
        if (!tempat && !tanggal) return '-'
        return `${tempat}${tempat && tanggal ? ', ' : ''}${tanggal}`
      },
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (_: any, row: Row) => (
        <div className="flex gap-2">
          {hasAccess('kesantrian.santri.edit') && (
            <Button
              variant="outline" size="icon" title="Edit"
              className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={() => onEdit(row)}
            >
              <Edit2 size={16} />
            </Button>
          )}
          <Button
            variant="outline" size="icon" title="Lihat Detail"
            className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
            onClick={() => onPreview(row)}
          >
            <Eye size={16} />
          </Button>
          {hasAccess('kesantrian.mutasi.masuk') && (
            <Button
              variant="outline" size="icon"
              title={['keluar', 'mutasi_keluar'].includes(row.status || '') ? 'Santri sudah dimutasi keluar' : 'Mutasi'}
              className={`border-gray-200 text-gray-700 transition-all duration-150 rounded-lg shadow-sm bg-white ${['keluar', 'mutasi_keluar'].includes(row.status || '') ? 'opacity-50 cursor-not-allowed' : 'hover:text-brand hover:border-brand'}`}
              disabled={['keluar', 'mutasi_keluar'].includes(row.status || '')}
              onClick={() => { if (!['keluar', 'mutasi_keluar'].includes(row.status || '')) onMutasi(row) }}
            >
              <Shuffle size={16} />
            </Button>
          )}
          {hasAccess('kesantrian.santri.delete') && (
            <Button
              variant="outline" size="icon" title="Hapus"
              className="border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-300 transition-all duration-150 rounded-lg shadow-sm bg-white"
              onClick={async () => {
                if (!confirm('Yakin ingin hapus data santri ini?')) return
                try {
                  if (row.id) {
                    await deleteSantri(row.id)
                    onDeleted()
                    toast.success('✅ Data santri dihapus.')
                  }
                } catch (err) {
                  const isNetwork = String((err as any)?.message || '').toLowerCase().includes('network')
                  toast.error(isNetwork ? '🌐 Tidak dapat terhubung ke server backend.' : '⚠️ Terjadi kesalahan server saat menghapus.')
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ], [currentPage, pageSize])
}
