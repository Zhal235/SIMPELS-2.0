import { useState } from 'react'
import type { BukuKasItem } from './bukuKas.types'

type Props = {
  kas: BukuKasItem | null
  onClose: () => void
  onSave: (data: any) => void
}

export default function ModalFormBukuKas({ kas, onClose, onSave }: Props) {
  const [namaKas, setNamaKas] = useState(kas?.nama_kas ?? '')
  const [saldoCash, setSaldoCash] = useState(kas?.saldo_cash ?? 0)
  const [saldoBank, setSaldoBank] = useState(kas?.saldo_bank ?? 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ nama_kas: namaKas, saldo_cash_awal: saldoCash, saldo_bank_awal: saldoBank })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">{kas ? 'Edit Buku Kas' : 'Tambah Buku Kas'}</h3>
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Cash Awal</label>
            <input
              type="number"
              value={saldoCash}
              onChange={e => setSaldoCash(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Bank Awal</label>
            <input
              type="number"
              value={saldoBank}
              onChange={e => setSaldoBank(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">Batal</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{kas ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
