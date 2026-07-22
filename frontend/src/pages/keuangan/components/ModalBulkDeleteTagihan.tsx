import { useEffect, useMemo, useState } from 'react'
import { X, Trash2, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { listJenisTagihan } from '../../../api/jenisTagihan'
import { bulkDeleteTagihan, listTagihanSantri } from '../../../api/tagihanSantri'
import { listSantri } from '../../../api/santri'
import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

interface Props {
  dataTagihan: TagihanSantriRow[]
  onClose: () => void
  onSuccess: () => void
}

type ModeTarget = 'kelas' | 'perorangan'

const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function ModalBulkDeleteTagihan({ dataTagihan, onClose, onSuccess }: Props) {
  const [jenisTagihan, setJenisTagihan] = useState<Array<{ id: number; nama: string }>>([])
  const [fullDataTagihan, setFullDataTagihan] = useState<TagihanSantriRow[]>([])
  // Semua santri aktif (dari endpoint santri, bukan hanya yang punya tagihan)
  const [allSantriList, setAllSantriList] = useState<Array<{ id: string; nama: string; kelas: string }>>([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [selectedJenisIds, setSelectedJenisIds] = useState<number[]>([])
  const [selectedBulan, setSelectedBulan] = useState<string[]>([])
  const [selectedTahun, setSelectedTahun] = useState<number[]>([])
  const [modeTarget, setModeTarget] = useState<ModeTarget>('kelas')
  const [selectedKelas, setSelectedKelas] = useState<string[]>([])
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([])
  const [searchSantri, setSearchSantri] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [jenisRes, detailRes, santriRes] = await Promise.all([
          listJenisTagihan(),
          listTagihanSantri({ include_detail: true, perPage: 9999 }),
          // Fetch semua santri aktif (bukan hanya yang punya tagihan)
          listSantri(1, 9999, { status: 'aktif' }),
        ])

        // Normalize jenis tagihan
        const jenisData = Array.isArray(jenisRes) ? jenisRes : jenisRes?.data || []
        const normalized = jenisData
          .map((item: any) => ({ id: Number(item.id || item.ID || item.jenis_tagihan_id), nama: String(item.nama_tagihan || item.namaTagihan || '').trim() }))
          .filter((item: { id: number; nama: string }) => Number.isFinite(item.id) && item.id > 0 && item.nama)
        setJenisTagihan(normalized)

        // Normalize full tagihan with detail (untuk preview & tahun)
        const payload = detailRes && Array.isArray(detailRes.data) ? detailRes : (detailRes?.data || detailRes)
        const rows: TagihanSantriRow[] = Array.isArray(payload?.data) ? payload.data : []
        setFullDataTagihan(rows)

        // Normalize semua santri aktif dengan kelas (untuk target selector)
        const santriPayload = santriRes?.data || santriRes
        const santriRows: any[] = Array.isArray(santriPayload?.data)
          ? santriPayload.data
          : Array.isArray(santriPayload)
          ? santriPayload
          : []
        const santriNormalized = santriRows
          .filter((s: any) => s.kelas_id || s.kelas) // hanya santri yang sudah punya kelas
          .map((s: any) => ({
            id: String(s.id),
            nama: String(s.nama_santri || s.nama || ''),
            kelas: String(s.kelas?.nama_kelas || s.kelas || ''),
          }))
          .filter((s) => s.kelas) // pastikan kelas tidak kosong
          .sort((a, b) => a.nama.localeCompare(b.nama))
        setAllSantriList(santriNormalized)
      } catch {
        toast.error('Gagal memuat data')
      } finally {
        setLoadingDetail(false)
      }
    }
    loadAll()
  }, [])

  // Untuk target selector: pakai allSantriList (semua santri aktif dengan kelas)
  const santriList = useMemo(() => allSantriList, [allSantriList])


  const kelasOptions = useMemo(() => {
    return Array.from(new Set(santriList.map((item) => item.kelas).filter(Boolean))).sort((a, b) => (a ?? '').localeCompare(b ?? ''))
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
    return santriList.filter((item) => (item.nama?.toLowerCase?.().includes(keyword) ?? false) || (item.kelas?.toLowerCase?.().includes(keyword) ?? false))
  }, [santriList, searchSantri])

  const selectedJenisNames = useMemo(() => {
    const nameMap = new Map(jenisTagihan.map((item) => [item.id, item.nama]))
    return selectedJenisIds.map((id) => nameMap.get(id)).filter(Boolean) as string[]
  }, [selectedJenisIds, jenisTagihan])

  const tahunOptions = useMemo(() => {
    if (targetSantriIds.length === 0) return []
    const targetSet = new Set(targetSantriIds)
    const tahunSet = new Set<number>()
    fullDataTagihan
      .filter((item) => targetSet.has(String(item.santri_id)))
      .forEach((item) => {
        item.detail_tagihan?.forEach((detail) => {
          tahunSet.add(detail.tahun)
        })
      })
    return Array.from(tahunSet).sort((a, b) => a - b)
  }, [fullDataTagihan, targetSantriIds])

  const previewData = useMemo(() => {
    if (selectedJenisNames.length === 0 || selectedBulan.length === 0 || selectedTahun.length === 0 || targetSantriIds.length === 0) return []
    const targetSet = new Set(targetSantriIds)
    const jenisSet = new Set(selectedJenisNames)
    const bulanSet = new Set(selectedBulan)
    const tahunSet = new Set(selectedTahun)

    const result: Array<{ santri_nama: string; jenis_tagihan: string; bulan: string; tahun: number; nominal: number }> = []
    fullDataTagihan
      .filter((item) => targetSet.has(String(item.santri_id)))
      .forEach((item) => {
        item.detail_tagihan?.forEach((detail) => {
          if (detail.status === 'belum_bayar' && Number(detail.dibayar || 0) === 0 && jenisSet.has(detail.jenis_tagihan) && bulanSet.has(detail.bulan) && tahunSet.has(detail.tahun)) {
            result.push({
              santri_nama: item.santri_nama,
              jenis_tagihan: detail.jenis_tagihan,
              bulan: detail.bulan,
              tahun: detail.tahun,
              nominal: Number(detail.nominal || 0),
            })
          }
        })
      })
    return result
  }, [fullDataTagihan, selectedBulan, selectedJenisNames, selectedTahun, targetSantriIds])

  const previewCount = previewData.length

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
    if (selectedTahun.length === 0) {
      toast.error('Pilih minimal satu tahun')
      return
    }
    if (targetSantriIds.length === 0) {
      toast.error(modeTarget === 'kelas' ? 'Pilih minimal satu kelas' : 'Pilih minimal satu santri')
      return
    }
    if (previewCount === 0) {
      toast.error('Tidak ada tagihan yang sesuai dengan filter')
      return
    }

    const tahunText = selectedTahun.join(', ')
    const confirmText = `Hapus ${previewCount} tagihan:\n\nSantri: ${targetSantriIds.length}\nJenis: ${selectedJenisIds.length}\nBulan: ${selectedBulan.join(', ')}\nTahun: ${tahunText}\n\nAksi ini tidak bisa dibatalkan!`
    if (!window.confirm(confirmText)) return

    try {
      setIsSubmitting(true)
      let totalDeleted = 0

      for (const jenisId of selectedJenisIds) {
        const response = await bulkDeleteTagihan({
          jenis_tagihan_id: jenisId,
          bulan_list: selectedBulan,
          tahun_list: selectedTahun,
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

        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm">Memuat data tagihan...</p>
          </div>
        ) : (
          <>
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

            <h3 className="font-semibold text-gray-900">2. Pilih Bulan & Tahun</h3>
            <div>
              <p className="mb-2 text-xs text-gray-600">Bulan:</p>
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
              <p className="mb-2 mt-3 text-xs text-gray-600">Tahun (dari santri yang dipilih):</p>
              {tahunOptions.length === 0 ? (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                  Pilih santri/kelas dulu untuk melihat tahun tagihan tersedia
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 rounded-md border p-3">
                  {tahunOptions.map((tahun) => (
                    <label key={tahun} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedTahun.includes(tahun)}
                        onChange={() => setSelectedTahun((prev) => toggleSelected(prev, tahun))}
                      />
                      <span>{tahun}</span>
                    </label>
                  ))}
                </div>
              )}
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

        {previewCount > 0 && (
          <div className="border-t bg-blue-50 px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Preview Tagihan yang Akan Dihapus ({previewCount})</h3>
              <p className="text-xs text-gray-600">Total Nominal: {formatCurrency(previewData.reduce((sum, item) => sum + item.nominal, 0))}</p>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border bg-white">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="border-b px-3 py-2 text-left font-semibold">Santri</th>
                    <th className="border-b px-3 py-2 text-left font-semibold">Jenis</th>
                    <th className="border-b px-3 py-2 text-left font-semibold">Bulan</th>
                    <th className="border-b px-3 py-2 text-center font-semibold">Tahun</th>
                    <th className="border-b px-3 py-2 text-right font-semibold">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-blue-100">
                      <td className="px-3 py-2 text-gray-700">{item.santri_nama}</td>
                      <td className="px-3 py-2 text-gray-700">{item.jenis_tagihan}</td>
                      <td className="px-3 py-2 text-gray-700">{item.bulan}</td>
                      <td className="px-3 py-2 text-center text-gray-700 font-medium">{item.tahun}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
          <div className="text-sm text-gray-700">
            <p>Target santri: <span className="font-semibold">{targetSantriIds.length}</span></p>
            <p>Tagihan akan dihapus: <span className="font-semibold text-red-600">{previewCount}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Batal</button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || previewCount === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isSubmitting ? 'Menghapus...' : 'Hapus Tagihan'}
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
