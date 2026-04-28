import { useState } from 'react'
import { X, Pencil } from 'lucide-react'

interface Props {
  transaksi: any
  bukuKasList: any[]
  categories: Array<{ id: number; name: string }>
  onClose: () => void
  onSubmit: (id: number, data: any) => Promise<void>
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function ModalEditTransaksi({ transaksi, bukuKasList, categories, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    buku_kas_id: String(transaksi.buku_kas_id),
    tanggal: transaksi.tanggal?.split('T')[0] ?? transaksi.tanggal,
    jenis: transaksi.jenis as 'pemasukan' | 'pengeluaran',
    metode: transaksi.metode as 'cash' | 'transfer',
    kategori: transaksi.kategori ?? '',
    kategori_id: transaksi.kategori_id ? String(transaksi.kategori_id) : '',
    nominal: String(transaksi.nominal),
    keterangan: transaksi.keterangan ?? '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(transaksi.id, {
        buku_kas_id: Number(form.buku_kas_id),
        tanggal: form.tanggal,
        jenis: form.jenis,
        metode: form.metode,
        kategori: form.kategori,
        kategori_id: form.kategori_id ? Number(form.kategori_id) : null,
        nominal: Number(form.nominal),
        keterangan: form.keterangan,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKategoriChange = (value: string) => {
    const found = categories.find(c => c.name.toLowerCase() === value.toLowerCase())
    setForm({ ...form, kategori: value, kategori_id: found ? String(found.id) : '' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pencil className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Transaksi</h2>
              <p className="text-sm text-gray-500">{transaksi.no_transaksi}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buku Kas <span className="text-red-500">*</span></label>
              <select
                value={form.buku_kas_id}
                onChange={e => setForm({ ...form, buku_kas_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Transaksi <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {(['pemasukan', 'pengeluaran'] as const).map(j => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setForm({ ...form, jenis: j })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${form.jenis === j ? (j === 'pemasukan' ? 'border-green-600 bg-green-50 text-green-700' : 'border-red-600 bg-red-50 text-red-700') : 'border-gray-300 hover:border-gray-400'}`}
                >
                  {j === 'pemasukan' ? '↑ Pemasukan' : '↓ Pengeluaran'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
            <input
              list="edit-kategori-list"
              type="text"
              value={form.kategori}
              onChange={e => handleKategoriChange(e.target.value)}
              placeholder="Pilih atau ketik kategori"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="edit-kategori-list">
              {categories.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.nominal}
              onChange={e => setForm({ ...form, nominal: e.target.value })}
              placeholder="0"
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {form.nominal && <p className="mt-1 text-sm text-gray-600">{formatRupiah(Number(form.nominal))}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metode <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {(['cash', 'transfer'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, metode: m })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${form.metode === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  {m === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              value={form.keterangan}
              onChange={e => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Detail keterangan transaksi..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
