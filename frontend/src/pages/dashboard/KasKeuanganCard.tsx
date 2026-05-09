import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { KasKeuangan, BukuKasSummary } from '../../types/dashboard.types'
import { TrendingUp, TrendingDown, Landmark } from 'lucide-react'

type Props = { data: KasKeuangan | null; loading: boolean }

function KasTable({ kas, title }: { kas: BukuKasSummary[]; title: string }) {
  if (kas.length === 0) {
    return (
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        <p className="text-xs text-gray-400 italic">-</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 px-3 text-xs font-semibold text-gray-400 uppercase">Nama Kas</th>
              <th className="pb-2 px-3 text-xs font-semibold text-gray-400 uppercase text-right">Pemasukan</th>
              <th className="pb-2 px-3 text-xs font-semibold text-gray-400 uppercase text-right">Pengeluaran</th>
              <th className="pb-2 px-3 text-xs font-semibold text-gray-400 uppercase text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {kas.map((bk) => (
              <tr key={bk.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-medium text-gray-800">{bk.namaKas}</td>
                <td className="py-2.5 px-3 text-right text-green-600 font-medium">{formatRupiah(bk.pemasukan)}</td>
                <td className="py-2.5 px-3 text-right text-red-500 font-medium">{formatRupiah(bk.pengeluaran)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-teal-600">{formatRupiah(bk.saldoBerjalan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function KasKeuanganCard({ data, loading }: Props) {
  // Debug log
  if (data) {
    console.log('🔍 KasKeuanganCard Data:', {
      hasRutinKas: !!data.rutinKas,
      rutinKasCount: data.rutinKas?.data?.length ?? 0,
      hasNonRutinKas: !!data.nonRutinKas,
      nonRutinKasCount: data.nonRutinKas?.data?.length ?? 0,
      perBukuKasCount: data.perBukuKas?.length ?? 0,
      perBukuKas: data.perBukuKas,
    })
  }

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

      {/* Display Rutin and Non-Rutin Kas separately if available */}
      {data?.rutinKas || data?.nonRutinKas ? (
        <div className="border-t pt-4 space-y-4">
          {data.rutinKas && (
            <>
              <div className="flex items-center justify-between gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700">Kas Rutin</p>
                  <div className="flex gap-4 mt-1">
                    <div><span className="text-xs text-blue-600">Masuk:</span> <span className="font-bold text-green-600">{formatRupiah(data.rutinKas.totalPemasukan)}</span></div>
                    <div><span className="text-xs text-blue-600">Keluar:</span> <span className="font-bold text-red-600">{formatRupiah(data.rutinKas.totalPengeluaran)}</span></div>
                    <div><span className="text-xs text-blue-600">Saldo:</span> <span className="font-bold text-teal-600">{formatRupiah(data.rutinKas.totalSaldoBerjalan)}</span></div>
                  </div>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded text-blue-600 border border-blue-300">Per Periode</span>
              </div>
              <KasTable kas={data.rutinKas.data} title="Detail Kas Rutin" />
            </>
          )}

          {data.nonRutinKas && (
            <>
              <div className="flex items-center justify-between gap-2 bg-purple-50 p-2 rounded border border-purple-200">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-700">Kas Non-Rutin (Kepanitiaan & Lainnya)</p>
                  <div className="flex gap-4 mt-1">
                    <div><span className="text-xs text-purple-600">Masuk:</span> <span className="font-bold text-green-600">{formatRupiah(data.nonRutinKas.totalPemasukan)}</span></div>
                    <div><span className="text-xs text-purple-600">Keluar:</span> <span className="font-bold text-red-600">{formatRupiah(data.nonRutinKas.totalPengeluaran)}</span></div>
                    <div><span className="text-xs text-purple-600">Saldo:</span> <span className="font-bold text-teal-600">{formatRupiah(data.nonRutinKas.totalSaldoBerjalan)}</span></div>
                  </div>
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded text-purple-600 border border-purple-300">Total</span>
              </div>
              <KasTable kas={data.nonRutinKas.data} title="Detail Kas Non-Rutin" />
            </>
          )}
        </div>
      ) : data && (data?.perBukuKas ?? []).length > 0 ? (
        <div className="border-t pt-4">
          <KasTable kas={data.perBukuKas ?? []} title="Detail Per Buku Kas" />
        </div>
      ) : null}
    </Card>
  )
}