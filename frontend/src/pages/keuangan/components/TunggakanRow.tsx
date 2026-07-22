import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { SantriOption } from './ModalTambahTunggakan'

interface Props {
  row: {
    id: string
    santri_id: string
    santri_nama: string
    kelas: string
    jenis_tagihan_id: number
    bulan: string[]
    nominal: number
  }
  idx: number
  allSantri: SantriOption[]
  jenisTagihan: any[]
  loadingJenis: boolean
  availableBulan: { bulan: string; tahun: number }[]
  isNominalDisabled: boolean
  onUpdate: (id: string, field: string, value: any) => void
  onRemove: (id: string) => void
}

export default function TunggakanRow({ row, idx, allSantri, jenisTagihan, loadingJenis, availableBulan, isNominalDisabled, onUpdate, onRemove }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSantri = searchTerm.length >= 2
    ? allSantri.filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kelas?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 50) // Limit 50 hasil untuk performa
    : []

  const handleSelectSantri = (santri: SantriOption) => {
    onUpdate(row.id, 'santri', santri)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleClearSantri = () => {
    onUpdate(row.id, 'santri_clear', null)
    setSearchTerm('')
  }

  return (
    <tr key={`${row.id}-${row.santri_id}`} className="border-b">
      <td className="px-3 py-2 border text-center">{idx + 1}</td>
      <td className="px-3 py-2 border">
        <div className="space-y-1 relative" ref={searchRef}>
          {/* Jika santri sudah dipilih, tampilkan info santri */}
          {row.santri_id && row.santri_nama ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm">
              <div className="flex-1">
                <div className="font-medium text-green-900">{row.santri_nama}</div>
                <div className="text-xs text-green-600">{row.kelas}</div>
              </div>
              <button
                onClick={handleClearSantri}
                className="p-1 hover:bg-green-100 rounded"
                title="Ganti santri"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          ) : (
            <>
              {/* Input search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowDropdown(e.target.value.length >= 2)
                  }}
                  onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                  placeholder="Cari nama santri (min 2 huruf)..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Dropdown hasil search */}
              {showDropdown && filteredSantri.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-y-auto z-50">
                  {filteredSantri.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSantri(s)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{s.nama}</div>
                      <div className="text-xs text-gray-500">{s.kelas}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pesan jika tidak ada hasil */}
              {showDropdown && searchTerm.length >= 2 && filteredSantri.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-3 z-50">
                  <div className="text-sm text-gray-500 text-center">Santri tidak ditemukan</div>
                </div>
              )}
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2 border">
        <select
          value={row.jenis_tagihan_id}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) onUpdate(row.id, 'jenis_tagihan_id', v) }}
          className="w-full px-2 py-1 border rounded text-sm"
          disabled={loadingJenis || jenisTagihan.length === 0}
        >
          <option value={0}>-- Pilih Jenis --</option>
          {jenisTagihan.map(j => {
            const jId = j?.id || j?.ID || j?.jenis_tagihan_id
            const jNama = j?.nama_tagihan || j?.namaTagihan || j?.name || 'Unknown'
            return <option key={jId} value={jId}>{jNama}</option>
          })}
        </select>
      </td>
      <td className="px-3 py-2 border">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Pilih Bulan (bisa lebih dari 1):</div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
            {!row.santri_id || !row.jenis_tagihan_id ? (
              <div className="text-xs text-gray-500 italic">Pilih santri dan jenis tagihan terlebih dahulu</div>
            ) : availableBulan.length === 0 ? (
              <div className="text-xs text-orange-600 italic">Semua bulan sudah memiliki tagihan</div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {availableBulan.map(b => {
                  const isSelected = Array.isArray(row.bulan) && row.bulan.includes(b.bulan)
                  return (
                    <label key={`${b.bulan}-${b.tahun}`} className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'} border`}>
                      <input type="checkbox" checked={isSelected} onChange={() => onUpdate(row.id, 'bulan', b.bulan)} className="w-3 h-3" />
                      <span>{b.bulan} {b.tahun}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          {Array.isArray(row.bulan) && row.bulan.length > 0 && (
            <div className="text-xs text-green-600 font-medium">✓ {row.bulan.length} bulan dipilih: {row.bulan.join(', ')}</div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 border">
        <input
          type="number"
          value={row.nominal}
          onChange={(e) => onUpdate(row.id, 'nominal', Number(e.target.value))}
          className="w-full px-2 py-1 border rounded text-sm text-right"
          placeholder="0"
          disabled={isNominalDisabled}
        />
      </td>
      <td className="px-3 py-2 border text-center">
        <button onClick={() => onRemove(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
      </td>
    </tr>
  )
}
