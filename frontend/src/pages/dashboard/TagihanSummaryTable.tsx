import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { TagihanSummaryItem } from '../../types/dashboard.types'

type Props = {
  data: TagihanSummaryItem[]
  loading: boolean
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-10 text-right text-gray-600">
        {value}%
      </span>
    </div>
  )
}

export default function TagihanSummaryTable({ data, loading }: Props) {
  if (loading) {
    return (
      <Card title="Akumulasi Tagihan per Jenis">
        <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card title="Akumulasi Tagihan per Jenis">
        <div className="text-center py-10 text-gray-400 text-sm">
          Tidak ada data tagihan untuk filter ini
        </div>
      </Card>
    )
  }

  return (
    <Card title="Akumulasi Tagihan per Jenis">
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Jenis Tagihan
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Target
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Terbayar
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Sisa
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                Sudah Bayar
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                Belum Bayar
              </th>
              <th className="pb-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Progres
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.jenisTagihanId} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3.5 px-2 font-semibold text-gray-800">{row.namaTagihan}</td>
                <td className="py-3.5 px-2 text-right text-gray-500">
                  {formatRupiah(row.totalNominal)}
                </td>
                <td className="py-3.5 px-2 text-right font-medium text-green-600">
                  {formatRupiah(row.totalDibayar)}
                </td>
                <td className="py-3.5 px-2 text-right font-medium text-red-500">
                  {formatRupiah(row.totalSisa)}
                </td>
                <td className="py-3.5 px-2 text-center">
                  <p className="font-semibold text-green-700">{row.jumlahLunas} santri</p>
                  <p className="text-xs text-gray-400">({row.persentaseLunas}%)</p>
                </td>
                <td className="py-3.5 px-2 text-center">
                  <p className="font-semibold text-red-600">{row.jumlahBelumLunas} santri</p>
                  <p className="text-xs text-gray-400">
                    ({(100 - row.persentaseLunas).toFixed(1)}%)
                  </p>
                </td>
                <td className="py-3.5 px-2">
                  <ProgressBar value={row.persentaseLunas} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
