import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { TrendItem } from '../../types/dashboard.types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Props = { data: TrendItem[]; loading: boolean }

function shortLabel(nilai: number) {
  if (nilai >= 1_000_000_000) return `${(nilai / 1_000_000_000).toFixed(1)} M`
  if (nilai >= 1_000_000) return `${(nilai / 1_000_000).toFixed(0)} jt`
  if (nilai >= 1_000) return `${(nilai / 1_000).toFixed(0)} rb`
  return String(nilai)
}

export default function TrendChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    label: `${d.bulan.slice(0, 3)} '${String(d.tahun).slice(2)}`,
    Tagihan: d.totalNominal,
    Terbayar: d.totalDibayar,
  }))

  return (
    <Card title="Tren Pembayaran per Bulan">
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
      ) : !data.length ? (
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data tren</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={3} barCategoryGap="30%">
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={shortLabel}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              formatter={(val) => formatRupiah(val as number)}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Tagihan" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Terbayar" fill="#1ABC9C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
