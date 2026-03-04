import { useState } from 'react'
import { X, ArrowUpCircle } from 'lucide-react'

interface Props {
  bukuKasList: any[]
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export default function ModalCatatPemasukan({ bukuKasList, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    buku_kas_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: '',
    nominal: '',
    metode: 'cash' as 'cash' | 'transfer',
    keterangan: '',
  })
  const [loading, setLoading] = useState(false)

  const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        buku_kas_id: Number(form.buku_kas_id),
        tanggal: form.tanggal,
        jenis: 'pemasukan',
        kategori: form.kategori,
        nominal: Number(form.nominal),
        metode: form.metode,
        keterangan: form.keterangan,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Catat Pemasukan</h2>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buku Kas <span className="text-red-500">*</span></label>
            <select
              value={form.buku_kas_id}
              onChange={e => setForm({ ...form, buku_kas_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih Buku Kas</option>
              {bukuKasList.map(bk => <option key={bk.id} value={bk.id}>{bk.nama_kas}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.tanggal}
              onChange={e => setForm({ ...form, tanggal: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Pemasukan <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.kategori}
              onChange={e => setForm({ ...form, kategori: e.target.value })}
              placeholder="Contoh: Donasi, Hibah, Koreksi Saldo"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.nominal}
              onChange={e => setForm({ ...form, nominal: e.target.value })}
              placeholder="0"
              min="1"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            {form.nominal && <p className="mt-1 text-sm text-green-600 font-medium">{formatRupiah(Number(form.nominal))}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metode <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {(['cash', 'transfer'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, metode: m })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${form.metode === m ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  {m === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan <span className="text-red-500">*</span></label>
            <textarea
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Detail keterangan pemasukan..."
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
