import { useState, useMemo } from 'react'
import KpiCards from './dashboard/KpiCards'
import TagihanSummaryTable from './dashboard/TagihanSummaryTable'
import TrendChart from './dashboard/TrendChart'
import RecentPayments from './dashboard/RecentPayments'
import {
  useDashboardKpi,
  useTagihanSummary,
  useDashboardTrend,
  useRecentPayments,
} from '../hooks/useDashboard'
import type { TahunAjaranAktif } from '../types/dashboard.types'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function getMonthsInTahunAjaran(ta: TahunAjaranAktif) {
  const months: Array<{ bulan: string; tahun: number }> = []
  let m = ta.bulan_mulai
  let y = ta.tahun_mulai
  while (y < ta.tahun_akhir || (y === ta.tahun_akhir && m <= ta.bulan_akhir)) {
    months.push({ bulan: BULAN_NAMES[m], tahun: y })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

const ALL_MONTHS_VALUE = 'all'

export default function Dashboard() {
  const now = new Date()
  const [selectedBulan, setSelectedBulan] = useState<string | undefined>(BULAN_NAMES[now.getMonth() + 1])
  const [selectedTahun, setSelectedTahun] = useState<number | undefined>(now.getFullYear())

  const { data: kpi, loading: kpiLoading } = useDashboardKpi(selectedBulan, selectedTahun)
  const { data: tagihanSummary, loading: summaryLoading } = useTagihanSummary(selectedBulan, selectedTahun)
  const { data: trend, loading: trendLoading } = useDashboardTrend(kpi?.tahunAjaranAktif?.id)
  const { data: recentPayments, loading: recentLoading } = useRecentPayments()

  const monthOptions = useMemo(() => {
    if (!kpi?.tahunAjaranAktif) return []
    return getMonthsInTahunAjaran(kpi.tahunAjaranAktif)
  }, [kpi?.tahunAjaranAktif])

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === ALL_MONTHS_VALUE) {
      setSelectedBulan(undefined)
      setSelectedTahun(undefined)
      return
    }
    const parts = e.target.value.split('-')
    const tahunStr = parts.pop()!
    setSelectedBulan(parts.join('-'))
    setSelectedTahun(Number(tahunStr))
  }

  const selectValue = selectedBulan ? `${selectedBulan}-${selectedTahun}` : ALL_MONTHS_VALUE

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          {kpi?.tahunAjaranAktif && (
            <p className="text-sm text-gray-500 mt-0.5">{kpi.tahunAjaranAktif.nama_tahun_ajaran}</p>
          )}
        </div>
        {monthOptions.length > 0 && (
          <select
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={selectValue}
            onChange={handleMonthChange}
          >
            <option value={ALL_MONTHS_VALUE}>Semua Bulan</option>
            {monthOptions.map(({ bulan, tahun }) => (
              <option key={`${bulan}-${tahun}`} value={`${bulan}-${tahun}`}>
                {bulan} {tahun}
              </option>
            ))}
          </select>
        )}
      </div>

      <KpiCards data={kpi} loading={kpiLoading} />
      <TagihanSummaryTable data={tagihanSummary} loading={summaryLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={trend} loading={trendLoading} />
        </div>
        <RecentPayments data={recentPayments} loading={recentLoading} />
      </div>
    </div>
  )
}