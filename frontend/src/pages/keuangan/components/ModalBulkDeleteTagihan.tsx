import { useEffect, useMemo, useState } from 'react'
import { X, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { listJenisTagihan } from '../../../api/jenisTagihan'
import { bulkDeleteTagihan } from '../../../api/tagihanSantri'
import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'

interface Props {
  dataTagihan: TagihanSantriRow[]
  onClose: () => void
  onSuccess: () => void
}

type ModeTarget = 'kelas' | 'perorangan'

const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function ModalBulkDeleteTagihan({ dataTagihan, onClose, onSuccess }: Props) {
  const [jenisTagihan, setJenisTagihan] = useState<Array<{ id: number; nama: string }>>([])
  const [selectedJenisIds, setSelectedJenisIds] = useState<number[]>([])
  const [selectedBulan, setSelectedBulan] = useState<string[]>([])
  const [modeTarget, setModeTarget] = useState<ModeTarget>('kelas')
  const [selectedKelas, setSelectedKelas] = useState<string[]>([])
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([])
  const [searchSantri, setSearchSantri] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadJenisTagihan = async () => {
      try {
        const response = await listJenisTagihan()
        const data = Array.isArray(response) ? response : response?.data || []
        const normalized = data
          .map((item: any) => ({ id: Number(item.id || item.ID || item.jenis_tagihan_id), nama: String(item.nama_tagihan || item.namaTagihan || '').trim() }))
          .filter((item: { id: number; nama: string }) => Number.isFinite(item.id) && item.id > 0 && item.nama)
        setJenisTagihan(normalized)
      } catch {
        toast.error('Gagal memuat jenis tagihan')
      }
    }
    loadJenisTagihan()
  }, [])

  const santriList = useMemo(() => {
    return dataTagihan.map((item) => ({ id: String(item.santri_id), nama: item.santri_nama, kelas: item.kelas }))
  }, [dataTagihan])

  const kelasOptions = useMemo(() => {
    return Array.from(new Set(santriList.map((item) => item.kelas).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }, [santriList])

  const targetSantriIds = useMemo(() => {
    if (modeTarget === 'kelas') {
      if (selectedKelas.length === 0) return []
      return santriList.filter((item) => selectedKelas.includes(item.kelas)).map((item) => item.id)
    }
    return selectedSantriIds
  }, [modeTarget, selectedKelas, selectedSantriIds, santriList])

  const filteredSantri = useMemo(() => {
    const keyword = searchSantri.trim().toLowerCase()
    if (!keyword) return santriList
    return santriList.filter((item) => item.nama.toLowerCase().includes(keyword) || item.kelas.toLowerCase().includes(keyword))
  }, [santriList, searchSantri])

  const selectedJenisNames = useMemo(() => {
    const nameMap = new Map(jenisTagihan.map((item) => [item.id, item.nama]))
    return selectedJenisIds.map((id) => nameMap.get(id)).filter(Boolean) as string[]
  }, [selectedJenisIds, jenisTagihan])

  const previewCount = useMemo(() => {
    if (selectedJenisNames.length === 0 || selectedBulan.length === 0 || targetSantriIds.length === 0) return 0
    const targetSet = new Set(targetSantriIds)
    const jenisSet = new Set(selectedJenisNames)
    const bulanSet = new Set(selectedBulan)

    return dataTagihan
      .filter((item) => targetSet.has(String(item.santri_id)))
      .flatMap((item) => item.detail_tagihan || [])
      .filter((detail) => detail.status === 'belum_bayar' && Number(detail.dibayar || 0) === 0)
      .filter((detail) => jenisSet.has(detail.jenis_tagihan) && bulanSet.has(detail.bulan)).length
  }, [dataTagihan, selectedBulan, selectedJenisNames, targetSantriIds])

  const toggleSelected = <T,>(current: T[], value: T) => {
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  }

  const handleSubmit = async () => {
    if (selectedJenisIds.length === 0) {
      toast.error('Pilih minimal satu jenis tagihan')
      return
    }
    if (selectedBulan.length === 0) {
      toast.error('Pilih minimal satu bulan')
      return
    }
    if (targetSantriIds.length === 0) {
      toast.error(modeTarget === 'kelas' ? 'Pilih minimal satu kelas' : 'Pilih minimal satu santri')
      return
    }

    const confirmText = `Hapus tagihan belum bayar untuk ${targetSantriIds.length} santri, ${selectedBulan.length} bulan, ${selectedJenisIds.length} jenis tagihan? Aksi ini tidak bisa dibatalkan.`
    if (!window.confirm(confirmText)) return

    try {
      setIsSubmitting(true)
      let totalDeleted = 0

      for (const jenisId of selectedJenisIds) {
        const response = await bulkDeleteTagihan({
          jenis_tagihan_id: jenisId,
          bulan_list: selectedBulan,
          santri_ids: targetSantriIds,
          target_mode: modeTarget,
          target_kelas: modeTarget === 'kelas' ? selectedKelas : [],
        })
        totalDeleted += Number(response?.deleted_count || 0)
      }

      toast.success(`${totalDeleted} tagihan berhasil dihapus`)
      onSuccess()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus tagihan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Hapus Tagihan</h2>
            <p className="text-sm text-gray-600">Hanya tagihan dengan status belum bayar dan belum ada pembayaran yang dapat dihapus</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900">1. Pilih Tagihan</h3>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
              {jenisTagihan.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedJenisIds.includes(item.id)}
                    onChange={() => setSelectedJenisIds((prev) => toggleSelected(prev, item.id))}
                  />
                  <span>{item.nama}</span>
                </label>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900">2. Pilih Bulan</h3>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3">
              {BULAN_OPTIONS.map((bulan) => (
                <label key={bulan} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedBulan.includes(bulan)}
                    onChange={() => setSelectedBulan((prev) => toggleSelected(prev, bulan))}
                  />
                  <span>{bulan}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900">3. Pilih Target</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setModeTarget('kelas')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${modeTarget === 'kelas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Per Kelas
              </button>
              <button
                onClick={() => setModeTarget('perorangan')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${modeTarget === 'perorangan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Perorangan
              </button>
            </div>

            {modeTarget === 'kelas' ? (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {kelasOptions.map((kelas) => (
                  <label key={kelas} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedKelas.includes(kelas)}
                      onChange={() => setSelectedKelas((prev) => toggleSelected(prev, kelas))}
                    />
                    <span>{kelas}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchSantri}
                    onChange={(e) => setSearchSantri(e.target.value)}
                    placeholder="Cari nama atau kelas"
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                  {filteredSantri.map((item) => (
                    <label key={item.id} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSantriIds.includes(item.id)}
                          onChange={() => setSelectedSantriIds((prev) => toggleSelected(prev, item.id))}
                        />
                        <span>{item.nama}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.kelas}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          <div className="text-sm text-gray-700">
            <p>Target santri: <span className="font-semibold">{targetSantriIds.length}</span></p>
            <p>Perkiraan tagihan terhapus: <span className="font-semibold text-red-600">{previewCount}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Batal</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isSubmitting ? 'Menghapus...' : 'Hapus Tagihan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
