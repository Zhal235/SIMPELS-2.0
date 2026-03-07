import { useState, useEffect } from 'react'
import { X, Phone } from 'lucide-react'
import type { WaPhonebookEntry } from '../../types/wa.types'

interface Props {
  entry: WaPhonebookEntry | null
  saving: boolean
  onClose: () => void
  onSave: (id: string, hp_ayah: string | null, hp_ibu: string | null) => void
}

export function WaEditHpModal({ entry, saving, onClose, onSave }: Props) {
  const [hpAyah, setHpAyah] = useState('')
  const [hpIbu, setHpIbu] = useState('')

  useEffect(() => {
    if (entry) {
      setHpAyah(entry.hp_ayah ?? '')
      setHpIbu(entry.hp_ibu ?? '')
    }
  }, [entry])

  if (!entry) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(entry.id, hpAyah.trim() || null, hpIbu.trim() || null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-800">Edit Nomor HP</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-b">
          <p className="font-medium text-gray-800 text-sm">{entry.nama_santri}</p>
          <p className="text-xs text-gray-500">{entry.nis} · {entry.kelas_nama ?? '-'}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HP Ayah
              {entry.nama_ayah && <span className="text-gray-400 font-normal ml-1">({entry.nama_ayah})</span>}
            </label>
            <input
              type="tel"
              value={hpAyah}
              onChange={e => setHpAyah(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HP Ibu
              {entry.nama_ibu && <span className="text-gray-400 font-normal ml-1">({entry.nama_ibu})</span>}
            </label>
            <input
              type="tel"
              value={hpIbu}
              onChange={e => setHpIbu(e.target.value)}
              placeholder="Contoh: 08123456789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
