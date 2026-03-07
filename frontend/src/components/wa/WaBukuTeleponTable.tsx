import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Pencil, Phone, PhoneOff } from 'lucide-react'
import type { WaPhonebookEntry, PhonebookFilter } from '../../types/wa.types'
import { WaEditHpModal } from './WaEditHpModal'

interface Props {
  entries: WaPhonebookEntry[]
  kelasList: string[]
  filter: PhonebookFilter
  pagination: { currentPage: number; lastPage: number; total: number }
  loading: boolean
  savingId: string | null
  onFilterChange: (partial: Partial<PhonebookFilter>) => void
  onSave: (id: string, hp_ayah: string | null, hp_ibu: string | null) => void
}

const FILTER_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'has_hp', label: 'Ada HP' },
  { value: 'no_hp_ayah', label: 'Belum HP Ayah' },
  { value: 'no_hp_ibu', label: 'Belum HP Ibu' },
]

export function WaBukuTeleponTable({
  entries, kelasList, filter, pagination, loading, savingId, onFilterChange, onSave,
}: Props) {
  const [editEntry, setEditEntry] = useState<WaPhonebookEntry | null>(null)

  const handleSave = async (id: string, hp_ayah: string | null, hp_ibu: string | null) => {
    await onSave(id, hp_ayah, hp_ibu)
    setEditEntry(null)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, atau HP..."
            value={filter.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <select
          value={filter.kelas}
          onChange={e => onFilterChange({ kelas: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ filter: opt.value as PhonebookFilter['filter'] })}
              className={`px-3 py-2 ${filter.filter === opt.value ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Total: <span className="font-medium text-gray-700">{pagination.total}</span> santri
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-8">No</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nama Santri</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kelas</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">HP Ayah</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">HP Ibu</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Memuat data...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
              ) : entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">
                    {(filter.page - 1) * filter.per_page + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{entry.nama_santri}</div>
                    <div className="text-xs text-gray-400">{entry.nis}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.kelas_nama ?? '-'}</td>
                  <td className="px-4 py-3">
                    <HpCell nama={entry.nama_ayah} hp={entry.hp_ayah} />
                  </td>
                  <td className="px-4 py-3">
                    <HpCell nama={entry.nama_ibu} hp={entry.hp_ibu} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditEntry(entry)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit HP"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">
              Hal {pagination.currentPage} dari {pagination.lastPage}
            </span>
            <div className="flex gap-1">
              <button
                disabled={filter.page <= 1}
                onClick={() => onFilterChange({ page: filter.page - 1 })}
                className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.lastPage, 7) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => onFilterChange({ page: p })}
                    className={`px-3 py-1 rounded-md text-sm border ${filter.page === p ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 hover:bg-white'}`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                disabled={filter.page >= pagination.lastPage}
                onClick={() => onFilterChange({ page: filter.page + 1 })}
                className="p-1.5 rounded-md border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <WaEditHpModal
        entry={editEntry}
        saving={savingId === editEntry?.id}
        onClose={() => setEditEntry(null)}
        onSave={handleSave}
      />
    </div>
  )
}

function HpCell({ nama, hp }: { nama: string | null; hp: string | null }) {
  if (!hp) {
    return (
      <div className="flex items-center gap-1.5 text-gray-300">
        <PhoneOff className="w-3.5 h-3.5" />
        <span className="text-xs">{nama ?? '-'}</span>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-700">
        <Phone className="w-3.5 h-3.5 text-green-500" />
        <span className="font-medium">{hp}</span>
      </div>
      {nama && <div className="text-xs text-gray-400 ml-5">{nama}</div>}
    </div>
  )
}
