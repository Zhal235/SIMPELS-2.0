import { useState, useEffect } from 'react'
import { Search, User, Home, Building2, Phone, Users, CheckCircle, XCircle, X, Printer } from 'lucide-react'
import { listSantri } from '../../api/santri'
import { getTagihanBySantri, prosesPembayaran, listPembayaran } from '../../api/pembayaran'
import { useAuthStore } from '../../stores/useAuthStore'
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

// Types
type OrangTua = {
  nama_ayah?: string
  hp_ayah?: string
  nama_ibu?: string
  hp_ibu?: string
}

type Santri = {
  id: number
  nama_santri: string
  nis?: string
  nisn?: string
  foto?: string
  alamat?: string
  kelas?: string
  asrama?: string
  nama_ayah?: string
  hp_ayah?: string
  nama_ibu?: string
  hp_ibu?: string
  orang_tua?: OrangTua
  // Add other fields as needed from your API
}

type Tagihan = {
  id: number
  bulan: string
  tahun: number
  nominal: number
  dibayar: number
  sisa: number
  status: 'belum_bayar' | 'sebagian' | 'lunas'
  jatuh_tempo: string
  jenis_tagihan: {
    id: number
    nama_tagihan: string
    kategori: 'Rutin' | 'Non Rutin'
    buku_kas_id: number
  }
  // UI helper fields
  jumlahBayar?: number
  tipe?: 'rutin' | 'non-rutin'
  jenisTagihan?: string
  sisaBayar?: number
  tglBayar?: string
  adminPenerima?: string
  tglJatuhTempo?: string
}

