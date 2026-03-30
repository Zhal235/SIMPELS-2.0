import { useEffect, useState } from 'react'
import { getMobileStatistics, getWaliList, getDailyActiveUsers, getPopularFeatures, getRealTimeStats } from '../api/monitoring'
import type { MobileMonitoringStats, WaliMobileInfo, LoginTrendData, RealTimeStats } from '../api/monitoring'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function MonitoringMobile() {
  const [stats, setStats] = useState<MobileMonitoringStats | null>(null)
  const [waliList, setWaliList] = useState<WaliMobileInfo[]>([])
  const [dauTrend, setDauTrend] = useState<LoginTrendData[]>([])
  const [popularFeatures, setPopularFeatures] = useState<Array<{feature: string; action: string; count: number}>>([])
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'never' | 'partial' | 'full'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadWaliList()
  }, [currentPage, search, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, dauRes, featuresRes, realtimeRes] = await Promise.all([
        getMobileStatistics(),
        getDailyActiveUsers(30),
        getPopularFeatures(7),
        getRealTimeStats()
      ])
      
      if (statsRes.success) setStats(statsRes.data)
      if (dauRes.success) setDauTrend(dauRes.data)
      if (featuresRes.success) setPopularFeatures(featuresRes.data)
      if (realtimeRes.success) setRealTimeStats(realtimeRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWaliList = async () => {
    try {
      const params: any = { page: currentPage, per_page: 15 }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      
      const res = await getWaliList(params)
      if (res.success) {
        setWaliList(res.data.data)
        setTotalPages(res.data.last_page)
      }
    } catch (error) {
      console.error('Error loading wali list:', error)
    }
  }

  const getStatusBadge = (wali: WaliMobileInfo) => {
    const ayahLogin = wali.ayah_login_status
    const ibuLogin = wali.ibu_login_status
    
    if (!ayahLogin && !ibuLogin) {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Belum Login</span>
    } else if (ayahLogin && ibuLogin) {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Full Adopted</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">Sebagian</span>
    }
  }

  const formatLastLogin = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: idLocale })
    } catch {
      return '-'
    }
  }

  const dauChartData = {
    labels: dauTrend.map(d => format(new Date(d.date), 'dd MMM', { locale: idLocale })),
    datasets: [
      {
        label: 'Daily Active Users',
        data: dauTrend.map(d => d.count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  if (loading) {
    return <div className="p-6 text-center">Memuat data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Monitoring Aplikasi Mobile</h1>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Refresh
        </button>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Total Santri</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.total_santri || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Wali Login</p>
          <p className="text-2xl font-bold text-green-600">{stats?.santri_with_wali_login || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600">Full Adopted</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.santri_fully_adopted || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <p className="text-xs text-gray-600">Tingkat Adopsi</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.adoption_rate || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-cyan-500">
          <p className="text-xs text-gray-600">Aktif Hari Ini</p>
          <p className="text-2xl font-bold text-cyan-600">{realTimeStats?.active_users_today || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
          <p className="text-xs text-gray-600">Aktivitas Hari Ini</p>
          <p className="text-2xl font-bold text-pink-600">{realTimeStats?.total_activities_today || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-600">Avg Response</p>
          <p className="text-2xl font-bold text-yellow-600">{Math.round(realTimeStats?.avg_response_time || 0)}ms</p>
        </div>
      </div>

      {/* Main Content: Chart + Top Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAU Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold mb-3 text-gray-700">Daily Active Users (30 Hari)</h2>
          <div className="h-64">
            <Line data={dauChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>

        {/* Top Features - Compact */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-base font-semibold mb-3 text-gray-700">Top 5 Fitur (7 Hari)</h2>
          {popularFeatures.length > 0 ? (
            <div className="space-y-2">
              {popularFeatures.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.feature || item.action}</p>
                    <p className="text-xs text-gray-500">{item.action}</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">Belum ada data</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Cari nama santri, NIS, atau nomor HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Semua Status</option>
              <option value="never">Belum Ada Yang Login</option>
              <option value="partial">Login Sebagian (1 wali)</option>
              <option value="full">Full Adopted (2 wali)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HP Ayah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HP Ibu</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {waliList.map((santri) => (
                <tr key={santri.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{santri.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{santri.nama_santri}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{santri.kelas}</td>
                  <td className="px-6 py-4 text-sm">
                    {santri.hp_ayah ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{santri.hp_ayah}</span>
                          {santri.ayah_login_status ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Login
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                              Belum
                            </span>
                          )}
                        </div>
                        {santri.ayah_login_status && (
                          <div className="text-xs text-gray-500">
                            {santri.ayah_login_count}x • {formatLastLogin(santri.ayah_last_login)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {santri.hp_ibu ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{santri.hp_ibu}</span>
                          {santri.ibu_login_status ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Login
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                              Belum
                            </span>
                          )}
                        </div>
                        {santri.ibu_login_status && (
                          <div className="text-xs text-gray-500">
                            {santri.ibu_login_count}x • {formatLastLogin(santri.ibu_last_login)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(santri)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
