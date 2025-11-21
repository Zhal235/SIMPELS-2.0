import { useEffect, useState } from 'react'
import { createMutasiKeluar } from '@/api/mutasiKeluar'
import { listTagihanBySantri } from '@/api/tagihanSantri'
import toast from 'react-hot-toast'

export default function MutasiKeluarModal({ santri, onClose, onSuccess }: any) {
  const [tujuan, setTujuan] = useState('')
  const [alasan, setAlasan] = useState('')
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10))
  const [tagihan, setTagihan] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadTagihan = async () => {
      try {
        const res = await listTagihanBySantri(santri.id)
        const data = Array.isArray(res) ? res : (res?.data || [])
        setTagihan(data)
      } catch (err) {
        console.error('Error load tagihan', err)
      }
    }
    loadTagihan()
  }, [santri])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await createMutasiKeluar({ santri_id: santri.id, tujuan, alasan, tanggal_mutasi: tanggal })
      toast.success('Mutasi keluar berhasil disimpan')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menyimpan mutasi keluar')
    } finally {
      setLoading(false)
    }
  }

  const bulanMap: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
    'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8, 'September': 9,
    'Oktober': 10, 'November': 11, 'Desember': 12
  }

  const isAfterMutasi = (tBulan: string, tTahun: number) => {
    try {
      const mut = new Date(tanggal)
      const bulanNum = bulanMap[tBulan] ?? 1
      const tagDate = new Date(Number(tTahun), bulanNum - 1, 1)
      // if tagDate strictly greater than month of mutasi
      return tagDate.getFullYear() > mut.getFullYear() || (tagDate.getFullYear() === mut.getFullYear() && tagDate.getMonth() > mut.getMonth())
    } catch {
      return false
    }
  }

  const isTunggakan = (tBulan: string, tTahun: number, sisa: number) => {
    try {
      const today = new Date()
      const bulanNum = bulanMap[tBulan] ?? 1
      const tagDate = new Date(Number(tTahun), bulanNum - 1, 1)
      return (tagDate.getTime() <= today.getTime()) && (Number(sisa) > 0)
    } catch {
      return false
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-2">Konfirmasi Mutasi Keluar</h2>
      <div className="text-sm text-gray-600 mb-4">Santri: <strong>{santri.nama_santri}</strong></div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <input type="text" className="px-3 py-2 border rounded" placeholder="Tujuan mutasi" value={tujuan} onChange={(e) => setTujuan(e.target.value)} />
        <textarea className="px-3 py-2 border rounded" placeholder="Alasan mutasi" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        <input type="date" className="px-3 py-2 border rounded" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Tagihan Santri</h3>
        <div className="max-h-64 overflow-y-auto mt-2">
          {tagihan.length === 0 ? (
            <div className="text-xs text-gray-500">Tidak ada tagihan</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Jenis</th>
                  <th className="text-left">Periode</th>
                  <th className="text-right">Nominal</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tagihan.map((t: any) => {
                  const jenisObj = t.jenisTagihan || t.jenis_tagihan
                  const jenisNama = typeof jenisObj === 'object'
                    ? (jenisObj?.nama_tagihan || jenisObj?.namaTagihan || '')
                    : (t.jenis_tagihan || t.jenisTagihan?.nama_tagihan || '')

                  return (
                    <tr key={t.id} className="border-t">
                      <td>{jenisNama}</td>
                      <td>{t.bulan} {t.tahun}</td>
                      <td className="text-right">{Number(t.nominal).toLocaleString('id-ID')}</td>
                      <td className="text-right">
                        {t.status}{' '}
                        {isTunggakan(t.bulan, t.tahun, t.sisa) && (
                          <span className="text-xs text-yellow-700">(tunggakan)</span>
                        )}
                        {isAfterMutasi(t.bulan, t.tahun) && (
                          <span className="text-xs text-red-600">(akan dihapus)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Batal</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !tanggal}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}
