import { useState } from 'react'
import type { BukuKasItem } from './bukuKas.types'

type Props = {
  kas: BukuKasItem | null
  onClose: () => void
  onSave: (data: any) => void
}

export default function ModalFormBukuKas({ kas, onClose, onSave }: Props) {
  const [namaKas, setNamaKas] = useState(kas?.nama_kas ?? '')
  const [kategori, setKategori] = useState((kas as any)?.kategori ?? 'Rutin')
  const [keterangan, setKeterangan] = useState((kas as any)?.keterangan ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      onSave({ 
        nama_kas: namaKas, 
        kategori: kategori,
        keterangan: keterangan
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">{kas ? 'Edit Buku Kas' : 'Tambah Buku Kas'}</h3>
          <p className="text-xs text-gray-500 mt-1">💡 Saldo otomatis dihitung dari transaksi yang tercatat</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Buku Kas *</label>
            <input
              type="text"
              value={namaKas}
              onChange={e => setNamaKas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Kas SPP"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              value={kategori}
              onChange={e => setKategori(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="Rutin">Rutin (Operasional Harian)</option>
              <option value="Non Rutin">Non-Rutin (Kepanitiaan & Lainnya)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Kas Kepanitiaan Ramadhan 2026"
              rows={2}
              disabled={loading}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>ℹ️ Catatan:</strong> Saldo kas dihitung otomatis dari:
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Total pembayaran tagihan yang masuk</li>
              <li>• Total transaksi pengeluaran yang dicatat</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{loading ? 'Menyimpan...' : (kas ? 'Update' : 'Simpan')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
