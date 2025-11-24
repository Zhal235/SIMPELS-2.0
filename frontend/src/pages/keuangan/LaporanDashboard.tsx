import { useState, useEffect } from 'react'
import api from '../../api/index'
import { 
  TrendingUp, 
  TrendingDown,
  Banknote,
  Scale
} from 'lucide-react'

interface SummaryData {
  total_receipts: number
  total_expenses: number
  net: number
}

interface MetricCardProps {
  title: string
  value: number
  icon: any
  color: string
  bgColor: string
  trend?: number
}

function MetricCard({ title, value, icon: Icon, color, bgColor, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-2`}>
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
          </p>
          {trend !== undefined && (
            <p className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% dari periode sebelumnya
            </p>
          )}
        </div>
        <div className={`${bgColor} p-4 rounded-lg`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  )
}

export default function LaporanDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)

  const getDateRange = () => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0))
        end = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'custom':
        if (startDate && endDate) {
          return {
            start: startDate,
            end: endDate
          }
        }
        return null
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const fetchSummary = async () => {
    const range = getDateRange()
    if (!range) return

    setLoading(true)
    try {
      const response = await api.get('/v1/keuangan/reports/summary', {
        params: {
          start: range.start,
          end: range.end
        }
      })
      setSummary(response.data.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [period, startDate, endDate])

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod)
    if (newPeriod !== 'custom') {
      setStartDate('')
      setEndDate('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Ringkasan</h1>
          <p className="text-gray-600 mt-1">Overview keuangan dan metrik utama</p>
        </div>
      </div>

      {/* Filter Periode */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Periode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePeriodChange('custom')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex gap-2 items-center ml-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-2">Memuat data...</p>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Pemasukan"
            value={summary.total_receipts}
            icon={TrendingUp}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Total Pengeluaran"
            value={summary.total_expenses}
            icon={TrendingDown}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <MetricCard
            title="Netto"
            value={summary.net}
            icon={summary.net >= 0 ? Scale : Banknote}
            color={summary.net >= 0 ? 'text-blue-600' : 'text-orange-600'}
            bgColor={summary.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Tidak ada data untuk periode yang dipilih</p>
        </div>
      )}

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tren Keuangan</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Grafik tren akan ditampilkan di sini</p>
            <p className="text-xs text-gray-400">(Implementasi dengan Chart.js atau Recharts)</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Kategori Pengeluaran</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Kategori {i}</span>
                <span className="text-sm font-semibold text-gray-900">Rp 0</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terbaru</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Transaksi {i}</p>
                  <p className="text-xs text-gray-500">24 Nov 2025</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">Rp 0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
