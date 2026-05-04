import { Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Santri } from '../../../types/pembayaran.types'
import { getFotoSrc } from '../../../utils/fotoUrl'
import { listSantri } from '../../../api/santri'

interface Props {
  searchQuery: string
  onQueryChange: (q: string) => void
  onSelect: (s: Santri) => void
  onClear: () => void
  // Props lama dibiarkan opsional agar tidak breaking komponen lain
  showSearchResults?: boolean
  santriList?: Santri[]
  onFocus?: () => void
}

const AVATAR_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'

export default function SantriSearchInput({ searchQuery, onQueryChange, onSelect, onClear }: Props) {
  const [results, setResults] = useState<Santri[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced server-side search — cari di backend, bukan filter 1000 item lokal
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await listSantri(1, 10, { q, status: 'aktif' })
      const data: Santri[] = Array.isArray(res) ? res : (res?.data ?? [])
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.length < 2) { setResults([]); setOpen(false); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(() => search(searchQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, search])

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (santri: Santri) => {
    setOpen(false)
    setResults([])
    onSelect(santri)
  }

  const handleClear = () => {
    setResults([])
    setOpen(false)
    onClear()
  }

  return (
    <div className="w-96" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Cari nama santri atau NIS..."
          value={searchQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        <div className="absolute left-3 top-2.5">
          {loading
            ? <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            : <Search className="h-5 w-5 text-gray-400" />
          }
        </div>
        {searchQuery && (
          <button onClick={handleClear} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        )}

        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {results.map((santri) => (
              <button
                key={santri.id}
                onMouseDown={(e) => e.preventDefault()} // cegah blur sebelum click
                onClick={() => handleSelect(santri)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3"
              >
                <img
                  src={getFotoSrc(santri.foto) ?? AVATAR_FALLBACK}
                  alt={santri.nama_santri}
                  className="w-10 h-10 rounded-full object-cover bg-gray-300 flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{santri.nama_santri}</p>
                  <p className="text-xs text-gray-500">NIS: {santri.nis} • {(santri as any).kelas?.nama_kelas || (santri as any).kelas || 'N/A'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && !loading && searchQuery.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center">
            <p className="text-gray-500 text-sm">Santri tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
