import { Eye, ArrowUpCircle, ArrowDownCircle, CheckCircle, X, Wallet } from 'lucide-react'

export type TabunganItem = {
  id: number
  santri_id: string
  saldo: number
  status: 'aktif' | 'nonaktif'
  opened_at: string
  notes: string | null
  santri: {
    id: string
    nis: string
    nama_santri: string
    foto: string | null
    kelas: string | null
    asrama: string | null
  }
}

type Props = {
  data: TabunganItem[]
  loading: boolean
  formatRupiah: (val: number | null | undefined) => string
  onNavigate: (santriId: string) => void
  onSetor: (item: TabunganItem) => void
  onTarik: (item: TabunganItem) => void
  onToggleStatus: (item: TabunganItem) => void
}

export default function TabunganTable({ data, loading, formatRupiah, onNavigate, onSetor, onTarik, onToggleStatus }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border flex items-center justify-center py-16 text-gray-400">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border flex flex-col items-center justify-center py-16 text-gray-400">
        <Wallet className="w-12 h-12 mb-3" />
        <p className="font-medium">Belum ada data tabungan</p>
        <p className="text-sm mt-1">Klik "Buka Tabungan" untuk menambah</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['No', 'Santri', 'Kelas', 'Asrama', 'Saldo', 'Dibuka', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{item.santri.nama_santri}</p>
                  <p className="text-xs text-gray-500">{item.santri.nis}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.santri.kelas || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.santri.asrama || '-'}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">{formatRupiah(item.saldo)}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {item.opened_at
                    ? new Date(item.opened_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status === 'aktif' ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onNavigate(item.santri_id)} title="Lihat riwayat" className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.status === 'aktif' && (
                      <>
                        <button onClick={() => onSetor(item)} title="Setor" className="p-1.5 rounded text-green-600 hover:bg-green-50">
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => onTarik(item)} title="Tarik" className="p-1.5 rounded text-orange-600 hover:bg-orange-50">
                          <ArrowDownCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => onToggleStatus(item)} title={item.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} className="p-1.5 rounded text-gray-400 hover:bg-gray-100 text-xs">
                      {item.status === 'aktif' ? '🔒' : '🔓'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
