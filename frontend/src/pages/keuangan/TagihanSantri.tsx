import { useState, useEffect } from 'react'
import { Search, Filter, Eye, DollarSign, Calendar, User, CheckCircle, XCircle, X } from 'lucide-react'
import { listTagihanSantri } from '../../api/tagihanSantri'
import toast from 'react-hot-toast'

interface DetailTagihan {
  id: number
  jenis_tagihan: string
  bulan: string
  tahun: number
  nominal: number
  status: 'belum_bayar' | 'lunas' | 'sebagian'
  dibayar: number
  sisa: number
  jatuh_tempo: string
}

interface TagihanSantri {
  santri_id: number
  santri_nama: string
  kelas: string
  total_tagihan: number
  total_dibayar: number
  sisa_tagihan: number
  detail_tagihan: DetailTagihan[]
}

export default function TagihanSantri() {
  const [dataTagihan, setDataTagihan] = useState<TagihanSantri[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<TagihanSantri | null>(null)

  // Fetch data dari API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await listTagihanSantri()
      setDataTagihan(res.data || res || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data tagihan')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = dataTagihan.filter(item => 
    item.santri_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleShowDetail = (santri: TagihanSantri) => {
    setSelectedSantri(santri)
    setShowDetailModal(true)
  }

  // Summary stats
  const totalTagihan = filteredData.reduce((sum, item) => sum + item.total_tagihan, 0)
  const totalDibayar = filteredData.reduce((sum, item) => sum + item.total_dibayar, 0)
  const totalSisa = filteredData.reduce((sum, item) => sum + item.sisa_tagihan, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tagihan Santri</h1>
        <p className="text-gray-600 mt-1">Daftar rekap tagihan per santri</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tagihan</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalTagihan.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sudah Dibayar</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalDibayar.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sisa Tagihan</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalSisa.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama santri atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tagihan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Dibayar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa Tagihan</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data tagihan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.santri_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{item.santri_nama}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.kelas}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      Rp {item.total_tagihan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      Rp {item.total_dibayar.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      Rp {item.sisa_tagihan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleShowDetail(item)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {showDetailModal && selectedSantri && (
        <ModalDetailTagihan
          santri={selectedSantri}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedSantri(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Detail Tagihan
function ModalDetailTagihan({
  santri,
  onClose
}: {
  santri: TagihanSantri
  onClose: () => void
}) {
  const getStatusBadge = (status: string) => {
    const badges = {
      lunas: 'bg-green-100 text-green-800',
      sebagian: 'bg-yellow-100 text-yellow-800',
      belum_bayar: 'bg-red-100 text-red-800'
    }
    const labels = {
      lunas: 'Lunas',
      sebagian: 'Sebagian',
      belum_bayar: 'Belum Bayar'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Tagihan Santri</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{santri.santri_nama}</span>
              </div>
              <div className="text-gray-600">•</div>
              <div className="text-gray-600">Kelas: <span className="font-medium">{santri.kelas}</span></div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Total Tagihan</p>
              <p className="text-xl font-bold text-gray-900">Rp {santri.total_tagihan.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total Dibayar</p>
              <p className="text-xl font-bold text-green-600">Rp {santri.total_dibayar.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Sisa Tagihan</p>
              <p className="text-xl font-bold text-red-600">Rp {santri.sisa_tagihan.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Table Detail */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Tagihan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {santri.detail_tagihan.map((detail, idx) => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{detail.jenis_tagihan}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {detail.bulan} {detail.tahun}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    Rp {detail.nominal.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    Rp {detail.dibayar.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    Rp {detail.sisa.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(detail.status)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{detail.jatuh_tempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
