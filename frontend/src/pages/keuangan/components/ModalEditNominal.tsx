import { useState, useEffect } from 'react'
import { Search, X, User, CheckCircle } from 'lucide-react'
import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'
import { formatRupiah } from '../../../utils/pembayaranHelpers'
import { listTagihanBySantri, updateTagihanSantri } from '../../../api/tagihanSantri'
import toast from 'react-hot-toast'

interface Props {
  dataTagihan: TagihanSantriRow[]
  onClose: () => void
  onSuccess: () => void
}

export default function ModalEditNominal({ dataTagihan, onClose, onSuccess }: Props) {
  const [selectedSantri, setSelectedSantri] = useState<TagihanSantriRow | null>(null)
  const [tagihanList, setTagihanList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editedRows, setEditedRows] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredSantri = searchTerm.length >= 2
    ? dataTagihan.filter(s => (s.santri_nama || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.kelas || '').toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  useEffect(() => {
    if (selectedSantri) {
      loadTagihan(selectedSantri.santri_id)
      setSearchTerm(`${selectedSantri.santri_nama} - ${selectedSantri.kelas}`)
      setShowSuggestions(false)
    } else { setTagihanList([]) }
  }, [selectedSantri])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.search-container')) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTagihan = async (santriId: number) => {
    try {
      setLoading(true)
      const res = await listTagihanBySantri(santriId)
      setTagihanList(Array.isArray(res) ? res : (res?.data || []))
      setEditedRows({})
    } catch { toast.error('Gagal memuat detail tagihan') }
    finally { setLoading(false) }
  }

  const handleNominalChange = (id: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(num)) setEditedRows(prev => ({ ...prev, [id]: num }))
  }

  const handleSaveAll = async () => {
    const entries = Object.entries(editedRows)
    if (entries.length === 0) { toast('Tidak ada perubahan'); return }
    const locked = entries.filter(([id]) => {
      const t = tagihanList.find((t: any) => String(t.id) === String(id))
      return t && Number(t.dibayar || t.jumlah_dibayar || 0) > 0
    })
    if (locked.length > 0) { toast.error('Terdapat tagihan yang sudah dibayar, tidak dapat disimpan'); return }
    setIsSubmitting(true)
    let ok = 0, fail = 0
    for (const [id, nominal] of entries) {
      try { await updateTagihanSantri(id, { nominal }); ok++ } catch { fail++ }
    }
    setIsSubmitting(false)
    setEditedRows({})
    fail === 0 ? toast.success(`${ok} tagihan berhasil diperbarui`) : toast.error(`${ok} berhasil, ${fail} gagal`)
    if (selectedSantri) loadTagihan(selectedSantri.santri_id)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-blue-50 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-gray-900">Edit Nominal Tagihan Manual</h2><p className="text-sm text-gray-600 mt-1">Ubah nominal tagihan perorangan</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 border-b space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold text-blue-900 mb-1">Informasi Penting</p>
            <ul className="space-y-1 text-xs">
              <li>• Hanya tagihan yang <strong>belum dibayar sama sekali</strong> yang dapat diedit</li>
              <li>• Tagihan yang sudah dibayar akan <strong>terkunci 🔒</strong></li>
            </ul>
          </div>
          <div className="search-container relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text" placeholder="Ketik minimal 2 huruf nama santri..." value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); if (selectedSantri && e.target.value !== `${selectedSantri.santri_nama} - ${selectedSantri.kelas}`) { setSelectedSantri(null); setTagihanList([]) } }}
                onFocus={() => { if (searchTerm.length >= 2) setShowSuggestions(true) }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && <button onClick={() => { setSearchTerm(''); setSelectedSantri(null); setTagihanList([]); setEditedRows({}); setShowSuggestions(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
            </div>
            {showSuggestions && searchTerm.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredSantri.length === 0 ? <div className="px-4 py-3 text-sm text-gray-500 text-center">Santri tidak ditemukan</div> : (
                  <ul>{filteredSantri.map(s => (
                    <li key={s.santri_id} onClick={() => setSelectedSantri(s)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0">
                      <div className="font-medium text-gray-900">{s.santri_nama}</div>
                      <div className="text-gray-500 text-xs">{s.kelas}</div>
                    </li>
                  ))}</ul>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {!selectedSantri ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60"><User className="w-16 h-16 mb-2" /><p>Pilih santri terlebih dahulu</p></div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>Memuat tagihan...</div>
          ) : tagihanList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500"><p>Tidak ada tagihan ditemukan.</p></div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    {['Jenis Tagihan', 'Periode', 'Nominal Asli', 'Nominal Baru'].map(h => (
                      <th key={h} className={`px-4 py-3 font-semibold text-gray-600 ${['Nominal Asli', 'Nominal Baru'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tagihanList.map((t) => {
                    const currentNominal = editedRows[t.id] !== undefined ? editedRows[t.id] : t.nominal
                    const isEdited = editedRows[t.id] !== undefined && editedRows[t.id] !== t.nominal
                    const dibayar = Number(t.dibayar || t.jumlah_dibayar || t.total_dibayar || 0)
                    const canEdit = t.status === 'belum_bayar'
                    return (
                      <tr key={t.id} className={`hover:bg-gray-50 ${!canEdit ? 'bg-gray-50 opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{t.jenis_tagihan_nama || t.jenis_tagihan?.nama_tagihan || t.jenisTagihan?.nama_tagihan || `Tagihan #${t.jenis_tagihan_id || 'Unknown'}`}</div>
                          <div className="flex gap-1 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'lunas' ? 'bg-green-100 text-green-800' : t.status === 'sebagian' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t.status === 'lunas' ? 'Lunas' : t.status === 'sebagian' ? 'Sebagian' : 'Belum Bayar'}</span>
                            {!canEdit && dibayar > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800" title="Tidak dapat diedit">🔒 Terkunci</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.bulan} {t.tahun}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-gray-600">{formatRupiah(t.nominal)}</div>
                          {dibayar > 0 && <div className="text-xs text-green-600 mt-1">Dibayar: {formatRupiah(dibayar)}</div>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEdit ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                              <input type="text" value={currentNominal} onChange={(e) => handleNominalChange(t.id, e.target.value)} onFocus={(e) => e.target.select()} className={`w-full pl-8 pr-2 py-1.5 text-right border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${isEdited ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`} />
                            </div>
                          ) : <div className="text-gray-400 italic text-sm">Tidak dapat diedit</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-sm">{Object.keys(editedRows).length > 0 && <span className="text-orange-600 font-medium">{Object.keys(editedRows).length} tagihan diubah, belum disimpan</span>}</div>
          <div className="flex gap-2">
            <button onClick={() => { onClose(); onSuccess() }} className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors">Tutup</button>
            <button onClick={handleSaveAll} disabled={isSubmitting || Object.keys(editedRows).length === 0} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : `Simpan Semua${Object.keys(editedRows).length > 0 ? ` (${Object.keys(editedRows).length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
