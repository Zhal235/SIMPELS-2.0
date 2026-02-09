import { useState, useEffect } from 'react'
import api from '../../api/index'
import { listTahunAjaran } from '../../api/tahunAjaran'
import { Download, Printer, Filter, Search } from 'lucide-react'

interface TagihanData {
  id: number
  santri: {
    nama: string
    nis: string
    kelas?: {
      nama_kelas: string
    }
  }
  jenis_tagihan: {
    nama_tagihan: string
  }
  bulan: string
  tahun: number
  nominal: number
  dibayar: number
  sisa: number
  status: 'belum_bayar' | 'cicilan' | 'lunas'
  jatuh_tempo: string
}

interface Summary {
  total_tagihan: number
  total_dibayar: number
  total_sisa: number
  jumlah_lunas: number
  jumlah_belum_lunas: number
  jumlah_cicilan: number
}

export default function LaporanTagihanSantri() {
  const [data, setData] = useState<TagihanData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [filterBulan, setFilterBulan] = useState<string>('all')
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear() + '')
  const [filterTa, setFilterTa] = useState<string>('all')
  const [tahuns, setTahuns] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterJenisTagihan, setFilterJenisTagihan] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  
  const [jenisTagihanList, setJenisTagihanList] = useState<Array<{id: number, nama_tagihan: string}>>([])

  const bulanOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ]

  useEffect(() => {
    fetchJenisTagihan()
    listTahunAjaran().then((res: any) => setTahuns(res.data || res || []))
  }, [])

  useEffect(() => {
    fetchData()
  }, [filterBulan, filterTahun, filterStatus, filterJenisTagihan, filterTa])

  const fetchJenisTagihan = async () => {
    try {
      const response = await api.get('/v1/keuangan/jenis-tagihan')
      const dataArray = Array.isArray(response.data.data) ? response.data.data : 
                       Array.isArray(response.data) ? response.data : []
      // Convert camelCase to snake_case for consistency
      const mapped = dataArray.map((item: any) => ({
        id: item.id,
        nama_tagihan: item.namaTagihan || item.nama_tagihan
      }))
      setJenisTagihanList(mapped)
    } catch (error) {
      console.error('Error fetching jenis tagihan:', error)
      setJenisTagihanList([])
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get all tagihan grouped by santri
      const response = await api.get('/v1/keuangan/tagihan-santri')
      const santriData = response.data.data || []

      // Flatten to individual tagihan records
      let allTagihan: any[] = []
      santriData.forEach((s: any) => {
        if (s.detail_tagihan && Array.isArray(s.detail_tagihan)) {
          s.detail_tagihan.forEach((tagihan: any) => {
            allTagihan.push({
              id: tagihan.id,
              santri: {
                id: s.santri_id,
                nama: s.santri_nama,
                nis: s.santri_nis || s.nis || 'N/A',
                kelas: {
                  nama_kelas: s.kelas
                }
              },
              jenis_tagihan: {
                nama_tagihan: tagihan.jenis_tagihan
              },
              bulan: tagihan.bulan,
              tahun: tagihan.tahun,
              tahun_ajaran_id: tagihan.tahun_ajaran_id, // Capture TA ID
              nominal: parseFloat(tagihan.nominal || 0),
              dibayar: parseFloat(tagihan.dibayar || 0),
              sisa: parseFloat(tagihan.sisa || 0),
              status: tagihan.status,
              jatuh_tempo: tagihan.jatuh_tempo
            })
          })
        }
      })

      // Apply filters
      let filtered = allTagihan

      if (filterBulan && filterBulan !== 'all') {
        // Convert bulan number to month name
        const bulanNama = bulanOptions.find(b => b.value === filterBulan)?.label
        filtered = filtered.filter(t => {
          // Check both numeric and text format
          return t.bulan === filterBulan || t.bulan === bulanNama
        })
      }
      if (filterTahun) {
        filtered = filtered.filter(t => t.tahun === parseInt(filterTahun))
      }
      if (filterStatus !== 'all') {
        filtered = filtered.filter(t => t.status === filterStatus)
      }
      if (filterJenisTagihan !== 'all') {
        filtered = filtered.filter(t => t.jenis_tagihan.nama_tagihan === filterJenisTagihan)
      }
      if (filterTa !== 'all') {
        filtered = filtered.filter(t => t.tahun_ajaran_id === Number(filterTa))
      }
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter(t =>
          t.santri?.nama?.toLowerCase().includes(searchLower) ||
          t.jenis_tagihan?.nama_tagihan?.toLowerCase().includes(searchLower)
        )
      }

      setData(filtered)

      // Calculate summary
      const totalTagihan = filtered.reduce((sum: number, t: any) => sum + t.nominal, 0)
      const totalDibayar = filtered.reduce((sum: number, t: any) => sum + t.dibayar, 0)
      const totalSisa = filtered.reduce((sum: number, t: any) => sum + t.sisa, 0)
      const jumlahLunas = filtered.filter((t: any) => t.status === 'lunas').length
      const jumlahBelumLunas = filtered.filter((t: any) => t.status === 'belum_bayar').length
      const jumlahCicilan = filtered.filter((t: any) => t.status === 'sebagian').length

      setSummary({
        total_tagihan: totalTagihan,
        total_dibayar: totalDibayar,
        total_sisa: totalSisa,
        jumlah_lunas: jumlahLunas,
        jumlah_belum_lunas: jumlahBelumLunas,
        jumlah_cicilan: jumlahCicilan
      })
    } catch (error) {
      console.error('Error fetching tagihan:', error)
      setData([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      lunas: 'bg-green-100 text-green-800',
      belum_bayar: 'bg-red-100 text-red-800',
      sebagian: 'bg-yellow-100 text-yellow-800'
    }
    const labels: Record<string, string> = {
      lunas: 'Lunas',
      belum_bayar: 'Belum Bayar',
      sebagian: 'Cicilan'
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPercentage = (dibayar: number, nominal: number) => {
    if (nominal === 0) return 0
    return Math.round((dibayar / nominal) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Tagihan Santri</h1>
          <p className="text-gray-600 mt-1">Daftar tagihan santri per periode</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 font-medium"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                <select
                  value={filterTa}
                  onChange={(e) => setFilterTa(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">Semua</option>
                  {tahuns.map(t => (
                    <option key={t.id} value={t.id}>{t.nama_tahun_ajaran} ({t.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <select
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">Semua Bulan</option>
                  {bulanOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <input
                  type="number"
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Tagihan</label>
                <select
                  value={filterJenisTagihan}
                  onChange={(e) => setFilterJenisTagihan(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">Semua Jenis</option>
                  {jenisTagihanList.map(jt => (
                    <option key={jt.id} value={jt.nama_tagihan}>{jt.nama_tagihan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">Semua Status</option>
                  <option value="lunas">Lunas</option>
                  <option value="sebagian">Cicilan</option>
                  <option value="belum_bayar">Belum Bayar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Nama atau NIS..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Tagihan</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summary.total_tagihan)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Dibayar</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_dibayar)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Sisa</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_sisa)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Status</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Lunas: {summary.jumlah_lunas}</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Cicilan: {summary.jumlah_cicilan}</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Belum: {summary.jumlah_belum_lunas}</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-600 mt-2">Memuat data...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Tagihan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((tagihan) => {
                  const percentage = getPercentage(tagihan.dibayar, tagihan.nominal)
                  return (
                    <tr key={tagihan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{tagihan.santri?.nama}</div>
                        <div className="text-xs text-gray-500">NIS: {tagihan.santri?.nis}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tagihan.santri?.kelas?.nama_kelas || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tagihan.jenis_tagihan?.nama_tagihan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {bulanOptions.find(b => b.value === tagihan.bulan)?.label || tagihan.bulan} {tagihan.tahun}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        {formatCurrency(tagihan.nominal)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        {formatCurrency(tagihan.dibayar)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                        {formatCurrency(tagihan.sisa)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <div className="w-20">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-center text-gray-600 mt-1">{percentage}%</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(tagihan.status)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada data tagihan untuk periode ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
