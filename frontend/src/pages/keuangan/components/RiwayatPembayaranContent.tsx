import { useMemo } from 'react'
import { Printer, Trash2 } from 'lucide-react'
import { formatRupiah } from '../../../utils/pembayaranHelpers'
import { hasAccess } from '../../../stores/useAuthStore'
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
  onBatalkanSesi: (ids: number[]) => void
}

export default function RiwayatPembayaranContent({ historyPembayaran, santri, onPrintKwitansi, onBatalkanSesi }: Props) {
  const sessions = useMemo(() => {
    const allItems = Object.values(historyPembayaran).flat()
    const withSession = allItems.filter(p => p.kwitansi_snapshot?.session_id)
    const grouped = new Map<string, HistoryItem[]>()
    for (const item of withSession) {
      const sid = item.kwitansi_snapshot.session_id
      if (!grouped.has(sid)) grouped.set(sid, [])
      grouped.get(sid)!.push(item)
    }
    return Array.from(grouped.values()).sort((a, b) =>
      new Date(b[0].tanggal_bayar).getTime() - new Date(a[0].tanggal_bayar).getTime()
    )
  }, [historyPembayaran])

  if (sessions.length === 0) {
    return <div className="text-center py-12 text-gray-500">Belum ada riwayat pembayaran baru</div>
  }

  function buildPrintData(items: HistoryItem[]) {
    const first = items[0]
    const snap = first.kwitansi_snapshot
    const snapWithDistribusi = items.find(i => i.kwitansi_snapshot?.kembalian_distribusi != null)?.kwitansi_snapshot
    const bayarDate = new Date(first.tanggal_bayar)
    const tanggalWIB = bayarDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' })
    const jamWIB = bayarDate.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' WIB'
    const allLunas = items.every(i => i.status_pembayaran === 'lunas')
    return {
      type: allLunas ? 'lunas' : 'sebagian',
      santri: snap?.santri || santri,
      tagihan: items.map(i => i.kwitansi_snapshot?.tagihan || { id: i.id, jenisTagihan: i.jenis_tagihan, bulan: i.bulan, tahun: i.tahun, nominal: i.nominal_tagihan }),
      totalTagihan: items.reduce((s, i) => s + (i.kwitansi_snapshot?.pembayaran?.sisa_sebelum ?? i.nominal_tagihan ?? 0), 0),
      nominalBayar: snap?.nominal_bayar_pengguna || snap?.pembayaran?.nominal_bayar || first.nominal_bayar,
      kembalian: snap?.kembalian ?? snapWithDistribusi?.kembalian,
      kembalianDistribusi: snapWithDistribusi?.kembalian_distribusi,
      admin: snap?.admin || first.admin_penerima,
      tanggal: snap?.tanggal_cetak || tanggalWIB,
      jam: snap?.jam_cetak || jamWIB,
      noKwitansi: snap?.no_kwitansi,
    }
  }

  return (
    <div className="space-y-4">
      {sessions.map((items) => {
        const first = items[0]
        const snap = items.find(i => i.kwitansi_snapshot?.kembalian_distribusi != null)?.kwitansi_snapshot
          ?? first.kwitansi_snapshot
        const bayarDate = new Date(first.tanggal_bayar)
        const totalBayar = items.reduce((s, i) => s + Number(i.nominal_bayar), 0)
        const kembalian = snap?.kembalian || 0
        const distribusi = snap?.kembalian_distribusi
        const allLunas = items.every(i => i.status_pembayaran === 'lunas')

        return (
          <div key={snap?.session_id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {bayarDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' })}
                  {' • '}
                  {bayarDate.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false })} WIB
                </p>
                {snap?.admin && <p className="text-xs text-gray-500">Admin: {snap.admin}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${allLunas ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {allLunas ? 'Lunas' : 'Sebagian'}
              </span>
            </div>
            <div className="divide-y">
              {items.map((p) => (
                <div key={p.id} className="px-4 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.jenis_tagihan}</p>
                    <p className="text-xs text-gray-500">{p.bulan} {p.tahun}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.nominal_bayar)}</p>
                    {p.status_pembayaran === 'sebagian' && (p.sisa_sesudah ?? 0) > 0 && (
                      <p className="text-xs text-orange-600">Sisa: {formatRupiah(p.sisa_sesudah)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Dibayar:</span>
                <span className="font-bold text-gray-900">{formatRupiah(totalBayar)}</span>
              </div>
              {kembalian > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Kembalian:</span>
                  <span className="font-medium text-green-700">{formatRupiah(kembalian)}</span>
                </div>
              )}
              {distribusi && (
                <p className="text-xs text-gray-500 mb-2">
                  {distribusi.tunai > 0 && <span className="mr-3">Tunai: {formatRupiah(distribusi.tunai)}</span>}
                  {distribusi.dompet > 0 && <span className="mr-3">Dompet: {formatRupiah(distribusi.dompet)}</span>}
                  {distribusi.tabungan > 0 && <span>Tabungan: {formatRupiah(distribusi.tabungan)}</span>}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onPrintKwitansi(buildPrintData(items))}
                  className="flex-1 text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-200 flex items-center gap-1 justify-center"
                >
                  <Printer className="w-3 h-3" /> Print Kwitansi
                </button>
                {hasAccess('keuangan.pembayaran.delete') && (
                  <button
                    onClick={() => onBatalkanSesi(items.map(i => i.id))}
                    className="flex-1 text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 flex items-center gap-1 justify-center"
                  >
                    <Trash2 className="w-3 h-3" /> Batalkan Sesi
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
