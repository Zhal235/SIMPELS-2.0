import { useState, useMemo } from 'react'
import KpiCards from './dashboard/KpiCards'
import TagihanSummaryTable from './dashboard/TagihanSummaryTable'
import TrendChart from './dashboard/TrendChart'
import RecentPayments from './dashboard/RecentPayments'
import KasKeuanganSummary from './dashboard/KasKeuanganSummary'
import {
  useDashboardKpi,
  useTagihanSummary,
  useDashboardTrend,
  useRecentPayments,
  useDashboardKas,
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

function toDateStr(bulan: string, tahun: number, isEnd = false): string {
  const idx = BULAN_NAMES.indexOf(bulan)
  if (idx < 1) return ''
  if (!isEnd) return `${tahun}-${String(idx).padStart(2, '0')}-01`
  const last = new Date(tahun, idx, 0).getDate()
  return `${tahun}-${String(idx).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

const ALL_MONTHS_VALUE = 'all'
const CUSTOM_VALUE = 'custom'

export default function Dashboard() {
  const now = new Date()
  const [selectedBulan, setSelectedBulan] = useState<string | undefined>(BULAN_NAMES[now.getMonth() + 1])
  const [selectedTahun, setSelectedTahun] = useState<number | undefined>(now.getFullYear())
  const [filterMode, setFilterMode] = useState<'single' | 'all' | 'custom'>('single')

  // Custom range state
  const [customStartBulan, setCustomStartBulan] = useState(BULAN_NAMES[now.getMonth() + 1])
  const [customStartTahun, setCustomStartTahun] = useState(now.getFullYear())
  const [customEndBulan, setCustomEndBulan] = useState(BULAN_NAMES[now.getMonth() + 1])
  const [customEndTahun, setCustomEndTahun] = useState(now.getFullYear())

  // Compute kas date range
  const kasParams = useMemo(() => {
    if (filterMode === 'all') return {}
    if (filterMode === 'custom') {
      return {
        startDate: toDateStr(customStartBulan, customStartTahun, false),
        endDate: toDateStr(customEndBulan, customEndTahun, true),
      }
    }
    if (selectedBulan && selectedTahun) {
      return {
        startDate: toDateStr(selectedBulan, selectedTahun, false),
        endDate: toDateStr(selectedBulan, selectedTahun, true),
      }
    }
    return {}
  }, [filterMode, selectedBulan, selectedTahun, customStartBulan, customStartTahun, customEndBulan, customEndTahun])

  // For KPI and tagihan hooks, use start bulan/tahun when custom
  const kpiFilterBulan = filterMode === 'custom' ? undefined : selectedBulan
  const kpiFilterTahun = filterMode === 'custom' ? undefined : selectedTahun

  const { data: kpi, loading: kpiLoading } = useDashboardKpi(kpiFilterBulan, kpiFilterTahun)
  const { data: tagihanSummary, loading: summaryLoading } = useTagihanSummary(kpiFilterBulan, kpiFilterTahun)
  const { data: trend, loading: trendLoading } = useDashboardTrend(kpi?.tahunAjaranAktif?.id)
  const { data: recentPayments, loading: recentLoading } = useRecentPayments()
  const { data: kasData, loading: kasLoading } = useDashboardKas(kasParams)

  const monthOptions = useMemo(() => {
    if (!kpi?.tahunAjaranAktif) return []
    return getMonthsInTahunAjaran(kpi.tahunAjaranAktif)
  }, [kpi?.tahunAjaranAktif])

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === ALL_MONTHS_VALUE) {
      setFilterMode('all')
      setSelectedBulan(undefined)
      setSelectedTahun(undefined)
      return
    }
    if (val === CUSTOM_VALUE) {
      setFilterMode('custom')
      return
    }
    setFilterMode('single')
    const parts = val.split('-')
    const tahunStr = parts.pop()!
    setSelectedBulan(parts.join('-'))
    setSelectedTahun(Number(tahunStr))
  }

  const selectValue = filterMode === 'custom' ? CUSTOM_VALUE : (selectedBulan ? `${selectedBulan}-${selectedTahun}` : ALL_MONTHS_VALUE)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          {kpi?.tahunAjaranAktif && (
            <p className="text-sm text-gray-500 mt-0.5">{kpi.tahunAjaranAktif.nama_tahun_ajaran}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
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
              <option value={CUSTOM_VALUE}>Custom Range...</option>
            </select>
          )}

          {filterMode === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-xs text-gray-500">Dari:</span>
              <select
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white"
                value={`${customStartBulan}-${customStartTahun}`}
                onChange={e => {
                  const parts = e.target.value.split('-')
                  const y = parts.pop()!
                  setCustomStartBulan(parts.join('-'))
                  setCustomStartTahun(Number(y))
                }}
              >
                {monthOptions.map(({ bulan, tahun }) => (
                  <option key={`s-${bulan}-${tahun}`} value={`${bulan}-${tahun}`}>{bulan} {tahun}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">s/d:</span>
              <select
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white"
                value={`${customEndBulan}-${customEndTahun}`}
                onChange={e => {
                  const parts = e.target.value.split('-')
                  const y = parts.pop()!
                  setCustomEndBulan(parts.join('-'))
                  setCustomEndTahun(Number(y))
                }}
              >
                {monthOptions.map(({ bulan, tahun }) => (
                  <option key={`e-${bulan}-${tahun}`} value={`${bulan}-${tahun}`}>{bulan} {tahun}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <KpiCards data={kpi} loading={kpiLoading} />
      <KasKeuanganSummary data={kasData} loading={kasLoading} />
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