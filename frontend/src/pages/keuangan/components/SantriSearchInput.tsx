import { Search, X } from 'lucide-react'
import type { Santri } from '../../../types/pembayaran.types'
import { getFotoSrc } from '../../../utils/fotoUrl'

interface Props {
  searchQuery: string
  showSearchResults: boolean
  santriList: Santri[]
  onQueryChange: (q: string) => void
  onSelect: (s: Santri) => void
  onClear: () => void
  onFocus: () => void
}

const AVATAR_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'

export default function SantriSearchInput({ searchQuery, showSearchResults, santriList, onQueryChange, onSelect, onClear, onFocus }: Props) {
  const filtered = searchQuery.length >= 2
    ? santriList.filter(s =>
        (s.nama_santri && s.nama_santri.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.nisn && s.nisn.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  return (
    <div className="w-96">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama santri atau NIS..."
            value={searchQuery}
            onChange={(e) => { onQueryChange(e.target.value) }}
            onFocus={onFocus}
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <button onClick={onClear} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {showSearchResults && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {filtered.map((santri) => (
              <button
                key={santri.id}
                onClick={() => onSelect(santri)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3"
              >
                <img
                  src={getFotoSrc(santri.foto) ?? AVATAR_FALLBACK}
                  alt={santri.nama_santri}
                  className="w-10 h-10 rounded-full object-cover bg-gray-300"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{santri.nama_santri}</p>
                  <p className="text-xs text-gray-500">NIS: {santri.nis} • {santri.kelas || 'N/A'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSearchResults && searchQuery.length >= 2 && filtered.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center">
            <p className="text-gray-500 text-sm">Santri tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
