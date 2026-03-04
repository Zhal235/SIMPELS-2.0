import { useState, useEffect } from 'react'
import api from '../../api/index'
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Scale
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SummaryData {
  total_receipts: number
  total_expenses: number
  net: number
}

interface KategoriData {
  kategori_name: string
  total: number
}

interface RecentTranaksi {
  id: number
  no_transaksi: string
  tanggal: string
  jenis: string
  kategori: string
  nominal: number
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
  const [topKategori, setTopKategori] = useState<KategoriData[]>([])
  const [recentTransaksi, setRecentTransaksi] = useState<RecentTranaksi[]>([])

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

      const [expRes, transaksiRes] = await Promise.all([
        api.get('/v1/keuangan/reports/expenses-by-category', { params: { start: range.start, end: range.end } }),
        api.get('/v1/keuangan/transaksi-kas', { params: { start_date: range.start, end_date: range.end, per_page: 5 } }),
      ])
      const expData = Array.isArray(expRes.data.data) ? expRes.data.data : []
      setTopKategori(
        expData
          .map((e: any) => ({ kategori_name: e.kategori_name || e.kategori || 'Lain-lain', total: parseFloat(e.total) }))
          .sort((a: KategoriData, b: KategoriData) => b.total - a.total)
          .slice(0, 5)
      )
      const transaksiData = Array.isArray(transaksiRes.data.data) ? transaksiRes.data.data : []
      setRecentTransaksi(transaksiData.slice(0, 5))
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

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pengeluaran per Kategori</h2>
        {topKategori.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topKategori} margin={{ top: 4, right: 16, left: 16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kategori_name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {topKategori.map((_, i) => (
                  <Cell key={i} fill={['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Tidak ada data pengeluaran</div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Kategori Pengeluaran</h3>
          <div className="space-y-3">
            {topKategori.length > 0 ? topKategori.map((k, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{k.kategori_name}</span>
                <span className="text-sm font-semibold text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(k.total)}</span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">Tidak ada data pengeluaran</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terbaru</h3>
          <div className="space-y-3">
            {recentTransaksi.length > 0 ? recentTransaksi.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.kategori || t.no_transaksi}</p>
                  <p className="text-xs text-gray-500">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-sm font-semibold ${t.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.jenis === 'pemasukan' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.nominal)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-400 text-center py-4">Tidak ada transaksi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
