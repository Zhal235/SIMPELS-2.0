import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { KasSummaryData } from '../../types/dashboard.types'
import { TrendingUp, TrendingDown, Landmark } from 'lucide-react'

type Props = {
  data: KasSummaryData | null
  loading: boolean
}

export default function KasKeuanganSummary({ data, loading }: Props) {
  if (loading) {
    return (
      <Card title="Ringkasan Kas Keuangan">
        <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
      </Card>
    )
  }

  const total = data?.total ?? { pemasukan: 0, pengeluaran: 0, saldo: 0 }
  const rows = data?.data ?? []

  return (
    <Card title="Ringkasan Kas Keuangan">
      <div className="flex flex-col sm:flex-row gap-4 mb-5">
        <div className="flex items-center gap-3 flex-1 rounded-xl bg-green-50 px-4 py-3">
          <TrendingUp size={22} className="text-green-600 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Total Pemasukan</p>
            <p className="text-base font-bold text-green-600">{formatRupiah(total.pemasukan)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 rounded-xl bg-red-50 px-4 py-3">
          <TrendingDown size={22} className="text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Total Pengeluaran</p>
            <p className="text-base font-bold text-red-500">{formatRupiah(total.pengeluaran)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 rounded-xl bg-teal-50 px-4 py-3">
          <Landmark size={22} className="text-teal-600 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Total Saldo Berjalan</p>
            <p className="text-base font-bold text-teal-600">{formatRupiah(total.saldo)}</p>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Kas</th>
                <th className="pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Pemasukan</th>
                <th className="pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Pengeluaran</th>
                <th className="pb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.buku_kas_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-2 font-semibold text-gray-800">{row.nama_kas}</td>
                  <td className="py-3 px-2 text-right text-green-600">{formatRupiah(row.total_pemasukan)}</td>
                  <td className="py-3 px-2 text-right text-red-500">{formatRupiah(row.total_pengeluaran)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-teal-600">{formatRupiah(row.saldo_berjalan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">Tidak ada transaksi kas untuk periode ini</p>
      )}
    </Card>
  )
}
