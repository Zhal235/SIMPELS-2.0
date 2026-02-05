import { useState, useEffect } from 'react'
import { Search, Filter, Eye, DollarSign, Calendar, User, CheckCircle, XCircle, X, Plus } from 'lucide-react'
import { listTagihanSantri, createTunggakan } from '../../api/tagihanSantri'
import { listJenisTagihan } from '../../api/jenisTagihan'
import { listTahunAjaran } from '../../api/tahunAjaran'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'

// Helper function untuk format nominal sesuai standar Indonesia
const formatRupiah = (nominal: number | undefined | null): string => {
  const value = Number(nominal) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

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
  const [showTunggakanModal, setShowTunggakanModal] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<TagihanSantri | null>(null)

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await listTagihanSantri()
        const result = Array.isArray(response) ? response : (response?.data || [])
        setDataTagihan(result)
      } catch (error) {
        toast.error('Gagal memuat data tagihan')
        setDataTagihan([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredData = dataTagihan.filter(item => 
    (item.santri_nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kelas || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tagihan Santri</h1>
          <p className="text-gray-600 mt-1">Daftar rekap tagihan per santri</p>
        </div>
        {hasAccess('keuangan.tagihan.edit') && (
        <button
          onClick={() => setShowTunggakanModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Tunggakan Manual
        </button>)}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tagihan</p>
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalTagihan)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalDibayar)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatRupiah(totalSisa)}</p>
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
                      {formatRupiah(item.total_tagihan)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {formatRupiah(item.total_dibayar)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                      {formatRupiah(item.sisa_tagihan)}
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

      {/* Modal Tambah Tunggakan Manual */}
      {showTunggakanModal && (
        <ModalTambahTunggakan
          dataTagihan={dataTagihan}
          onClose={() => setShowTunggakanModal(false)}
          onSuccess={() => {
            setShowTunggakanModal(false)
            // Refresh data
            const fetchData = async () => {
              const response = await listTagihanSantri()
              const result = Array.isArray(response) ? response : (response?.data || [])
              setDataTagihan(result)
            }
            fetchData()
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
              <p className="text-xl font-bold text-gray-900">{formatRupiah(santri.total_tagihan)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total Dibayar</p>
              <p className="text-xl font-bold text-green-600">{formatRupiah(santri.total_dibayar)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Sisa Tagihan</p>
              <p className="text-xl font-bold text-red-600">{formatRupiah(santri.sisa_tagihan)}</p>
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
                    {formatRupiah(detail.nominal)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {formatRupiah(detail.dibayar)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    {formatRupiah(detail.sisa)}
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

// Modal Tambah Tunggakan Manual
function ModalTambahTunggakan({
  dataTagihan,
  onClose,
  onSuccess
}: {
  dataTagihan: TagihanSantri[]
  onClose: () => void
  onSuccess: () => void
}) {
  console.log('=== ModalTambahTunggakan Mounted ===')
  console.log('dataTagihan:', dataTagihan)
  console.log('dataTagihan[0]:', dataTagihan[0])
  
  const [jenisTagihan, setJenisTagihan] = useState<any[]>([])
  const [loadingJenis, setLoadingJenis] = useState(false)
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState<any>(null)
  const [rows, setRows] = useState<Array<{
    id: string
    santri_index: number // Index dalam dataTagihan array
    santri_id: string // UUID dari database
    santri_nama: string
    kelas: string
    jenis_tagihan_id: number
    jenis_tagihan_nama: string
    bulan: string[] // Array of selected months
    tahun: number
    nominal: number
  }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulanList = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']

  // Debug: watch rows changes
  useEffect(() => {
    console.log('=== ROWS STATE CHANGED ===')
    rows.forEach((row, idx) => {
      console.log(`Row ${idx}:`, {
        id: row.id,
        santri_id: row.santri_id,
        santri_nama: row.santri_nama,
        kelas: row.kelas,
        jenis_tagihan_id: row.jenis_tagihan_id,
        bulan: row.bulan,
        nominal: row.nominal
      })
    })
    console.log('=== END ROWS ===')
  }, [rows])

  // Fetch jenis tagihan dan tahun ajaran aktif
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingJenis(true)
        
        // Fetch jenis tagihan
        const resJenis = await listJenisTagihan()
        console.log('Jenis Tagihan Response:', resJenis) // DEBUG
        
        let data = []
        if (Array.isArray(resJenis)) {
          data = resJenis
        } else if (resJenis?.data && Array.isArray(resJenis.data)) {
          data = resJenis.data
        } else if (resJenis?.data) {
          data = [resJenis.data]
        }
        
        console.log('Jenis Tagihan Data:', data) // DEBUG
        setJenisTagihan(data)
        
        // Fetch tahun ajaran aktif
        const resTahun = await listTahunAjaran()
        const tahunData = Array.isArray(resTahun) ? resTahun : (resTahun?.data || [])
        const aktif = tahunData.find((t: any) => t.status === 'aktif')
        console.log('Tahun Ajaran Aktif:', aktif) // DEBUG
        setTahunAjaranAktif(aktif)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Gagal memuat data')
      } finally {
        setLoadingJenis(false)
      }
    }
    fetchData()
  }, [])

  // Helper: bulan yang tersedia = SEMUA bulan di tahun ajaran MINUS bulan yang sudah ada tagihannya
  const getAvailableBulan = (santri_id: string, jenistagihanId: number) => {
    if (!santri_id || !jenistagihanId || !tahunAjaranAktif) {
      console.log('Missing data:', { santri_id, jenistagihanId, tahunAjaranAktif })
      return []
    }

    // Jenis tagihan terpilih
    const jenisTerpilih = jenisTagihan.find(j => {
      const jId = j?.id || j?.ID || j?.jenis_tagihan_id
      return jId === jenistagihanId
    })
    if (!jenisTerpilih) return []

    // Nama jenis untuk membandingkan dengan detail_tagihan (detail menyimpan nama, bukan ID)
    const jenisNama = jenisTerpilih?.nama_tagihan || jenisTerpilih?.namaTagihan || ''

    // Tahun ajaran aktif
    const tahunMulai = tahunAjaranAktif.tahun_mulai || 2025
    const tahunSelesai = tahunAjaranAktif.tahun_akhir || 2026

    // SEMUA bulan dalam tahun ajaran (berurutan dari Juli ke Juni)
    const semuaBulan = [
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
    ]

    // Peta bulan -> tahun sesuai tahun ajaran
    const bulanToYear = (bulan: string) => {
      const p = {
        'Juli': tahunMulai,
        'Agustus': tahunMulai,
        'September': tahunMulai,
        'Oktober': tahunMulai,
        'November': tahunMulai,
        'Desember': tahunMulai,
        'Januari': tahunSelesai,
        'Februari': tahunSelesai,
        'Maret': tahunSelesai,
        'April': tahunSelesai,
        'Mei': tahunSelesai,
        'Juni': tahunSelesai,
      } as Record<string, number>
      return p[bulan] ?? tahunMulai
    }

    // Ambil detail tagihan santri untuk mengetahui bulan yang sudah ada bagi jenis tersebut
    const santriData = dataTagihan.find(d => String(d.santri_id) === String(santri_id))
    const existingPairs = new Set<string>()
    if (santriData && Array.isArray(santriData.detail_tagihan)) {
      santriData.detail_tagihan
        .filter(dt => dt.jenis_tagihan === jenisNama)
        .forEach(dt => {
          existingPairs.add(`${dt.bulan}-${dt.tahun}`)
        })
    }

    // Bulan yang tersedia = SEMUA bulan dalam tahun ajaran, dikonversi ke pasangan bulan-tahun, lalu eksklusi yang sudah ada
    const available = semuaBulan
      .map(b => ({ bulan: b, tahun: bulanToYear(b) }))
      .filter(pair => !existingPairs.has(`${pair.bulan}-${pair.tahun}`))

    return available
  }

  // Helper: get nominal based on tipe_nominal
  const getNominalDefault = (jenistagihanId: number, santriKelas: string) => {
    const jenisTerpilih = jenisTagihan.find(j => {
      const jId = j?.id || j?.ID || j?.jenis_tagihan_id
      return jId === jenistagihanId
    })
    
    if (!jenisTerpilih) return 0
    
    const tipeNominal = jenisTerpilih?.tipe_nominal || jenisTerpilih?.tipeNominal
    
    // Jika sama untuk semua
    if (tipeNominal === 'sama') {
      return jenisTerpilih?.nominal_sama || jenisTerpilih?.nominalSama || 0
    }
    
    // Jika per kelas
    if (tipeNominal === 'per_kelas') {
      const nominalPerKelas = jenisTerpilih?.nominal_per_kelas || jenisTerpilih?.nominalPerKelas || []
      const kelasData = nominalPerKelas.find((k: any) => k.kelas === santriKelas)
      return kelasData?.nominal || 0
    }
    
    // Jika per individu, return 0 (user harus input manual)
    return 0
  }

  const addRow = () => {
    const newRow = {
      id: Date.now().toString(),
      santri_index: -1,
      santri_id: '',
      santri_nama: '',
      kelas: '',
      jenis_tagihan_id: 0,
      jenis_tagihan_nama: '',
      bulan: [], // Empty array for multiple months
      tahun: 2025,
      nominal: 0
    }
    setRows([...rows, newRow])
  }

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id))
  }

  const updateRow = (id: string, field: string, value: any) => {
    console.log('=== updateRow START ===')
    console.log('Field being updated:', field, 'Value:', value)
    
    setRows(prevRows => {
      const newRows = prevRows.map(row => {
        if (row.id === id) {
          if (field === 'santri_index') {
            const index = parseInt(value)
            console.log('Santri index selected:', index)
            
            if (index < 0 || index >= dataTagihan.length) {
              console.error('Invalid index:', index)
              return row
            }
            
            const santri = dataTagihan[index]
            console.log('✅ Santri found by index:', santri)
            
            const updated = { 
              ...row, 
              santri_index: index,
              santri_id: String(santri.santri_id),
              santri_nama: santri.santri_nama,
              kelas: santri.kelas,
              bulan: [],
              tahun: 2025,
              nominal: 0
            }
            console.log('Updated row:', updated)
            return updated
          } else if (field === 'jenis_tagihan_id') {
            const jenis = jenisTagihan.find(j => {
              const jId = j?.id || j?.ID || j?.jenis_tagihan_id
              return jId == value // Use == instead of ===
            })
            
            if (!jenis) {
              console.error('JENIS TAGIHAN NOT FOUND for ID:', value)
              return row
            }
            
            const nominalDefault = getNominalDefault(value, row.kelas)
            const tipeNominal = jenis?.tipe_nominal || jenis?.tipeNominal
            
            console.log('Jenis found:', jenis, 'Nominal default:', nominalDefault) // DEBUG
            
            return { 
              ...row, 
              jenis_tagihan_id: Number(value),
              jenis_tagihan_nama: jenis?.nama_tagihan || jenis?.namaTagihan || '',
              // Reset bulan ketika jenis tagihan berubah
              bulan: [],
              tahun: 2025,
              // Set nominal default kecuali jika per_individu
              nominal: tipeNominal === 'per_individu' ? 0 : nominalDefault
            }
          } else if (field === 'bulan') {
            // Toggle bulan in array
            const currentBulan = Array.isArray(row.bulan) ? row.bulan : []
            const bulanValue = value as string
            
            let newBulan: string[]
            if (currentBulan.includes(bulanValue)) {
              // Remove if already selected
              newBulan = currentBulan.filter(b => b !== bulanValue)
            } else {
              // Add if not selected
              newBulan = [...currentBulan, bulanValue]
            }
            
            console.log('Bulan toggled:', bulanValue, 'New selection:', newBulan)
            
            return {
              ...row,
              bulan: newBulan
            }
          }
          return { ...row, [field]: value }
        }
        return row
      })
      
      console.log('New rows state:', newRows) // DEBUG
      return newRows
    })
  }

  const handleSubmit = async () => {
    // Validasi
    if (rows.length === 0) {
      toast.error('Tambahkan minimal satu tagihan')
      return
    }

    // Validasi lebih detail
    const invalidRows = rows.filter(row => 
      !row.santri_id || 
      row.santri_id === '' ||
      !row.jenis_tagihan_id || 
      row.jenis_tagihan_id === 0 ||
      !Array.isArray(row.bulan) ||
      row.bulan.length === 0 ||
      !row.nominal ||
      row.nominal === 0
    )
    
    if (invalidRows.length > 0) {
      console.error('Invalid rows:', invalidRows)
      toast.error('Harap isi semua field dengan lengkap dan pilih minimal 1 bulan')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Expand rows with multiple months into individual payloads
      const payload: any[] = []
      rows.forEach(row => {
        row.bulan.forEach(bulan => {
          // Note: santri_id is UUID (string) — do NOT cast to Number
          payload.push({
            santri_id: String(row.santri_id),
            jenis_tagihan_id: Number(row.jenis_tagihan_id),
            bulan: bulan,
            nominal: Number(row.nominal)
          })
        })
      })
      
      const res = await createTunggakan(payload)
      toast.success(res.message || `${payload.length} tunggakan berhasil ditambahkan`)
      onSuccess()
    } catch (error: any) {
      console.error('Error submit:', error)
      console.error('Error response:', error.response?.data)
      // Show validation details if available
      const errData = error.response?.data
      if (errData?.errors) {
        const messages: string[] = []
        Object.entries(errData.errors).forEach(([field, msgs]: any) => {
          const arr = Array.isArray(msgs) ? msgs : [msgs]
          messages.push(`${field}: ${arr.join(', ')}`)
        })
        toast.error(errData.message + '\n' + messages.join('\n'))
      } else {
        toast.error(errData?.message || 'Gagal menyimpan tunggakan')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Tambah Tunggakan Manual</h2>
          <p className="text-sm text-gray-600 mt-1">Input tunggakan tagihan dari bulan-bulan sebelumnya</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada data. Klik "Tambah Row" untuk menambahkan tunggakan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left border">No</th>
                      <th className="px-3 py-2 text-left border">Nama Santri</th>
                      <th className="px-3 py-2 text-left border">Jenis Tagihan</th>
                      <th className="px-3 py-2 text-left border">Bulan</th>
                      <th className="px-3 py-2 text-right border">Nominal</th>
                      <th className="px-3 py-2 text-center border w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      console.log(`Row ${idx}:`, row) // DEBUG
                      return (
                      <tr key={`${row.id}-${row.santri_id}`} className="border-b">
                        <td className="px-3 py-2 border text-center">{idx + 1}</td>
                        <td className="px-3 py-2 border">
                          <div className="space-y-1">
                            <select
                              value={row.santri_index}
                              onChange={(e) => {
                                const index = parseInt(e.target.value, 10)
                                console.log('onChange - Santri index selected:', index)
                                if (!isNaN(index) && index >= 0) {
                                  updateRow(row.id, 'santri_index', index)
                                }
                              }}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value={-1}>-- Pilih Santri --</option>
                              {dataTagihan.map((s, index) => (
                                <option key={index} value={index}>
                                  {s.santri_nama} ({s.kelas})
                                </option>
                              ))}
                            </select>
                            {row.santri_id && row.santri_nama && (
                              <div className="text-xs text-green-600 font-medium">✓ {row.santri_nama} - {row.kelas}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border">
                          <select
                            value={row.jenis_tagihan_id}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val)) {
                                console.log('Jenis Tagihan selected:', val)
                                updateRow(row.id, 'jenis_tagihan_id', val)
                              }
                            }}
                            className="w-full px-2 py-1 border rounded text-sm"
                            disabled={loadingJenis || jenisTagihan.length === 0}
                          >
                            <option value={0}>-- Pilih Jenis --</option>
                            {jenisTagihan.length > 0 ? (
                              jenisTagihan.map(j => {
                                const jId = j?.id || j?.ID || j?.jenis_tagihan_id
                                const jNama = j?.nama_tagihan || j?.namaTagihan || j?.name || 'Unknown'
                                return (
                                  <option key={jId} value={jId}>
                                    {jNama}
                                  </option>
                                )
                              })
                            ) : (
                              <option disabled>Loading...</option>
                            )}
                          </select>
                        </td>
                        <td className="px-3 py-2 border">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-700">Pilih Bulan (bisa lebih dari 1):</div>
                            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                              {!row.santri_id || !row.jenis_tagihan_id ? (
                                <div className="text-xs text-gray-500 italic">Pilih santri dan jenis tagihan terlebih dahulu</div>
                              ) : (
                                <div className="grid grid-cols-2 gap-1">
                                  {getAvailableBulan(row.santri_id, row.jenis_tagihan_id).map(b => {
                                    const isSelected = Array.isArray(row.bulan) && row.bulan.includes(b.bulan)
                                    return (
                                      <label
                                        key={`${b.bulan}-${b.tahun}`}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                                          isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'
                                        } border`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => updateRow(row.id, 'bulan', b.bulan)}
                                          className="w-3 h-3"
                                        />
                                        <span>{b.bulan} {b.tahun}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                            {Array.isArray(row.bulan) && row.bulan.length > 0 && (
                              <div className="text-xs text-green-600 font-medium">
                                ✓ {row.bulan.length} bulan dipilih: {row.bulan.join(', ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            type="number"
                            value={row.nominal}
                            onChange={(e) => updateRow(row.id, 'nominal', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-sm text-right"
                            placeholder="0"
                            disabled={(() => {
                              const jenis = jenisTagihan.find(j => {
                                const jId = j?.id || j?.ID || j?.jenis_tagihan_id
                                return jId === row.jenis_tagihan_id
                              })
                              const tipeNominal = jenis?.tipe_nominal || jenis?.tipeNominal
                              return tipeNominal !== 'per_individu'
                            })()}
                          />
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Tambah Row
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rows.length === 0}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
