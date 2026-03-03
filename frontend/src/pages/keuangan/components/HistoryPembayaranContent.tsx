import { Printer } from 'lucide-react'
import { formatRupiah } from '../../../utils/pembayaranHelpers'
import type { Santri } from '../../../types/pembayaran.types'

interface HistoryItem {
  id: number
  jenis_tagihan: string
  bulan: string
  tahun: string
  tanggal_bayar: string
  nominal_bayar: number
  nominal_tagihan?: number
  sisa_sebelum?: number
  sisa_sesudah?: number
  status_pembayaran: string
  admin_penerima?: string
  kwitansi_snapshot?: any
}

interface Props {
  historyPembayaran: Record<string, HistoryItem[]>
  santri: Santri
  onPrintKwitansi: (data: any) => void
}

export default function HistoryPembayaranContent({ historyPembayaran, santri, onPrintKwitansi }: Props) {
  if (Object.keys(historyPembayaran).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">Belum ada riwayat pembayaran</div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(historyPembayaran).map(([bulanTahun, pembayaranList]) => (
        <div key={bulanTahun} className="border rounded-lg overflow-hidden flex flex-col border-green-200 bg-green-50">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-green-100 to-green-50 border-green-200">
            <h3 className="text-base font-bold text-gray-900">{bulanTahun}</h3>
          </div>
          <div className="divide-y flex-1">
            {pembayaranList.map((p) => (
              <div key={p.id} className="p-3 hover:bg-white transition-colors">
                <p className="font-semibold text-gray-900 text-sm">{p.jenis_tagihan}</p>
                <div className="text-xs text-green-600 font-medium">
                  ✓ Dibayar: {new Date(p.tanggal_bayar).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB
                </div>
                {p.admin_penerima && <p className="text-xs text-gray-600">Penerima: {p.admin_penerima}</p>}
                <p className="font-bold text-gray-900 text-sm mt-1">{formatRupiah(p.nominal_bayar)}</p>
                {p.status_pembayaran === 'sebagian' && (p.sisa_sesudah ?? 0) > 0 && (
                  <p className="text-xs text-orange-600">Sisa: {formatRupiah(p.sisa_sesudah)}</p>
                )}
                <button
                  onClick={() => {
                    const bayarDate = new Date(p.tanggal_bayar)
                    const tanggalWIB = bayarDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' })
                    const jamWIB = bayarDate.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' WIB'
                    if (p.kwitansi_snapshot) {
                      onPrintKwitansi({
                        type: p.kwitansi_snapshot.type || (p.status_pembayaran === 'lunas' ? 'lunas' : 'sebagian'),
                        santri: p.kwitansi_snapshot.santri || santri,
                        tagihan: p.kwitansi_snapshot.tagihan ? [p.kwitansi_snapshot.tagihan] : [{ id: p.id, jenisTagihan: p.jenis_tagihan, bulan: p.bulan, tahun: p.tahun, nominal: p.nominal_tagihan }],
                        totalTagihan: p.kwitansi_snapshot.tagihan?.nominal || p.nominal_tagihan,
                        totalBayar: p.kwitansi_snapshot.pembayaran?.nominal_bayar || p.nominal_bayar,
                        nominalBayar: p.kwitansi_snapshot.pembayaran?.nominal_bayar || p.nominal_bayar,
                        sisaSebelum: p.kwitansi_snapshot.pembayaran?.sisa_sebelum || p.sisa_sebelum,
                        sisaSesudah: p.kwitansi_snapshot.pembayaran?.sisa_sesudah || p.sisa_sesudah,
                        admin: p.kwitansi_snapshot.admin || p.admin_penerima,
                        tanggal: p.kwitansi_snapshot.tanggal_cetak || tanggalWIB,
                        jam: p.kwitansi_snapshot.jam_cetak || jamWIB,
                        noKwitansi: p.kwitansi_snapshot.no_kwitansi,
                        paymentDetails: p.status_pembayaran === 'sebagian' ? { [p.id]: p.nominal_bayar } : undefined,
                      })
                    } else {
                      onPrintKwitansi({
                        type: p.status_pembayaran === 'lunas' ? 'lunas' : 'sebagian',
                        santri, tagihan: [{ id: p.id, jenisTagihan: p.jenis_tagihan, bulan: p.bulan, tahun: p.tahun, nominal: p.nominal_tagihan }],
                        totalTagihan: p.nominal_tagihan, totalBayar: p.nominal_bayar, nominalBayar: p.nominal_bayar,
                        sisaSebelum: p.sisa_sebelum, sisaSesudah: p.sisa_sesudah, admin: p.admin_penerima, tanggal: tanggalWIB, jam: jamWIB,
                        paymentDetails: p.status_pembayaran === 'sebagian' ? { [p.id]: p.nominal_bayar } : undefined,
                      })
                    }
                  }}
                  className="mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 justify-center w-full"
                >
                  <Printer className="w-3 h-3" /> Print
                </button>
              </div>
            ))}
          </div>
          <div className="bg-green-50 px-4 py-2 border-t border-green-200">
            <p className="text-xs text-gray-600">Total:</p>
            <p className="font-bold text-blue-600">{formatRupiah(pembayaranList.reduce((s, p) => s + Number(p.nominal_bayar), 0))}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
