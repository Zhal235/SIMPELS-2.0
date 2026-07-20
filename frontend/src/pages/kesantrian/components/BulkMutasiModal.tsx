import { useEffect, useMemo, useState } from 'react'
import { listKelas } from '@/api/kelas'
import { listSantri } from '@/api/santri'
import { createBulkMutasiKeluar } from '@/api/mutasiKeluar'
import { toast } from 'sonner'

type KelasItem = {
  id: string | number
  nama_kelas: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type SantriItem = {
  id: string
  nama_santri?: string
  nis?: string
}

export default function BulkMutasiModal({ open, onClose, onSuccess }: Props) {
  const [kelasId, setKelasId] = useState('')
  const [tanggalMutasi, setTanggalMutasi] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [santriList, setSantriList] = useState<SantriItem[]>([])
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    if (!open) return
    listKelas().then((res: any) => {
      const data = Array.isArray(res) ? res : res?.data || []
      setKelasList(data)
    }).catch(() => setKelasList([]))
  }, [open])

  useEffect(() => {
    if (!open || !kelasId) {
      setSantriList([])
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        setLoadingPreview(true)
        const res: any = await listSantri(1, 10000, { kelas_id: kelasId, status: 'aktif' })
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : []
        if (!cancelled) {
          setSantriList(data)
          setSelectedSantriIds(data.map((item: SantriItem) => String(item.id)))
        }
      } catch {
        if (!cancelled) {
          setSantriList([])
          setSelectedSantriIds([])
        }
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [open, kelasId])

  const totalSantri = selectedSantriIds.length

  const kelasSelected = useMemo(() => kelasList.find(k => String(k.id) === String(kelasId)), [kelasList, kelasId])

  const allSelected = santriList.length > 0 && selectedSantriIds.length === santriList.length

  function toggleSantri(id: string) {
    setSelectedSantriIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ))
  }

  function toggleAllSantri() {
    if (allSelected) {
      setSelectedSantriIds([])
      return
    }
    setSelectedSantriIds(santriList.map((item) => String(item.id)))
  }

  async function handleSubmit() {
    if (!kelasId) return toast.error('Pilih kelas terlebih dahulu')
    if (!tanggalMutasi) return toast.error('Pilih tanggal mutasi')
    if (selectedSantriIds.length === 0) return toast.error('Pilih minimal satu santri')

    try {
      setLoading(true)
      const res = await createBulkMutasiKeluar({
        kelas_id: kelasId,
        santri_ids: selectedSantriIds,
        tanggal_mutasi: tanggalMutasi,
        keterangan: keterangan || null,
      })
      toast.success(res?.message || 'Bulk mutasi berhasil diproses')
      onSuccess()
      onClose()
      setKelasId('')
      setTanggalMutasi('')
      setKeterangan('')
      setSantriList([])
      setSelectedSantriIds([])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memproses bulk mutasi')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Bulk Mutasi Keluar</h2>
          <p className="text-sm text-gray-600">Pilih kelas, centang santri yang akan dimutasi, lalu isi keterangan bebas.</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select className="w-full border rounded-lg px-3 py-2" value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
                <option value="">-- Pilih kelas --</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mutasi</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" value={tanggalMutasi} onChange={(e) => setTanggalMutasi(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea className="w-full border rounded-lg px-3 py-2 min-h-[96px]" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Isi keterangan mutasi secara bebas" />
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Preview</div>
                <div className="text-base font-semibold text-gray-900">
                  {kelasSelected ? kelasSelected.nama_kelas : 'Belum memilih kelas'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Santri dipilih</div>
                <div className="text-2xl font-bold text-brand">
                  {loadingPreview ? '...' : totalSantri}
                </div>
              </div>
            </div>
            {kelasId && !loadingPreview && santriList.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={allSelected} onChange={toggleAllSantri} />
                    Pilih semua santri di kelas ini
                  </label>
                  <div className="text-xs text-gray-500">{selectedSantriIds.length} dari {santriList.length}</div>
                </div>
                <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                  {santriList.map((santri) => {
                    const checked = selectedSantriIds.includes(String(santri.id))
                    return (
                      <label key={santri.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={checked} onChange={() => toggleSantri(String(santri.id))} />
                          <span className="font-medium text-gray-900">{santri.nama_santri || santri.nis || santri.id}</span>
                        </div>
                        {santri.nis ? <span className="text-xs text-gray-500">NIS {santri.nis}</span> : null}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
            {kelasId && !loadingPreview && santriList.length === 0 && (
              <div className="mt-3 text-sm text-yellow-700">Tidak ada santri aktif di kelas ini.</div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose} disabled={loading}>Batal</button>
          <button className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50" onClick={handleSubmit} disabled={loading || !kelasId || !tanggalMutasi || totalSantri === 0}>
            {loading ? 'Memproses...' : 'Proses Mutasi'}
          </button>
        </div>
      </div>
    </div>
  )
}