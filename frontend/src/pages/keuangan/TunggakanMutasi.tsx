import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/index'
import { Download, Printer, AlertTriangle, Clock, Search, ArrowDownUp, CreditCard } from 'lucide-react'

interface TunggakanSantri {
  santri_id: string
  santri: {
    nama_santri: string
    nis: string
    kelas?: {
      nama_kelas: string
    }
    asrama?: {
      nama_asrama: string
    }
    status: string
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

export default function TunggakanMutasi() {
  const [data, setData] = useState<TunggakanSantri[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'nama' | 'total' | 'tertua'>('total')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  
  const [summary, setSummary] = useState({
    total_santri_tunggakan: 0,
    total_tunggakan: 0,
    total_tagihan_tertunggak: 0
  })

  useEffect(() => {
    fetchTunggakan()
  }, [])

  const fetchTunggakan = async () => {
    setLoading(true)
    try {
      // Fetch semua santri dengan perPage yang besar untuk mendapatkan semua data
      const santriResponse = await api.get('/v1/kesantrian/santri', {
        params: { perPage: 1000 }
      })
      const allSantri = santriResponse.data.data || []
      
      // Filter santri yang statusnya mutasi/keluar
      const santriMutasi = allSantri.filter((s: any) => s.status === 'mutasi' || s.status === 'keluar' || s.status === 'mutasi_keluar')
      
      // Fetch data mutasi keluar untuk mendapatkan tanggal mutasi
      const mutasiResponse = await api.get('/v1/kesantrian/mutasi-keluar')
      const mutasiData = mutasiResponse.data.data || []
      
      // Fetch semua tagihan
      const tagihanResponse = await api.get('/v1/keuangan/tagihan-santri')
      const tagihanData = tagihanResponse.data.data || []
      
      const today = new Date()
      const groupedBySantri: { [key: string]: TunggakanSantri } = {}

      // Loop through santri mutasi
      santriMutasi.forEach((santri: any) => {
        // Find tanggal mutasi
        const mutasiRecord = mutasiData.find((m: any) => m.santri_id === santri.id)
        const tanggalMutasi = mutasiRecord ? new Date(mutasiRecord.tanggal_mutasi) : today
        
        // Find tagihan for this santri
        const santriTagihan = tagihanData.find((t: any) => t.santri_id === santri.id)
        
        if (!santriTagihan || !santriTagihan.detail_tagihan) return
        
        // Filter tagihan yang belum lunas dan sudah jatuh tempo
        const tunggakan = santriTagihan.detail_tagihan.filter((t: any) => {
          const sisa = parseFloat(t.sisa || 0)
          if (sisa <= 0 || t.status === 'lunas') return false
          
          // Parse jatuh tempo - handle format yang berbeda
          let jatuhTempo: Date
          if (t.jatuh_tempo && t.jatuh_tempo !== 'Tanggal 10 setiap bulan') {
            jatuhTempo = new Date(t.jatuh_tempo)
          } else {
            // Jika jatuh tempo tidak valid, buat berdasarkan bulan/tahun + tanggal 10
            const bulanMap: any = {
              'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
              'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
              'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            }
            
            // Parse bulan dari string seperti "Juli 2025"
            const bulanParts = t.bulan?.split(' ') || []
            const bulanNama = bulanParts[0]
            const tahun = t.tahun || parseInt(bulanParts[1]) || new Date().getFullYear()
            const bulanNum = bulanMap[bulanNama] ?? 0
            
            jatuhTempo = new Date(tahun, bulanNum, 10)
          }
          
          return jatuhTempo < today
        })
        
        if (tunggakan.length === 0) return

        let totalTunggakan = 0
        let tagihanTertua = new Date().toISOString().split('T')[0] // Default ke hari ini
        
        const tagihanWithAge = tunggakan.map((t: any) => {
          // Parse jatuh tempo dengan logic yang sama
          let jatuhTempo: Date
          if (t.jatuh_tempo && t.jatuh_tempo !== 'Tanggal 10 setiap bulan') {
            jatuhTempo = new Date(t.jatuh_tempo)
          } else {
            const bulanMap: any = {
              'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
              'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
              'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
            }
            const bulanParts = t.bulan?.split(' ') || []
            const bulanNama = bulanParts[0]
            const tahun = t.tahun || parseInt(bulanParts[1]) || new Date().getFullYear()
            const bulanNum = bulanMap[bulanNama] ?? 0
            jatuhTempo = new Date(tahun, bulanNum, 10)
          }
          
          // Hitung umur tunggakan dari tanggal mutasi, bukan dari hari ini
          const umurTunggakanHari = Math.floor((tanggalMutasi.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24))
          totalTunggakan += parseFloat(t.sisa)
          
          const jatuhTempoStr = jatuhTempo.toISOString().split('T')[0]
          if (jatuhTempo < new Date(tagihanTertua)) {
            tagihanTertua = jatuhTempoStr
          }
          
          return {
            ...t,
            jatuh_tempo: jatuhTempoStr,
            umur_tunggakan_hari: umurTunggakanHari
          }
        })

        groupedBySantri[santri.id] = {
          santri_id: santri.id,
          santri: {
            nama_santri: santri.nama_santri,
            nis: santri.nis,
            kelas: santri.kelas,
            asrama: santri.asrama,
            status: santri.status
          },
          tagihan: tagihanWithAge,
          total_tunggakan: totalTunggakan,
          jumlah_tagihan: tunggakan.length,
          tagihan_tertua: tagihanTertua
        }
      })

      let result = Object.values(groupedBySantri)

      // Sort
      if (sortBy === 'total') {
        result.sort((a, b) => b.total_tunggakan - a.total_tunggakan)
      } else if (sortBy === 'tertua') {
        result.sort((a, b) => new Date(a.tagihan_tertua).getTime() - new Date(b.tagihan_tertua).getTime())
      } else {
        result.sort((a, b) => a.santri.nama_santri.localeCompare(b.santri.nama_santri))
      }

      setData(result)

      // Calculate summary
      const totalSantri = result.length
      const totalTunggakan = result.reduce((sum, item) => sum + item.total_tunggakan, 0)
      const totalTagihan = result.reduce((sum, item) => sum + item.jumlah_tagihan, 0)

      setSummary({
        total_santri_tunggakan: totalSantri,
        total_tunggakan: totalTunggakan,
        total_tagihan_tertunggak: totalTagihan
      })
    } catch (error) {
      console.error('Error fetching tunggakan:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.santri.nama_santri.toLowerCase().includes(query) ||
      item.santri.nis.toLowerCase().includes(query) ||
      item.santri.kelas?.nama_kelas?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tunggakan Santri Mutasi/Keluar</h1>
        <p className="text-gray-600 mt-1">Lihat tunggakan santri yang sudah mutasi atau keluar</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Santri</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_santri_tunggakan}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Tunggakan</p>
              <p className="text-2xl font-bold text-red-600">{formatRupiah(summary.total_tunggakan)}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Jumlah Tagihan</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_tagihan_tertunggak}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <ArrowDownUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama, NIS, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="total">Urutkan: Total Tunggakan</option>
              <option value="tertua">Urutkan: Tertua</option>
              <option value="nama">Urutkan: Nama</option>
            </select>

            {/* Export Actions */}
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-500">Memuat data...</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Santri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Tagihan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tunggakan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tagihan Tertua
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.santri_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.santri.nama_santri}</div>
                      <div className="text-xs text-gray-500">NIS: {item.santri.nis}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        {item.santri.status === 'mutasi' || item.santri.status === 'mutasi_keluar' ? 'Mutasi' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.jumlah_tagihan} tagihan
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {formatRupiah(item.total_tunggakan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(item.tagihan_tertua)}
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const tertua = item.tagihan.reduce((oldest: any, current: any) => {
                            return current.umur_tunggakan_hari > oldest.umur_tunggakan_hari ? current : oldest
                          }, item.tagihan[0])
                          return `${tertua.umur_tunggakan_hari} hari saat mutasi`
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/keuangan/pembayaran?santri_id=${item.santri_id}&nama=${encodeURIComponent(item.santri.nama_santri)}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Tunggakan</h3>
          <p className="text-gray-500">Tidak ada tunggakan dari santri yang mutasi/keluar</p>
        </div>
      )}
    </div>
  )
}
