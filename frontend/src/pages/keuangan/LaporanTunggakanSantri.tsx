import { useState, useEffect } from 'react'
import api from '../../api/index'
import { Download, Printer, AlertTriangle, Clock } from 'lucide-react'

interface TunggakanSantri {
  santri_id: number
  santri: {
    nama: string
    nis: string
    kelas_id?: number
    kelas?: {
      id?: number
      nama_kelas: string
    }
    asrama?: {
      nama_asrama: string
    }
  }
  tagihan: Array<{
    id: number
    jenis_tagihan: {
      nama_tagihan: string
    }
    bulan: string
    tahun: number
    nominal: number
    sisa: number
    jatuh_tempo: string
    umur_tunggakan_hari: number
  }>
  total_tunggakan: number
  jumlah_tagihan: number
  tagihan_tertua: string
}

export default function LaporanTunggakanSantri() {
  const [data, setData] = useState<TunggakanSantri[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'nama' | 'total' | 'tertua'>('total')
  const [filterKelas, setFilterKelas] = useState<string>('all')
  
  const [kelasList, setKelasList] = useState<Array<{id: number, nama_kelas: string}>>([])
  const [summary, setSummary] = useState({
    total_santri_tunggakan: 0,
    total_tunggakan: 0,
    total_tagihan_tertunggak: 0
  })

  useEffect(() => {
    fetchKelas()
    fetchTunggakan()
  }, [])

  const fetchKelas = async () => {
    try {
      const response = await api.get('/v1/kesantrian/kelas')
      setKelasList(response.data.data || [])
    } catch (error) {
      console.error('Error fetching kelas:', error)
    }
  }

  const fetchTunggakan = async () => {
    setLoading(true)
    try {
      // Fetch semua tagihan grouped by santri
      const response = await api.get('/v1/keuangan/tagihan-santri')
      const santriData = response.data.data || []
      
      // Flatten to individual tagihan
      let tagihan: any[] = []
      santriData.forEach((s: any) => {
        if (s.detail_tagihan && Array.isArray(s.detail_tagihan)) {
          s.detail_tagihan.forEach((t: any) => {
            tagihan.push({
              ...t,
              santri_id: s.santri_id,
              santri: {
                nama: s.santri_nama,
                nis: s.santri_id.toString(),
                kelas: {
                  nama_kelas: s.kelas,
                  id: null
                }
              }
            })
          })
        }
      })

      const today = new Date()

      // Filter hanya tagihan yang sudah jatuh tempo dan belum lunas
      tagihan = tagihan.filter((t: any) => {
        if (!t.jatuh_tempo) return false
        const jatuhTempo = new Date(t.jatuh_tempo)
        const sisa = parseFloat(t.sisa || 0)
        return jatuhTempo < today && sisa > 0 && t.status !== 'lunas'
      })

      // Group by santri
      const groupedBySantri: { [key: number]: TunggakanSantri } = {}

      tagihan.forEach((t: any) => {
        const santriId = t.santri_id
        const jatuhTempo = new Date(t.jatuh_tempo)
        const umurTunggakanHari = Math.floor((today.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24))

        if (!groupedBySantri[santriId]) {
          groupedBySantri[santriId] = {
            santri_id: santriId,
            santri: t.santri,
            tagihan: [],
            total_tunggakan: 0,
            jumlah_tagihan: 0,
            tagihan_tertua: t.jatuh_tempo
          }
        }

        groupedBySantri[santriId].tagihan.push({
          ...t,
          umur_tunggakan_hari: umurTunggakanHari
        })
        groupedBySantri[santriId].total_tunggakan += parseFloat(t.sisa)
        groupedBySantri[santriId].jumlah_tagihan += 1

        // Track tagihan tertua
        if (new Date(t.jatuh_tempo) < new Date(groupedBySantri[santriId].tagihan_tertua)) {
          groupedBySantri[santriId].tagihan_tertua = t.jatuh_tempo
        }
      })

      let result = Object.values(groupedBySantri)

      // Filter by kelas if selected
      if (filterKelas !== 'all') {
        result = result.filter(r => {
          const kelasId = r.santri?.kelas?.id || r.santri?.kelas_id
          return kelasId === parseInt(filterKelas)
        })
      }

      // Sort
      if (sortBy === 'total') {
        result.sort((a, b) => b.total_tunggakan - a.total_tunggakan)
      } else if (sortBy === 'tertua') {
        result.sort((a, b) => new Date(a.tagihan_tertua).getTime() - new Date(b.tagihan_tertua).getTime())
      } else {
        result.sort((a, b) => a.santri.nama.localeCompare(b.santri.nama))
      }

      setData(result)

      // Calculate summary
      setSummary({
        total_santri_tunggakan: result.length,
        total_tunggakan: result.reduce((sum, r) => sum + r.total_tunggakan, 0),
        total_tagihan_tertunggak: result.reduce((sum, r) => sum + r.jumlah_tagihan, 0)
      })
    } catch (error) {
      console.error('Error fetching tunggakan:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTunggakan()
  }, [sortBy, filterKelas])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const bulanOptions = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const getBulanName = (bulan: string) => {
    const idx = parseInt(bulan) - 1
    return bulanOptions[idx] || bulan
  }

  const getUmurTunggakanLabel = (hari: number) => {
    if (hari < 30) return `${hari} hari`
    if (hari < 365) return `${Math.floor(hari / 30)} bulan`
    return `${Math.floor(hari / 365)} tahun ${Math.floor((hari % 365) / 30)} bulan`
  }

  const getPrioritas = (hari: number) => {
    if (hari > 90) return { label: 'Sangat Mendesak', color: 'bg-red-100 text-red-800' }
    if (hari > 60) return { label: 'Mendesak', color: 'bg-orange-100 text-orange-800' }
    if (hari > 30) return { label: 'Perlu Perhatian', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Baru', color: 'bg-blue-100 text-blue-800' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Laporan Tunggakan Santri
          </h1>
          <p className="text-gray-600 mt-1">Daftar santri dengan tagihan yang sudah jatuh tempo</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border-2 border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Santri Menunggak</p>
              <p className="text-2xl font-bold text-red-600">{summary.total_santri_tunggakan}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tagihan Tertunggak</p>
              <p className="text-2xl font-bold text-orange-600">{summary.total_tagihan_tertunggak}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Nominal Tunggakan</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.total_tunggakan)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Semua Kelas</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Urutkan Berdasarkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="total">Total Tunggakan (Tertinggi)</option>
              <option value="tertua">Tunggakan Tertua</option>
              <option value="nama">Nama Santri (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jumlah Tagihan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tunggakan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tagihan Tertua</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((tunggakan, index) => {
                  const tagihanTertua = tunggakan.tagihan.reduce((oldest, current) => 
                    new Date(current.jatuh_tempo) < new Date(oldest.jatuh_tempo) ? current : oldest
                  )
                  const prioritas = getPrioritas(tagihanTertua.umur_tunggakan_hari)

                  return (
                    <tr key={tunggakan.santri_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{tunggakan.santri?.nama}</div>
                        <div className="text-xs text-gray-500">NIS: {tunggakan.santri?.nis}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tunggakan.santri?.kelas?.nama_kelas || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {tunggakan.jumlah_tagihan} tagihan
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(tunggakan.total_tunggakan)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getBulanName(tagihanTertua.bulan)} {tagihanTertua.tahun}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getUmurTunggakanLabel(tagihanTertua.umur_tunggakan_hari)} yang lalu
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${prioritas.color}`}>
                          {prioritas.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">Tidak ada tunggakan! Semua santri sudah bayar tepat waktu 🎉</p>
          </div>
        )}
      </div>
    </div>
  )
}
