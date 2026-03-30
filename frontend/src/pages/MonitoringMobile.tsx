import { useEffect, useState } from 'react'
import { getMobileStatistics, getWaliList, getLoginTrend } from '../api/monitoring'
import type { MobileMonitoringStats, WaliMobileInfo, LoginTrendData } from '../api/monitoring'
import { Users, UserCheck, Activity, TrendingUp, Smartphone } from 'lucide-react'
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
import { Line, Pie } from 'react-chartjs-2'
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
  const [loginTrend, setLoginTrend] = useState<LoginTrendData[]>([])
  const [loading, setLoading] = useState(true)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'never' | 'logged_in' | 'active_7' | 'active_30'>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadWaliList()
  }, [currentPage, search, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, trendRes] = await Promise.all([
        getMobileStatistics(),
        getLoginTrend(30)
      ])
      
      if (statsRes.success) setStats(statsRes.data)
      if (trendRes.success) setLoginTrend(trendRes.data)
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
    if (!wali.last_mobile_login_at) {
      return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Belum Login</span>
    }
    
    const lastLogin = new Date(wali.last_mobile_login_at)
    const daysSince = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSince <= 7) {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Aktif</span>
    } else if (daysSince <= 30) {
      return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Aktif 30 Hari</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">Tidak Aktif</span>
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

  const lineChartData = {
    labels: loginTrend.map(d => format(new Date(d.date), 'dd MMM', { locale: idLocale })),
    datasets: [
      {
        label: 'Login Harian',
        data: loginTrend.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
      }
    ]
  }

  const pieChartData = stats ? {
    labels: stats.device_distribution.map(d => d.last_mobile_device),
    datasets: [
      {
        data: stats.device_distribution.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      }
    ]
  } : { labels: [], datasets: [] }

  if (loading) {
    return <div className="p-6 text-center">Memuat data...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Monitoring Aplikasi Mobile</h1>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Wali Santri</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.total_wali || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pernah Login</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.wali_ever_logged_in || 0}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif 7 Hari</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.wali_active_7_days || 0}</p>
            </div>
            <Activity className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tingkat Adopsi</p>
              <p className="text-3xl font-bold text-gray-800">{stats?.adoption_rate || 0}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Trend Login 30 Hari Terakhir</h2>
          <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Device Distribution</h2>
          {stats && stats.device_distribution.length > 0 ? (
            <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          ) : (
            <p className="text-center text-gray-500">Tidak ada data</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Cari nama atau email..."
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
              <option value="never">Belum Pernah Login</option>
              <option value="logged_in">Pernah Login</option>
              <option value="active_7">Aktif 7 Hari</option>
              <option value="active_30">Aktif 30 Hari</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {waliList.map((wali) => (
                <tr key={wali.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{wali.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{wali.email}</td>
                  <td className="px-6 py-4 text-sm">{getStatusBadge(wali)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatLastLogin(wali.last_mobile_login_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{wali.mobile_login_count || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{wali.last_mobile_device || '-'}</td>
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
