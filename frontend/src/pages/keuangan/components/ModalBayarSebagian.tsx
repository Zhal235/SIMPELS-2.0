import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import type { Santri, Tagihan } from '../../../types/pembayaran.types'
import { formatRupiah, getCurrentWIBForBackend } from '../../../utils/pembayaranHelpers'
import { prosesPembayaran } from '../../../api/pembayaran'
import { topupWallet } from '../../../api/wallet'
import { setorTabungan, getTabungan } from '../../../api/tabungan'
import toast from 'react-hot-toast'

interface Props {
  tagihan: Tagihan[]
  selectedTagihan: string[]
  santri: Santri
  userName: string
  onClose: () => void
  onSuccess: (kwitansiData: any) => void
}

export default function ModalBayarSebagian({ tagihan, selectedTagihan, santri, userName, onClose, onSuccess }: Props) {
  const [nominalBayar, setNominalBayar] = useState('')
  const [metodeBayar, setMetodeBayar] = useState<'cash' | 'transfer'>('cash')
  const [distribusiOtomatis, setDistribusiOtomatis] = useState(true)
  const [opsiKembalian, setOpsiKembalian] = useState<'tunai' | 'dompet' | 'tabungan'>('tunai')
  const [hasTabungan, setHasTabungan] = useState(false)

  useEffect(() => {
    if (santri?.id) {
      getTabungan(String(santri.id))
        .then(res => setHasTabungan(res?.data?.status === 'aktif'))
        .catch(() => setHasTabungan(false))
    }
  }, [santri?.id])

  const tagihanTerpilih = tagihan.filter(t => selectedTagihan.includes(String(t.id)))
  const totalTagihan = tagihanTerpilih.reduce((sum, t) => sum + (Number(t.nominal) || 0), 0)
  const kembalian = Math.max(0, Number(nominalBayar) - totalTagihan)

  const getRekomendasi = () => {
    const nominal = Number(nominalBayar)
    if (!nominal) return []
    let sisa = nominal
    return tagihanTerpilih.map((t) => {
      const bayar = Math.min(sisa, t.nominal)
      sisa -= bayar
      return { ...t, bayar, sisaTagihan: t.nominal - bayar }
    })
  }

  const handleKonfirmasi = async () => {
    try {
      const nominal = Number(nominalBayar)
      const rekomendasi = getRekomendasi()
      let totalBayar = 0
      const currentDateTime = getCurrentWIBForBackend()
      const now = new Date()
      const tanggalWIB = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' })
      const jamWIB = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' WIB'

      if (tagihanTerpilih.length === 1) {
        const t = tagihanTerpilih[0]
        const sisaSesudah = (t.sisa || t.nominal) - nominal
        const snapshot = {
          no_kwitansi: Math.random().toString(36).substr(2, 9).toUpperCase(),
          type: 'sebagian',
          santri: { nis: santri?.nis, nama_santri: santri?.nama_santri, kelas: santri?.kelas },
          tagihan: { jenis_tagihan: t.jenisTagihan, bulan: t.bulan, tahun: t.tahun, nominal: t.nominal },
          pembayaran: { nominal_bayar: nominal, sisa_sebelum: t.sisa || t.nominal, sisa_sesudah: sisaSesudah, metode_pembayaran: metodeBayar, tanggal_bayar: currentDateTime },
          admin: userName, tanggal_cetak: tanggalWIB, jam_cetak: jamWIB,
        }
        await prosesPembayaran({ tagihan_santri_id: t.id, nominal_bayar: nominal, metode_pembayaran: metodeBayar, tanggal_bayar: currentDateTime, keterangan: `Pembayaran sebagian ${t.jenisTagihan} - ${t.bulan} ${t.tahun}`, kwitansi_data: snapshot })
        totalBayar = nominal
      } else {
        let sisa = nominal
        for (const t of tagihanTerpilih) {
          const bayar = Math.min(sisa, t.nominal)
          if (bayar > 0) {
            const sisaSesudah = (t.sisa || t.nominal) - bayar
            const snapshot = {
              no_kwitansi: Math.random().toString(36).substr(2, 9).toUpperCase(),
              type: sisaSesudah === 0 ? 'lunas' : 'sebagian',
              santri: { nis: santri?.nis, nama_santri: santri?.nama_santri, kelas: santri?.kelas },
              tagihan: { jenis_tagihan: t.jenisTagihan, bulan: t.bulan, tahun: t.tahun, nominal: t.nominal },
              pembayaran: { nominal_bayar: bayar, sisa_sebelum: t.sisa || t.nominal, sisa_sesudah: sisaSesudah, metode_pembayaran: metodeBayar, tanggal_bayar: currentDateTime },
              admin: userName, tanggal_cetak: tanggalWIB, jam_cetak: jamWIB,
            }
            await prosesPembayaran({ tagihan_santri_id: t.id, nominal_bayar: bayar, metode_pembayaran: metodeBayar, tanggal_bayar: currentDateTime, keterangan: `Pembayaran sebagian ${t.jenisTagihan} - ${t.bulan} ${t.tahun} (${santri?.nama_santri})`, kwitansi_data: snapshot })
            sisa -= bayar
            totalBayar += bayar
          }
        }
      }

      toast.success('Pembayaran sebagian berhasil!')

      if (opsiKembalian === 'dompet' && kembalian > 0 && santri?.id) {
        try {
          await topupWallet(String(santri.id), kembalian, `Kembalian pembayaran sebagian ${tagihanTerpilih.map(t => `${t.jenisTagihan} ${t.bulan} ${t.tahun}`).join(', ')}`, metodeBayar)
          toast.success(`Kembalian ${formatRupiah(kembalian)} berhasil disimpan ke dompet santri`)
        } catch { toast.error('Pembayaran berhasil, tapi gagal menyimpan ke dompet — lakukan manual') }
      }

      if (opsiKembalian === 'tabungan' && kembalian > 0 && santri?.id) {
        try {
          await setorTabungan(String(santri.id), { amount: kembalian, description: `Kembalian pembayaran sebagian ${tagihanTerpilih.map(t => `${t.jenisTagihan} ${t.bulan} ${t.tahun}`).join(', ')}`, method: metodeBayar })
          toast.success(`Kembalian ${formatRupiah(kembalian)} berhasil disetorkan ke tabungan`)
        } catch { toast.error('Pembayaran berhasil, tapi gagal menyetor ke tabungan — lakukan manual') }
      }

      const paymentDetails: Record<string, number> = {}
      rekomendasi.forEach(item => { paymentDetails[String(item.id)] = item.bayar })
      onSuccess({ type: 'sebagian', santri, tagihan: rekomendasi, totalTagihan, totalBayar, nominalBayar: nominal, kembalian, opsiKembalian, paymentDetails, metodeBayar, tanggal: tanggalWIB, jam: jamWIB, admin: userName })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pembayaran')
    }
  }

  const rekomendasi = getRekomendasi()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">Bayar Sebagian</h2></div>
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <p className="font-medium text-gray-700">Total Tagihan Dipilih:</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalTagihan)}</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-3">
              {(['cash', 'transfer'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMetodeBayar(m)} className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${metodeBayar === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}>
                  {m === 'cash' ? '💵 Cash' : '💳 Transfer'}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nominal Uang yang Dibayarkan</label>
            <input type="text" value={nominalBayar} onChange={(e) => setNominalBayar(e.target.value.replace(/\D/g, ''))} placeholder="Masukkan nominal" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {nominalBayar && <p className="text-sm text-gray-600 mt-1">{formatRupiah(Number(nominalBayar))}</p>}
          </div>
          {kembalian > 0 && (
            <div className="mb-6">
              <div className="p-4 bg-green-50 rounded-lg mb-3"><p className="text-sm text-gray-700 mb-1">Kembalian:</p><p className="text-xl font-bold text-green-600">{formatRupiah(kembalian)}</p></div>
              <p className="text-sm font-medium text-gray-700 mb-2">Opsi Kembalian:</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setOpsiKembalian('tunai')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'tunai' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}>Kembalian Tunai</button>
                <button onClick={() => setOpsiKembalian('dompet')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'dompet' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}>Masukkan ke Dompet Santri</button>
                {hasTabungan && <button onClick={() => setOpsiKembalian('tabungan')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'tabungan' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'}`}>💰 Simpan ke Tabungan</button>}
              </div>
            </div>
          )}
          {nominalBayar && Number(nominalBayar) > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Rekomendasi Pembayaran:</p>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={distribusiOtomatis} onChange={(e) => setDistribusiOtomatis(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  Distribusi Otomatis
                </label>
              </div>
              <div className="space-y-2">
                {rekomendasi.map((item) => (
                  <div key={item.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div><p className="font-medium text-gray-900">{item.jenisTagihan}</p><p className="text-xs text-gray-500">{item.bulan} {item.tahun}</p></div>
                      <p className="text-sm text-gray-600">Total: {formatRupiah(item.nominal)}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <p className="text-sm font-medium text-green-600">Dibayar: {formatRupiah(item.bayar)}</p>
                      {item.sisaTagihan > 0
                        ? <p className="text-sm font-medium text-orange-600">Sisa: {formatRupiah(item.sisaTagihan)}</p>
                        : <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle className="w-4 h-4" />Lunas</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleKonfirmasi} disabled={!nominalBayar || Number(nominalBayar) <= 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  )
}
