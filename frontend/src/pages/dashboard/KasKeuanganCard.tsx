import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { KasKeuangan } from '../../types/dashboard.types'
import { TrendingUp, TrendingDown, Landmark } from 'lucide-react'

type Props = { data: KasKeuangan | null; loading: boolean }

export default function KasKeuanganCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card title="Ringkasan Kas Keuangan">
        <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
      </Card>
    )
  }

  return (
    <Card title="Ringkasan Kas Keuangan">
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex items-start gap-2">
          <div className="rounded-xl p-2 bg-green-50 text-green-600 mt-0.5">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Pemasukan</p>
            <p className="font-bold text-green-600">{formatRupiah(data?.totalPemasukan)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-xl p-2 bg-red-50 text-red-500 mt-0.5">
            <TrendingDown size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Pengeluaran</p>
            <p className="font-bold text-red-500">{formatRupiah(data?.totalPengeluaran)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-xl p-2 bg-teal-50 text-teal-600 mt-0.5">
            <Landmark size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Saldo Berjalan</p>
            <p className="font-bold text-teal-600">{formatRupiah(data?.totalSaldoBerjalan)}</p>
          </div>
        </div>
      </div>

      {(data?.perBukuKas ?? []).length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Per Buku Kas</p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Kas</th>
                  <th className="pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Pemasukan</th>
                  <th className="pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Pengeluaran</th>
                  <th className="pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {(data?.perBukuKas ?? []).map((bk) => (
                  <tr key={bk.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-2 font-medium text-gray-800">{bk.namaKas}</td>
                    <td className="py-2.5 px-2 text-right text-green-600 font-medium">{formatRupiah(bk.pemasukan)}</td>
                    <td className="py-2.5 px-2 text-right text-red-500 font-medium">{formatRupiah(bk.pengeluaran)}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-teal-600">{formatRupiah(bk.saldoBerjalan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}