export default function PembayaranSantri() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [loadingSantri, setLoadingSantri] = useState(false)
  const [activeTab, setActiveTab] = useState<'rutin' | 'non-rutin' | 'tunggakan' | 'lunas'>('rutin')
  const [selectedTagihan, setSelectedTagihan] = useState<number[]>([])
  const [showModalLunas, setShowModalLunas] = useState(false)
  const [showModalSebagian, setShowModalSebagian] = useState(false)
  const [tagihan, setTagihan] = useState<Tagihan[]>([])
  const [kwitansiData, setKwitansiData] = useState<any>(null)
  const [showKwitansi, setShowKwitansi] = useState(false)
  
  // Get current user from auth store
  const user = useAuthStore((state) => state.user)

  // Initialize tagihan
  // Fetch santri from API
  useEffect(() => {
    const fetchSantri = async () => {
      try {
        setLoadingSantri(true)
        const res = await listSantri(1, 100) // Fetch 100 santri untuk search
        let santriData = Array.isArray(res) ? res : (res?.data ? res.data : [])
        setSantriList(santriData)
      } catch (error) {
        console.error('Error fetching santri:', error)
        toast.error('Gagal memuat data santri')
      } finally {
        setLoadingSantri(false)
      }
    }
    fetchSantri()
  }, [])

  // Filter santri berdasarkan search query
  const getFilteredSantri = () => {
    if (searchQuery.length < 2) return []
    
    const query = searchQuery.toLowerCase()
    return santriList.filter(s => 
      (s.nama_santri && s.nama_santri.toLowerCase().includes(query)) ||
      (s.nis && s.nis.toLowerCase().includes(query)) ||
      (s.nisn && s.nisn.toLowerCase().includes(query))
    )
  }

  const getFotoUrl = (santri: Santri) => {
    if (santri.foto) {
      // Check if foto is a URL or file path
      if (santri.foto.startsWith('http')) {
        return santri.foto
      }
      // Construct URL from API if it's a file path
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${santri.foto}`
    }
    // Fallback to avatar
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${santri.nama_santri}`
  }

  // Helper untuk mendapatkan nama orang tua
  const getNamaOrtuString = (santri: Santri) => {
    const ayah = santri.orang_tua?.nama_ayah || santri.nama_ayah || ''
    const ibu = santri.orang_tua?.nama_ibu || santri.nama_ibu || ''
    
    if (ayah && ibu) return `${ayah} / ${ibu}`
    if (ayah) return ayah
    if (ibu) return ibu
    return 'N/A'
  }

  // Helper untuk mendapatkan nomor HP
  const getNoHpString = (santri: Santri) => {
    const hpAyah = santri.orang_tua?.hp_ayah || santri.hp_ayah || ''
    const hpIbu = santri.orang_tua?.hp_ibu || santri.hp_ibu || ''
    
    if (hpAyah && hpIbu) return `${hpAyah} / ${hpIbu}`
    if (hpAyah) return hpAyah
    if (hpIbu) return hpIbu
    return 'N/A'
  }

  const handleSelectSantri = async (santri: Santri) => {
    setSelectedSantri(santri)
    setSearchQuery(santri.nama_santri)
    setShowSearchResults(false)
    setSelectedTagihan([])
    
    // Fetch tagihan dari backend (semua tagihan termasuk lunas)
    try {
      // Fetch tagihan belum lunas
      const resTagihanBelum = await getTagihanBySantri(santri.id)
      const tagihanBelumLunas = resTagihanBelum.data || []
      
      // Fetch riwayat pembayaran untuk tagihan yang sudah lunas
      const resPembayaran = await listPembayaran({ santri_id: santri.id })
      const pembayaranData = resPembayaran.data || []
      
      // Transform tagihan belum lunas
      const transformedBelumLunas = tagihanBelumLunas.map((t: any) => ({
        id: t.id,
        bulan: t.bulan,
        tahun: String(t.tahun),
        jenisTagihan: t.jenis_tagihan.nama_tagihan,
        nominal: Number(t.sisa) || 0,
        jumlahBayar: t.dibayar,
        tipe: t.jenis_tagihan.kategori.toLowerCase().replace(' ', '-'),
        status: t.status === 'belum_bayar' ? 'belum' : t.status,
        sisaBayar: Number(t.sisa) || 0,
        tglJatuhTempo: t.jatuh_tempo,
        buku_kas_id: t.jenis_tagihan.buku_kas_id
      }))
      
      // Transform tagihan yang sudah lunas dari pembayaran
      const transformedLunas = pembayaranData
        .filter((p: any) => p.tagihan_santri.status === 'lunas')
        .map((p: any) => ({
          id: p.tagihan_santri.id,
          bulan: p.tagihan_santri.bulan,
          tahun: String(p.tagihan_santri.tahun),
          jenisTagihan: p.tagihan_santri.jenis_tagihan.nama_tagihan,
          nominal: Number(p.tagihan_santri.nominal) || 0,
          jumlahBayar: p.tagihan_santri.dibayar,
          tipe: p.tagihan_santri.jenis_tagihan.kategori.toLowerCase().replace(' ', '-'),
          status: 'lunas',
          sisaBayar: 0,
          tglJatuhTempo: p.tagihan_santri.jatuh_tempo,
          tglBayar: p.tanggal_bayar,
          adminPenerima: 'Admin',
          buku_kas_id: p.tagihan_santri.jenis_tagihan.buku_kas_id
        }))
      
      // Gabungkan dan hilangkan duplikat
      const allTagihan = [...transformedBelumLunas, ...transformedLunas]
      const uniqueTagihan = Array.from(new Map(allTagihan.map(t => [t.id, t])).values())
      
      setTagihan(uniqueTagihan)
    } catch (error) {
      console.error('Error fetching tagihan:', error)
      toast.error('Gagal memuat data tagihan')
      setTagihan([])
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedSantri(null)
    setShowSearchResults(false)
    setSelectedTagihan([])
  }

  const toggleTagihan = (id: number | string) => {
    const idStr = String(id)
    setSelectedTagihan(prev =>
      prev.includes(idStr as any) ? prev.filter(t => String(t) !== idStr) : [...prev, idStr as any]
    )
  }

  // Helper untuk deteksi apakah tagihan sudah lewat jatuh tempo
  const isOverdue = (tglJatuhTempo?: string, bulan?: string, tahun?: string | number): boolean => {
    if (!tglJatuhTempo || !bulan || !tahun) return false
    
    try {
      // Parse hari dari jatuh tempo
      // Format: "Tanggal 10 setiap bulan" -> extract 10
      const dayMatch = tglJatuhTempo.match(/\d+/)
      if (!dayMatch) return false
      
      const day = parseInt(dayMatch[0])
      
      // Convert bulan dari nama ke angka (1-12)
      const bulanMap: { [key: string]: number } = {
        'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
        'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
        'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
      }
      
      let bulanAngka = parseInt(bulan)
      if (isNaN(bulanAngka)) {
        // Jika bulan adalah string nama bulan, convert ke angka
        bulanAngka = bulanMap[bulan] || 1
      }
      
      const year = parseInt(String(tahun))
      
      // Buat tanggal jatuh tempo: Tanggal X Bulan Y Tahun Z
      const dueDate = new Date(year, bulanAngka - 1, day) // month adalah 0-indexed
      dueDate.setHours(0, 0, 0, 0)
      
      // Bandingkan dengan hari ini
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return today > dueDate
    } catch (error) {
      console.error('Error parsing jatuh tempo:', { tglJatuhTempo, bulan, tahun }, error)
      return false
    }
  }

  const getTotalSelected = () => {
    return tagihan
      .filter(t => {
        const tIdStr = String(t.id)
        // Exact match only - no partial matching
        return selectedTagihan.includes(tIdStr)
      })
      .reduce((sum, t) => {
        const nominal = Number(t.nominal) || 0
        return sum + nominal
      }, 0)
  }

  const getFilteredTagihan = () => {
    if (activeTab === 'rutin') {
      // Tagihan rutin yang belum bayar/sebagian dan belum lewat jatuh tempo
      return tagihan.filter(t => 
        t.tipe === 'rutin' && 
        (t.status === 'belum' || t.status === 'sebagian') && 
        !isOverdue(t.tglJatuhTempo, t.bulan, t.tahun)
      )
    }
    if (activeTab === 'non-rutin') {
      // Tagihan non-rutin yang belum bayar/sebagian dan belum lewat jatuh tempo
      return tagihan.filter(t => 
        t.tipe === 'non-rutin' && 
        (t.status === 'belum' || t.status === 'sebagian') && 
        !isOverdue(t.tglJatuhTempo, t.bulan, t.tahun)
      )
    }
    if (activeTab === 'tunggakan') {
      // Tunggakan: tagihan yang SUDAH lewat jatuh tempo (baik belum bayar maupun sebagian)
      return tagihan.filter(t => 
        t.status !== 'lunas' && isOverdue(t.tglJatuhTempo, t.bulan, t.tahun)
      )
    }
    if (activeTab === 'lunas') {
      // Tagihan yang sudah lunas atau sudah ada pembayaran (sebagian/lunas)
      return tagihan.filter(t => t.status === 'lunas' || t.status === 'sebagian')
    }
    return []
  }

  // Group tagihan by bulan and tahun
  const getGroupedTagihan = () => {
    const filtered = getFilteredTagihan()
    const grouped: { [key: string]: Tagihan[] } = {}
    
    filtered.forEach(t => {
      const key = `${t.bulan}-${t.tahun}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(t)
    })
    
    return Object.entries(grouped).map(([key, items]) => {
      const [bulan, tahun] = key.split('-')
      return { bulan, tahun, items }
    })
  }

  const updateTagihanStatus = (ids: (number | string)[], newStatus: 'belum' | 'sebagian' | 'lunas', tglBayar?: string, paymentDetails?: { [key: string]: number }) => {
    const today = new Date().toLocaleDateString('id-ID')
    const adminName = user?.name || 'Admin System'
    const idStrings = ids.map(id => String(id))
    
    setTagihan(prev => {
      let updated = [...prev]
      
      idStrings.forEach(idStr => {
        const index = updated.findIndex(t => String(t.id) === idStr)
        if (index !== -1) {
          const tagihan = updated[index]
          
          if (newStatus === 'sebagian' && paymentDetails && paymentDetails[idStr]) {
            // Split tagihan: yang dibayar dan sisanya
            const jumlahBayar = paymentDetails[idStr]
            const sisaBayar = tagihan.nominal - jumlahBayar
            
            // Tagihan yang dibayar (status: lunas)
            const paidTagihan: Tagihan = {
              ...tagihan,
              nominal: jumlahBayar,
              jumlahBayar: jumlahBayar,
              status: 'lunas',
              sisaBayar: undefined,
              tglBayar: tglBayar || today,
              adminPenerima: adminName,
              originalId: tagihan.id as any,
              id: `${tagihan.id}-paid-${Date.now()}` as any, // Unique ID untuk tagihan yang dibayar
            }
            
            // Tagihan sisa (status: sebagian)
            const remainingTagihan: Tagihan = {
              ...tagihan,
              nominal: sisaBayar,
              jumlahBayar: 0,
              status: 'sebagian',
              sisaBayar: sisaBayar,
              tglBayar: undefined,
              adminPenerima: undefined,
              originalId: tagihan.id as any,
              id: `${tagihan.id}-remaining-${Date.now()}` as any, // Unique ID untuk sisa tagihan
            }
            
            // Remove original, add paid dan remaining
            updated.splice(index, 1, remainingTagihan, paidTagihan)
          } else if (newStatus === 'lunas') {
            // Bayar lunas: ubah status langsung
            updated[index] = {
              ...tagihan,
              status: 'lunas',
              jumlahBayar: tagihan.nominal,
              tglBayar: tglBayar || today,
              adminPenerima: adminName,
              sisaBayar: undefined,
            }
          }
        }
      })
      
      return updated
    })
  }

  return (
    <div className="p-6">
      {/* Header dengan Search */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran Santri</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran santri</p>
        </div>
        
        <div className="w-96">
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama santri atau NIS..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(e.target.value.length >= 2)
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && getFilteredSantri().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {getFilteredSantri().map((santri) => (
                  <button
                    key={santri.id}
                    onClick={() => handleSelectSantri(santri)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3"
                  >
                    <img
                      src={getFotoUrl(santri)}
                      alt={santri.nama_santri}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{santri.nama_santri}</p>
                      <p className="text-xs text-gray-500">NIS: {santri.nis} • {santri.kelas || 'N/A'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {showSearchResults && searchQuery.length >= 2 && getFilteredSantri().length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center">
                <p className="text-gray-500 text-sm">Santri tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSantri ? (
        <>
          {/* Data Santri */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Foto */}
              <img
                src={getFotoUrl(selectedSantri)}
                alt={selectedSantri.nama_santri}
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
              />
              
              {/* Info Santri */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Nama Santri</p>
                      <p className="font-semibold text-gray-900">{selectedSantri.nama_santri}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Kelas</p>
                      <p className="font-semibold text-gray-900">{selectedSantri.kelas || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Asrama</p>
                      <p className="font-semibold text-gray-900">{selectedSantri.asrama || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Nama Orang Tua</p>
                      <p className="font-semibold text-gray-900 text-sm">{getNamaOrtuString(selectedSantri)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">No. HP</p>
                      <p className="font-semibold text-gray-900 text-sm">{getNoHpString(selectedSantri)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedSantri.alamat || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Pembayaran - Muncul saat ada tagihan dipilih */}
          {selectedTagihan.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total yang Dipilih ({selectedTagihan.length} tagihan)</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatRupiah(getTotalSelected())}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModalSebagian(true)}
                    className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    Bayar Sebagian
                  </button>
                  <button
                    onClick={() => setShowModalLunas(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Bayar Lunas
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { key: 'rutin', label: 'Tagihan Rutin' },
                  { key: 'non-rutin', label: 'Tagihan Non Rutin' },
                  { key: 'tunggakan', label: 'Tunggakan' },
                  { key: 'lunas', label: 'Sudah Dibayar' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Tagihan */}
            <div className="p-6">
              {getFilteredTagihan().length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <CheckCircle className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-gray-500">Tidak ada tagihan di tab ini</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getGroupedTagihan().map((group) => (
                    <div key={`${group.bulan}-${group.tahun}`} className={`border rounded-lg overflow-hidden flex flex-col ${
                      group.items.some(item => isOverdue(item.tglJatuhTempo, item.bulan, item.tahun) && item.status !== 'lunas') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-200'
                    }`}>
                      {/* Card Header - Bulan & Tahun */}
                      <div className={`px-4 py-3 border-b ${
                        group.items.some(item => isOverdue(item.tglJatuhTempo, item.bulan, item.tahun) && item.status !== 'lunas')
                          ? 'bg-gradient-to-r from-red-100 to-red-50 border-red-200'
                          : 'bg-gradient-to-r from-blue-50 to-blue-100 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-gray-900">
                            {group.bulan} {group.tahun}
                          </h3>
                          {group.items.some(item => isOverdue(item.tglJatuhTempo, item.bulan, item.tahun) && item.status !== 'lunas') && (
                            <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded">⚠ Overdue</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Card Body - List Tagihan */}
                      <div className="divide-y flex-1 overflow-y-auto max-h-64">
                        {group.items.map((tagihanItem) => (
                          <div key={tagihanItem.id} className="p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              {/* Checkbox & Info */}
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                {activeTab !== 'lunas' && (
                                  <input
                                    type="checkbox"
                                    checked={selectedTagihan.includes(String(tagihanItem.id))}
                                    onChange={() => toggleTagihan(tagihanItem.id)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{tagihanItem.jenisTagihan}</p>
                                    {isOverdue(tagihanItem.tglJatuhTempo, tagihanItem.bulan, tagihanItem.tahun) && tagihanItem.status !== 'lunas' && (
                                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded whitespace-nowrap">Overdue</span>
                                    )}
                                  </div>
                                  {tagihanItem.tglJatuhTempo && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Jatuh Tempo: {tagihanItem.tglJatuhTempo}
                                    </p>
                                  )}
                                  {tagihanItem.tglBayar && (
                                    <div className="text-xs text-green-600 mt-1">
                                      <p>✓ {tagihanItem.tglBayar}</p>
                                      <p className="text-gray-600 text-xs mt-0.5">{tagihanItem.adminPenerima}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Nominal & Actions */}
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-gray-900 text-sm">
                                  {activeTab === 'lunas' ? formatRupiah(tagihanItem.jumlahBayar) : formatRupiah(tagihanItem.nominal)}
                                </p>
                                {tagihanItem.status === 'sebagian' && tagihanItem.sisaBayar && tagihanItem.sisaBayar > 0 && activeTab !== 'lunas' && (
                                  <p className="text-xs text-yellow-600 mt-1">
                                    Sisa: {formatRupiah(tagihanItem.sisaBayar)}
                                  </p>
                                )}
                                {tagihanItem.status === 'sebagian' && tagihanItem.sisaBayar && tagihanItem.sisaBayar > 0 && activeTab === 'lunas' && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Sisa: {formatRupiah(tagihanItem.sisaBayar)}
                                  </p>
                                )}
                                {activeTab === 'lunas' && tagihanItem.tglBayar && (
                                  <button
                                    onClick={() => {
                                      setKwitansiData({
                                        type: 'lunas',
                                        santri: selectedSantri,
                                        tagihan: [tagihanItem],
                                        totalBayar: tagihanItem.jumlahBayar || tagihanItem.nominal,
                                        nominalBayar: tagihanItem.jumlahBayar || tagihanItem.nominal,
                                        admin: tagihanItem.adminPenerima,
                                        tanggal: tagihanItem.tglBayar,
                                        jam: '-'
                                      })
                                      setShowKwitansi(true)
                                    }}
                                    className="mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 justify-end"
                                  >
                                    <Printer className="w-3 h-3" />
                                    Print
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Card Footer - Subtotal */}
                      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 mt-auto">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-700 text-xs">Total:</p>
                          <p className="font-bold text-base text-blue-600">
                            Rp {(group.items.reduce((sum, t) => sum + t.nominal, 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Bayar Lunas */}
          {showModalLunas && <ModalBayarLunas />}
          
          {/* Modal Bayar Sebagian */}
          {showModalSebagian && <ModalBayarSebagian />}

          {/* Modal Kwitansi */}
          {showKwitansi && kwitansiData && <ModalKwitansi />}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cari Santri</h3>
          <p className="text-gray-500">
            Gunakan kolom pencarian di atas untuk mencari data santri
          </p>
        </div>
      )}
    </div>
  )

  // Modal Bayar Lunas Component
  function ModalBayarLunas() {
    const [nominalBayar, setNominalBayar] = useState('')
    const [metodeBayar, setMetodeBayar] = useState<'cash' | 'transfer'>('cash')
    const [opsiKembalian, setOpsiKembalian] = useState<'tunai' | 'dompet'>('tunai')
    
    const totalTagihan = getTotalSelected()
    const kembalian = Math.max(0, Number(nominalBayar) - totalTagihan)
    const tagihanTerpilih = tagihan.filter(t => {
      const tIdStr = String(t.id)
      return selectedTagihan.includes(tIdStr)
    })

    const handleKonfirmasi = async () => {
      try {
        // Proses pembayaran untuk setiap tagihan terpilih
        for (const t of tagihanTerpilih) {
          await prosesPembayaran({
            tagihan_santri_id: t.id,
            nominal_bayar: t.nominal,
            metode_pembayaran: metodeBayar,
            tanggal_bayar: new Date().toISOString().split('T')[0],
            keterangan: `Pembayaran ${t.jenisTagihan} - ${t.bulan} ${t.tahun} (${selectedSantri?.nama_santri})`
          })
        }
        
        toast.success('Pembayaran berhasil!')
        
        // Set data kwitansi dan tampilkan
        setKwitansiData({
          type: 'lunas',
          santri: selectedSantri,
          tagihan: tagihanTerpilih,
          totalTagihan: totalTagihan,
          totalBayar: totalTagihan,
          nominalBayar: Number(nominalBayar),
          kembalian: kembalian,
          metodeBayar: metodeBayar
        })
        
        setShowKwitansi(true)
        setShowModalLunas(false)
        setSelectedTagihan([])
        setNominalBayar('')
        
        // Reload tagihan
        if (selectedSantri) {
          handleSelectSantri(selectedSantri)
        }
      } catch (error: any) {
        console.error('Error:', error)
        toast.error(error.response?.data?.message || 'Gagal memproses pembayaran')
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowModalLunas(false)} />
        <div className="relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Bayar Lunas</h2>
          </div>
          
          <div className="p-6">
            {/* Daftar Tagihan */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Tagihan yang akan dibayar:</p>
              <div className="space-y-2">
                {tagihanTerpilih.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{t.jenisTagihan}</p>
                      <p className="text-xs text-gray-500">{t.bulan} {t.tahun}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatRupiah(t.nominal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-700">Total Tagihan:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatRupiah(totalTagihan)}
                </p>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodeBayar('cash')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    metodeBayar === 'cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setMetodeBayar('transfer')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    metodeBayar === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💳 Transfer
                </button>
              </div>
            </div>

            {/* Input Nominal Bayar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Uang yang Dibayarkan
              </label>
              <input
                type="text"
                value={nominalBayar}
                onChange={(e) => setNominalBayar(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan nominal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {nominalBayar && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatRupiah(Number(nominalBayar))}
                </p>
              )}
            </div>

            {/* Kembalian */}
            {kembalian > 0 && (
              <div className="mb-6">
                <div className="p-4 bg-green-50 rounded-lg mb-3">
                  <p className="text-sm text-gray-700 mb-1">Kembalian:</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatRupiah(kembalian)}
                  </p>
                </div>
                
                <p className="text-sm font-medium text-gray-700 mb-2">Opsi Kembalian:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpsiKembalian('tunai')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      opsiKembalian === 'tunai'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Kembalian Tunai
                  </button>
                  <button
                    onClick={() => setOpsiKembalian('dompet')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      opsiKembalian === 'dompet'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Masukkan ke Dompet Santri
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex gap-3 justify-end">
            <button
              onClick={() => setShowModalLunas(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleKonfirmasi}
              disabled={!nominalBayar || Number(nominalBayar) < totalTagihan}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Konfirmasi Pembayaran
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Modal Bayar Sebagian Component
  function ModalBayarSebagian() {
    const [nominalBayar, setNominalBayar] = useState('')
    const [metodeBayar, setMetodeBayar] = useState<'cash' | 'transfer'>('cash')
    const [distribusiOtomatis, setDistribusiOtomatis] = useState(true)
    
    const totalTagihan = getTotalSelected()
    const tagihanTerpilih = tagihan.filter(t => {
      const tIdStr = String(t.id)
      return selectedTagihan.includes(tIdStr)
    })

    // Rekomendasi pembayaran otomatis
    const getRekomendasi = () => {
      const nominal = Number(nominalBayar)
      if (!nominal) return []
      
      let sisa = nominal
      return tagihanTerpilih.map((t) => {
        const bayar = Math.min(sisa, t.nominal)
        sisa -= bayar
        return { ...t, bayar, sisaTagihan: t.nominal - bayar }
      })
    }

    const handleKonfirmasi = async () => {
      try {
        const nominal = Number(nominalBayar)
        const rekomendasi = getRekomendasi()
        let totalBayar = 0
        
        // Jika hanya 1 tagihan, langsung bayar
        if (tagihanTerpilih.length === 1) {
          await prosesPembayaran({
            tagihan_santri_id: tagihanTerpilih[0].id,
            nominal_bayar: nominal,
            metode_pembayaran: metodeBayar,
            tanggal_bayar: new Date().toISOString().split('T')[0],
            keterangan: `Pembayaran sebagian ${tagihanTerpilih[0].jenisTagihan} - ${tagihanTerpilih[0].bulan} ${tagihanTerpilih[0].tahun}`
          })
          totalBayar = nominal
        } else {
          // Multiple tagihan: distribusi otomatis
          let sisa = nominal
          for (const t of tagihanTerpilih) {
            const bayar = Math.min(sisa, t.nominal)
            if (bayar > 0) {
              await prosesPembayaran({
                tagihan_santri_id: t.id,
                nominal_bayar: bayar,
                metode_pembayaran: metodeBayar,
                tanggal_bayar: new Date().toISOString().split('T')[0],
                keterangan: `Pembayaran sebagian ${t.jenisTagihan} - ${t.bulan} ${t.tahun} (${selectedSantri?.nama_santri})`
              })
              sisa -= bayar
              totalBayar += bayar
            }
          }
        }
        
        toast.success('Pembayaran sebagian berhasil!')
        
        // Set data kwitansi dan tampilkan
        const paymentDetails: { [key: string]: number } = {}
        rekomendasi.forEach((item: any) => {
          paymentDetails[String(item.id)] = item.bayar
        })
        
        setKwitansiData({
          type: 'sebagian',
          santri: selectedSantri,
          tagihan: rekomendasi,
          totalTagihan: totalTagihan,
          totalBayar: totalBayar,
          nominalBayar: nominal,
          paymentDetails: paymentDetails,
          metodeBayar: metodeBayar
        })
        
        setShowKwitansi(true)
        setShowModalSebagian(false)
        setSelectedTagihan([])
        setNominalBayar('')
        
        // Reload tagihan
        if (selectedSantri) {
          handleSelectSantri(selectedSantri)
        }
      } catch (error: any) {
        console.error('Error:', error)
        toast.error(error.response?.data?.message || 'Gagal memproses pembayaran')
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowModalSebagian(false)} />
        <div className="relative z-10 bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Bayar Sebagian</h2>
          </div>
          
          <div className="p-6">
            {/* Total Tagihan */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-700">Total Tagihan Dipilih:</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(totalTagihan)}
                </p>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMetodeBayar('cash')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    metodeBayar === 'cash'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setMetodeBayar('transfer')}
                  className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    metodeBayar === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💳 Transfer
                </button>
              </div>
            </div>

            {/* Input Nominal Bayar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Uang yang Dibayarkan
              </label>
              <input
                type="text"
                value={nominalBayar}
                onChange={(e) => setNominalBayar(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan nominal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {nominalBayar && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatRupiah(Number(nominalBayar))}
                </p>
              )}
            </div>

            {/* Rekomendasi Pembayaran */}
            {nominalBayar && Number(nominalBayar) > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Rekomendasi Pembayaran:</p>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={distribusiOtomatis}
                      onChange={(e) => setDistribusiOtomatis(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Distribusi Otomatis
                  </label>
                </div>
                
                <div className="space-y-2">
                  {getRekomendasi().map((item) => (
                    <div key={item.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.jenisTagihan}</p>
                          <p className="text-xs text-gray-500">{item.bulan} {item.tahun}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Total: {formatRupiah(item.nominal)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                        <p className="text-sm font-medium text-green-600">
                          Dibayar: {formatRupiah(item.bayar)}
                        </p>
                        {item.sisaTagihan > 0 && (
                          <p className="text-sm font-medium text-orange-600">
                            Sisa: {formatRupiah(item.sisaTagihan)}
                          </p>
                        )}
                        {item.sisaTagihan === 0 && (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Lunas
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex gap-3 justify-end">
            <button
              onClick={() => setShowModalSebagian(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleKonfirmasi}
              disabled={!nominalBayar || Number(nominalBayar) <= 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Konfirmasi Pembayaran
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Modal Kwitansi Component
  function ModalKwitansi() {
    const kwitansiNumber = Math.random().toString(36).substr(2, 9).toUpperCase()
    const statusLabel = kwitansiData.type === 'lunas' ? 'LUNAS' : 'BAYAR SEBAGIAN'
    const totalSisa = kwitansiData.type === 'sebagian' 
      ? kwitansiData.tagihan.reduce((sum: number, t: any) => {
          const dibayar = kwitansiData.paymentDetails[String(t.id)] || 0
          return sum + (t.nominal - dibayar)
        }, 0)
      : 0

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowKwitansi(false)} />
        {/* Modal dengan ukuran A4 standard */}
        <div className="relative z-10 bg-white rounded-lg shadow-lg" style={{ width: '210mm', maxHeight: '90vh', overflow: 'auto' }}>
          {/* Kwitansi Content - A4 Portrait (Half Height) */}
          <div id="kwitansi" className="relative" style={{ width: '210mm', height: '150mm', display: 'flex', flexDirection: 'column', padding: '8mm', boxSizing: 'border-box', overflow: 'hidden' }}>
            {/* Header */}
            <div className="text-center mb-2 pb-2 border-b border-gray-800">
              <h1 className="text-xl font-bold tracking-wider">KWITANSI PEMBAYARAN</h1>
              <p className="text-gray-700 text-xs mt-0.5">Bukti Pembayaran Tagihan</p>
            </div>

            {/* Top Section: Data Santri + Nomor Kwitansi */}
            <div className="flex gap-3 mb-1.5 text-xs">
              {/* Left: Data Santri */}
              <div className="flex-1">
                <div className="font-bold mb-0.5 text-xs underline">DATA SANTRI</div>
                <p className="mb-0.5"><span className="font-semibold">Nama</span> : {kwitansiData.santri?.nama_santri}</p>
                <p className="mb-0.5"><span className="font-semibold">NIS</span> : {kwitansiData.santri?.nis}</p>
                <p><span className="font-semibold">Kelas</span> : {kwitansiData.santri?.kelas}</p>
              </div>
              
              {/* Right: Nomor Kwitansi */}
              <div className="flex-1 text-right text-xs">
                <p className="mb-0.5"><span className="font-semibold">Nomor</span></p>
                <p className="mb-0.5"><span className="font-semibold">Kwitansi</span> : {kwitansiNumber}</p>
                <p className="mb-0.5"><span className="font-semibold">Tanggal</span> : {kwitansiData.tanggal}</p>
                <p><span className="font-semibold">Jam</span> : {kwitansiData.jam}</p>
              </div>
            </div>

            {/* Detail Tagihan Section */}
            <div className="mb-1.5">
              <div className="font-bold mb-0.5 text-xs underline">DETAIL PEMBAYARAN</div>
              <table className="w-full text-xs border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 px-6 py-3 text-left font-bold">Jenis Tagihan</th>
                    <th className="border border-gray-800 px-6 py-3 text-left font-bold">Bulan</th>
                    <th className="border border-gray-800 px-6 py-3 text-right font-bold">Nominal</th>
                    {kwitansiData.type === 'sebagian' && (
                      <>
                        <th className="border border-gray-800 px-6 py-3 text-right font-bold">Dibayar</th>
                        <th className="border border-gray-800 px-6 py-3 text-right font-bold">Sisa</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {kwitansiData.tagihan.map((t: any, idx: number) => {
                    const dibayar = kwitansiData.type === 'sebagian' ? (kwitansiData.paymentDetails[String(t.id)] || 0) : t.nominal
                    const sisa = t.nominal - dibayar
                    return (
                      <tr key={idx}>
                        <td className="border border-gray-800 px-6 py-3">{t.jenisTagihan}</td>
                        <td className="border border-gray-800 px-6 py-3">{t.bulan} {t.tahun}</td>
                        <td className="border border-gray-800 px-6 py-3 text-right">{formatRupiah(t.nominal)}</td>
                        {kwitansiData.type === 'sebagian' && (
                          <>
                            <td className="border border-gray-800 px-6 py-3 text-right">{formatRupiah(dibayar)}</td>
                            <td className="border border-gray-800 px-6 py-3 text-right font-semibold">{formatRupiah(sisa)}</td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Ringkasan Pembayaran */}
            <div className="mb-1 bg-gray-100 p-3 border border-gray-800 text-xs">
              <div className="flex justify-between mb-0.5 px-2">
                <span className="font-semibold">Total Tagihan:</span>
                <span>{formatRupiah(kwitansiData.totalTagihan || kwitansiData.totalBayar)}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="font-semibold">Nominal Bayar:</span>
                <span>{formatRupiah(kwitansiData.nominalBayar)}</span>
              </div>
              {kwitansiData.kembalian && kwitansiData.kembalian > 0 && (
                <>
                  <div className="flex justify-between border-t pt-0.5 mt-0.5 px-2">
                    <span className="font-semibold">Kembalian:</span>
                    <span>{formatRupiah(kwitansiData.kembalian)}</span>
                  </div>
                  <div className="flex justify-between pt-0.5 px-2">
                    <span className="font-semibold">Opsi:</span>
                    <span className="text-xs">
                      {kwitansiData.opsiKembalian === 'dompet' 
                        ? '✓ Masukkan ke Dompet Santri' 
                        : '✓ Kembalian Tunai'}
                    </span>
                  </div>
                </>
              )}
              {kwitansiData.type === 'sebagian' && totalSisa > 0 && (
                <div className="flex justify-between border-t pt-0.5 mt-0.5 px-2">
                  <span className="font-semibold">Sisa Tagihan:</span>
                  <span className="font-bold text-blue-600">{formatRupiah(totalSisa)}</span>
                </div>
              )}
            </div>

            {/* Signature Section - Tanda Tangan Penerima */}
            <div className="flex-1 flex items-end">
              <div className="w-full text-center">
                <div className="border-b border-gray-800" style={{ height: '35px', marginBottom: '4px' }}></div>
                <p className="text-xs font-semibold">{kwitansiData.admin}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600 mt-1">
              <p>Terima kasih telah melakukan pembayaran</p>
              <p>Harap simpan kwitansi ini sebagai bukti pembayaran</p>
            </div>

            {/* Print Styles */}
            <style>{`
              @media print {
                * {
                  margin: 0;
                  padding: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                #kwitansi {
                  width: 210mm !important;
                  height: 150mm !important;
                  margin: 0 !important;
                  padding: 8mm !important;
                  page-break-after: always;
                  display: flex !important;
                  flex-direction: column !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
          </div>

          {/* Action Buttons - Hidden on Print */}
          <div className="no-print p-6 border-t flex gap-3 justify-end bg-gray-50">
            <button
              onClick={() => setShowKwitansi(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                const kwitansiElement = document.getElementById('kwitansi')
                if (kwitansiElement) {
                  const printWindow = window.open('', '', 'height=400,width=800')
                  
                  // Get all stylesheets
                  const styles = Array.from(document.styleSheets)
                    .map(sheet => {
                      try {
                        return Array.from(sheet.cssRules)
                          .map(rule => rule.cssText)
                          .join('\n')
                      } catch (e) {
                        return ''
                      }
                    })
                    .join('\n')
                  
                  // Clone element untuk copy styles
                  const clonedElement = kwitansiElement.cloneNode(true) as HTMLElement
                  
                  printWindow?.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Kwitansi Pembayaran</title>
                      <style>
                        @page { 
                          size: 210mm 150mm portrait;
                          margin: 8mm 10mm;
                        }
                        @media print {
                          html, body {
                            width: 210mm;
                            height: 150mm;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                          }
                          #kwitansi {
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            page-break-after: avoid;
                            display: flex;
                            flex-direction: column;
                          }
                        }
                        html, body { 
                          margin: 0; 
                          padding: 0;
                          width: 210mm;
                          height: 150mm;
                          font-family: system-ui, -apple-system, sans-serif;
                        }
                        * { 
                          margin: 0; 
                          padding: 0;
                          box-sizing: border-box;
                        }
                        /* Force table cell padding */
                        table th,
                        table td {
                          padding: 8px 16px !important;
                        }
                        /* Force summary section padding */
                        .bg-gray-100 {
                          padding: 12px !important;
                        }
                        .bg-gray-100 > div {
                          padding-left: 8px !important;
                          padding-right: 8px !important;
                        }
                        /* Tailwind Core Styles */
                        ${styles}
                      </style>
                    </head>
                    <body>
                      ${kwitansiElement.innerHTML}
                    </body>
                    </html>
                  `)
                  printWindow?.document.close()
                  
                  // Wait for content to load before printing
                  if (printWindow) {
                    printWindow.onload = function() {
                      setTimeout(() => {
                        printWindow.print()
                        printWindow.close()
                      }, 250)
                    }
                  }
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Printer className="w-4 h-4" />
              Print Kwitansi
            </button>
          </div>
        </div>
      </div>
    )
  }
}

