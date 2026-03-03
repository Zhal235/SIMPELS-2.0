import { X, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

const formatRupiah = (v: number | undefined | null) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0)
const formatTanggal = (t: string) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

interface Props {
  transaksi: any
  onClose: () => void
  onDelete: (id: number) => void
}

export default function ModalPreviewTransaksi({ transaksi, onClose, onDelete }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div><p className="text-sm text-gray-500">No. Transaksi</p><p className="text-lg font-semibold">{transaksi.no_transaksi}</p></div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${transaksi.jenis === 'pemasukan' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {transaksi.jenis === 'pemasukan' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
              {transaksi.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500 mb-1">Tanggal</p><p className="font-medium">{formatTanggal(transaksi.tanggal)}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Buku Kas</p><p className="font-medium">{transaksi.buku_kas?.nama_kas || '-'}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Kategori</p><p className="font-medium">{transaksi.kategori}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Metode</p><p className="font-medium">{transaksi.metode === 'cash' ? '💵 Cash' : '🏦 Transfer'}</p></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm text-gray-500 mb-1">Nominal</p>
            <p className={`text-3xl font-bold ${transaksi.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
              {transaksi.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(transaksi.nominal)}
            </p>
          </div>
          {transaksi.keterangan && <div><p className="text-sm text-gray-500 mb-1">Keterangan</p><p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{transaksi.keterangan}</p></div>}
          {transaksi.pembayaran_id && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-sm text-blue-800">🔒 Terkait pembayaran santri (ID: {transaksi.pembayaran_id})</p></div>}
          <div className="pt-4 border-t"><p className="text-xs text-gray-400">Dicatat pada: {new Date(transaksi.created_at).toLocaleString('id-ID', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p></div>
        </div>
        <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white font-medium">Tutup</button>
          {!transaksi.pembayaran_id && <button onClick={() => { onClose(); onDelete(transaksi.id) }} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"><Trash2 className="w-4 h-4" />Hapus Transaksi</button>}
        </div>
      </div>
    </div>
  )
}
