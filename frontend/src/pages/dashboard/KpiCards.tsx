import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { DashboardKpi } from '../../types/dashboard.types'
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type StatItem = {
  label: string
  value: string | number
  icon: LucideIcon
  iconClass: string
  valueClass: string
}

function buildStats(data: DashboardKpi | null): StatItem[] {
  return [
    {
      label: 'Total Santri Aktif',
      value: data?.totalSantri ?? '-',
      icon: Users,
      iconClass: 'text-blue-600 bg-blue-50',
      valueClass: 'text-blue-700',
    },
    {
      label: 'Total Saldo Dompet',
      value: formatRupiah(data?.totalSaldo),
      icon: Wallet,
      iconClass: 'text-green-600 bg-green-50',
      valueClass: 'text-green-700',
    },
    {
      label: 'Total Tagihan Bulan Ini',
      value: formatRupiah(data?.totalTagihan),
      icon: TrendingUp,
      iconClass: 'text-teal-600 bg-teal-50',
      valueClass: 'text-teal-700',
    },
    {
      label: 'Sisa Tunggakan',
      value: formatRupiah(data?.totalTunggakan),
      icon: AlertCircle,
      iconClass: 'text-red-500 bg-red-50',
      valueClass: 'text-red-600',
    },
  ]
}

type Props = { data: DashboardKpi | null; loading: boolean }

export default function KpiCards({ data, loading }: Props) {
  const stats = buildStats(data)

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, iconClass, valueClass }) => (
        <Card key={label}>
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2.5 ${iconClass}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${valueClass}`}>
                {loading ? '...' : value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
