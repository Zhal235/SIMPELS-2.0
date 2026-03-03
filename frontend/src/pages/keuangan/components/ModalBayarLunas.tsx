import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import type { Santri, Tagihan } from '../../../types/pembayaran.types'
import { formatRupiah, getCurrentWIBForBackend } from '../../../utils/pembayaranHelpers'
import { prosesPembayaran } from '../../../api/pembayaran'
import { topupWallet } from '../../../api/wallet'
import { setorTabungan } from '../../../api/tabungan'
import { getTabungan } from '../../../api/tabungan'
import toast from 'react-hot-toast'

interface Props {
  tagihan: Tagihan[]
  selectedTagihan: string[]
  santri: Santri
  userName: string
  onClose: () => void
  onSuccess: (kwitansiData: any) => void
}

export default function ModalBayarLunas({ tagihan, selectedTagihan, santri, userName, onClose, onSuccess }: Props) {
  const [nominalBayar, setNominalBayar] = useState('')
  const [metodeBayar, setMetodeBayar] = useState<'cash' | 'transfer'>('cash')
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

  const handleKonfirmasi = async () => {
    try {
      const now = new Date()
      const tanggalWIB = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' })
      const jamWIB = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' WIB'
      const currentDateTime = getCurrentWIBForBackend()

      for (const t of tagihanTerpilih) {
        const snapshot = {
          no_kwitansi: Math.random().toString(36).substr(2, 9).toUpperCase(),
          type: 'lunas',
          santri: { nis: santri?.nis, nama_santri: santri?.nama_santri, kelas: santri?.kelas },
          tagihan: { jenis_tagihan: t.jenisTagihan, bulan: t.bulan, tahun: t.tahun, nominal: t.nominal },
          pembayaran: { nominal_bayar: t.nominal, sisa_sebelum: t.sisa || t.nominal, sisa_sesudah: 0, metode_pembayaran: metodeBayar, tanggal_bayar: currentDateTime },
          admin: userName,
          tanggal_cetak: tanggalWIB,
          jam_cetak: jamWIB,
        }
        await prosesPembayaran({
          tagihan_santri_id: t.id,
          nominal_bayar: t.nominal,
          metode_pembayaran: metodeBayar,
          tanggal_bayar: currentDateTime,
          keterangan: `Pembayaran ${t.jenisTagihan} - ${t.bulan} ${t.tahun} (${santri?.nama_santri})`,
          kwitansi_data: snapshot,
        })
      }

      toast.success('Pembayaran berhasil!')

      if (opsiKembalian === 'dompet' && kembalian > 0 && santri?.id) {
        try {
          await topupWallet(String(santri.id), kembalian, `Kembalian pembayaran ${tagihanTerpilih.map(t => `${t.jenisTagihan} ${t.bulan} ${t.tahun}`).join(', ')}`, metodeBayar)
          toast.success(`Kembalian ${formatRupiah(kembalian)} berhasil disimpan ke dompet santri`)
        } catch { toast.error('Pembayaran berhasil, tapi gagal menyimpan ke dompet — lakukan manual') }
      }

      if (opsiKembalian === 'tabungan' && kembalian > 0 && santri?.id) {
        try {
          await setorTabungan(String(santri.id), { amount: kembalian, description: `Kembalian pembayaran ${tagihanTerpilih.map(t => `${t.jenisTagihan} ${t.bulan} ${t.tahun}`).join(', ')}`, method: metodeBayar })
          toast.success(`Kembalian ${formatRupiah(kembalian)} berhasil disetorkan ke tabungan`)
        } catch { toast.error('Pembayaran berhasil, tapi gagal menyetor ke tabungan — lakukan manual') }
      }

      onSuccess({ type: 'lunas', santri, tagihan: tagihanTerpilih, totalTagihan, totalBayar: totalTagihan, nominalBayar: Number(nominalBayar), kembalian, opsiKembalian, metodeBayar, tanggal: tanggalWIB, jam: jamWIB, admin: userName })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pembayaran')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">Bayar Lunas</h2></div>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Tagihan yang akan dibayar:</p>
            <div className="space-y-2">
              {tagihanTerpilih.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div><p className="font-medium text-gray-900">{t.jenisTagihan}</p><p className="text-xs text-gray-500">{t.bulan} {t.tahun}</p></div>
                  <p className="font-semibold text-gray-900">{formatRupiah(t.nominal)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
            <p className="font-medium text-gray-700">Total Tagihan:</p>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalTagihan)}</p>
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
              <div className="p-4 bg-green-50 rounded-lg mb-3">
                <p className="text-sm text-gray-700 mb-1">Kembalian:</p>
                <p className="text-xl font-bold text-green-600">{formatRupiah(kembalian)}</p>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">Opsi Kembalian:</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setOpsiKembalian('tunai')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'tunai' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}>Kembalian Tunai</button>
                <button onClick={() => setOpsiKembalian('dompet')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'dompet' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}>Masukkan ke Dompet Santri</button>
                {hasTabungan && <button onClick={() => setOpsiKembalian('tabungan')} className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${opsiKembalian === 'tabungan' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'}`}>💰 Simpan ke Tabungan</button>}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleKonfirmasi} disabled={!nominalBayar || Number(nominalBayar) < totalTagihan} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  )
}
