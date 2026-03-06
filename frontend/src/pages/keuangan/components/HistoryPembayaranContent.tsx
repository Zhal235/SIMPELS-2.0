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
}

export default function HistoryPembayaranContent({ historyPembayaran }: Props) {
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
              <div key={p.id} className="p-3">
                <p className="font-semibold text-gray-900 text-sm">{p.jenis_tagihan}</p>
                <div className="text-xs text-green-600 font-medium">
                  ✓ {new Date(p.tanggal_bayar).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB
                </div>
                {p.admin_penerima && <p className="text-xs text-gray-500">Penerima: {p.admin_penerima}</p>}
                <p className="font-bold text-gray-900 text-sm mt-1">{formatRupiah(p.nominal_bayar)}</p>
                {p.status_pembayaran === 'sebagian' && (p.sisa_sesudah ?? 0) > 0 && (
                  <p className="text-xs text-orange-600">Sisa: {formatRupiah(p.sisa_sesudah)}</p>
                )}
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
