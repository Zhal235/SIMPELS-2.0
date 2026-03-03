import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getTagihanBySantri } from '@/api/pembayaran'
import { createMutasiKeluar } from '@/api/mutasiKeluar'
import type { Santri } from './SantriForm'

type Row = Santri & { aksi?: string; status?: string }

interface Props {
  mutasiTarget: Row | null
  onClose: () => void
  onSuccess: () => void
}

function bulanToNum(b: string) {
  const map: Record<string, number> = {
    Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
    Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
  }
  return map[b] || 1
}

export default function MutasiModal({ mutasiTarget, onClose, onSuccess }: Props) {
  const [tanggalKeluar, setTanggalKeluar] = useState('')
  const [alasan, setAlasan] = useState('')
  const [tujuanMutasi, setTujuanMutasi] = useState('')
  const [tagihanPreview, setTagihanPreview] = useState<any[]>([])
  const [previewDelete, setPreviewDelete] = useState<any[]>([])
  const [previewKeep, setPreviewKeep] = useState<any[]>([])

  const totalDelete = useMemo(() => previewDelete.reduce((s, t) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewDelete])
  const totalKeep = useMemo(() => previewKeep.reduce((s, t) => s + Number(t?.nominal ?? t?.sisa ?? 0), 0), [previewKeep])

  useEffect(() => {
    if (!mutasiTarget) return
    getTagihanBySantri((mutasiTarget as any).id)
      .then((res: any) => setTagihanPreview(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])))
      .catch(() => setTagihanPreview([]))
  }, [mutasiTarget])

  useEffect(() => {
    if (!tanggalKeluar || tagihanPreview.length === 0) {
      setPreviewDelete([])
      setPreviewKeep(tagihanPreview)
      return
    }
    const dt = new Date(tanggalKeluar)
    const outY = dt.getFullYear()
    const outM = dt.getMonth() + 1
    const del: any[] = [], keep: any[] = []
    tagihanPreview.forEach((t: any) => {
      const tY = Number(t?.tahun || 0)
      const tM = bulanToNum(String(t?.bulan || ''))
      ;(tY > outY || (tY === outY && tM > outM) ? del : keep).push(t)
    })
    setPreviewDelete(del)
    setPreviewKeep(keep)
  }, [tanggalKeluar, tagihanPreview])

  async function handleConfirm() {
    if (!mutasiTarget) return
    try {
      await createMutasiKeluar({
        santri_id: (mutasiTarget as any).id,
        tanggal_mutasi: tanggalKeluar,
        tujuan: tujuanMutasi || null,
        alasan: alasan || null,
      })
      try {
        localStorage.setItem(`mutasi_keluar:${(mutasiTarget as any).id}`, JSON.stringify({
          tanggalKeluar, alasan, tujuanMutasi: tujuanMutasi || '-',
          kelasTertinggal: (mutasiTarget as any).kelas ?? (mutasiTarget as any).kelas_nama ?? null,
        }))
      } catch {}
      toast.success('Mutasi keluar berhasil diproses')
      onSuccess()
      onClose()
    } catch (e: any) {
      if (e?.response?.status === 422) {
        toast.error('Validasi gagal. Lengkapi data profil santri sebelum mutasi.')
      } else {
        toast.error('Gagal memproses mutasi.')
      }
    }
  }

  if (!mutasiTarget) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Konfirmasi Mutasi Keluar</h2>
          <p className="text-sm text-gray-600">{mutasiTarget.nama_santri}</p>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Tanggal Keluar</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={tanggalKeluar} onChange={(e) => setTanggalKeluar(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Alasan</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Tujuan Mutasi</label>
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="Nama sekolah/pesantren tujuan" value={tujuanMutasi} onChange={(e) => setTujuanMutasi(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900">Preview Tagihan</span>
              <div className="flex gap-4">
                <span className="font-medium">Dihapus: {totalDelete.toLocaleString('id-ID')}</span>
                <span className="font-medium">Tunggakan: {totalKeep.toLocaleString('id-ID')}</span>
              </div>
            </div>
            {!tanggalKeluar ? (
              <p className="text-xs text-gray-500">Pilih tanggal keluar untuk melihat preview perubahan tagihan.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <TagihanList title="Dihapus" items={previewDelete} total={totalDelete} variant="delete" />
                <TagihanList title="Tetap" items={previewKeep} total={totalKeep} variant="keep" />
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Batal</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50" disabled={!tanggalKeluar} onClick={handleConfirm}>
            Konfirmasi Mutasi
          </button>
        </div>
      </div>
    </div>
  )
}

function TagihanList({ title, items, total, variant }: { title: string; items: any[]; total: number; variant: 'delete' | 'keep' }) {
  return (
    <div className="border rounded p-2">
      <div className="font-medium text-sm text-gray-800 mb-1">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-500">Tidak ada tagihan.</div>
      ) : (
        <ul className="space-y-1 max-h-[40vh] overflow-auto pr-1">
          {items.map((t: any) => (
            <li key={`${variant}-${t.id}`} className="text-xs flex justify-between">
              <span>{t.jenis_tagihan?.nama_tagihan ?? t.jenis_tagihan} — {t.bulan} {t.tahun}</span>
              <span className="font-medium">{Number(t.nominal ?? t.sisa ?? 0).toLocaleString('id-ID')}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2 mt-2 border-t text-xs font-semibold flex justify-between">
        <span>Total</span>
        <span>{total.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}
