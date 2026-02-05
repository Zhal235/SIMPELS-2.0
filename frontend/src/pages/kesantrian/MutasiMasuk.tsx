import { useState, useEffect } from 'react'
import { Plus, ArrowRight, ArrowLeft, Check, User, MapPin, DollarSign, FileCheck, X, Eye, Trash2 } from 'lucide-react'
import { createSantri, listSantri, deleteSantri } from '../../api/santri'
import { listKelas } from '../../api/kelas'
import { listAsrama } from '../../api/asrama'
import { listJenisTagihan } from '../../api/jenisTagihan'
import { createTunggakan } from '../../api/tagihanSantri'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'

// Types
interface OrangTua {
  no_kk?: string
  nama_ayah: string
  nik_ayah?: string
  pendidikan_ayah?: string
  pekerjaan_ayah?: string
  hp_ayah?: string
  nama_ibu: string
  nik_ibu?: string
  pendidikan_ibu?: string
  pekerjaan_ibu?: string
  hp_ibu?: string
}

interface FormDataStep1 {
  nis: string
  nisn?: string
  nik_santri?: string
  nama_santri: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: 'L' | 'P'
  asal_sekolah: string
  hobi?: string
  cita_cita?: string
  jumlah_saudara?: number
  alamat: string
  provinsi?: string
  kabupaten?: string
  kecamatan?: string
  desa?: string
  kode_pos?: string
  foto?: string | Blob
  status: 'aktif'
  orang_tua: OrangTua
}

interface FormDataStep2 {
  kelas_id: string
  asrama_id: string
}

interface SelectedTagihan {
  jenis_tagihan_id: number
  nama_tagihan: string
  nominal: number
  jatuh_tempo: string
  is_custom_nominal?: boolean
  kelas_id?: number // Untuk tagihan dengan tipe nominal per kelas
  tipe_nominal?: string // Untuk track apakah bisa diedit
}

export default function MutasiMasuk() {
  const [showWizard, setShowWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Data list santri mutasi masuk
  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  
  // Step 1: Data Pribadi
  const [formStep1, setFormStep1] = useState<FormDataStep1>({
    nis: '',
    nisn: '',
    nik_santri: '',
    nama_santri: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    asal_sekolah: '',
    hobi: '',
    cita_cita: '',
    jumlah_saudara: undefined,
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    kode_pos: '',
    foto: undefined,
    status: 'aktif',
    orang_tua: {
      no_kk: '',
      nama_ayah: '',
      nik_ayah: '',
      pendidikan_ayah: '',
      pekerjaan_ayah: '',
      hp_ayah: '',
      nama_ibu: '',
      nik_ibu: '',
      pendidikan_ibu: '',
      pekerjaan_ibu: '',
      hp_ibu: ''
    }
  })

  // Step 2: Penempatan
  const [formStep2, setFormStep2] = useState<FormDataStep2>({
    kelas_id: '',
    asrama_id: ''
  })

  // Step 3: Tagihan
  const [selectedTagihan, setSelectedTagihan] = useState<SelectedTagihan[]>([])
  
  // Modal pilih kelas untuk tagihan beda per kelas
  const [showKelasModal, setShowKelasModal] = useState(false)
  const [pendingTagihan, setPendingTagihan] = useState<any>(null)

  // Data master
  const [kelasList, setKelasList] = useState<any[]>([])
  const [asramaList, setAsramaList] = useState<any[]>([])
  const [jenisTagihanList, setJenisTagihanList] = useState<any[]>([])

  useEffect(() => {
    loadMasterData()
    fetchSantriMutasiMasuk()
  }, [])

  const fetchSantriMutasiMasuk = async () => {
    try {
      setLoadingList(true)
      const res = await listSantri(1, 100)
      const raw: any = res
      
      let allSantri = []
      if (raw?.data?.data) {
        allSantri = raw.data.data
      } else if (raw?.data) {
        allSantri = Array.isArray(raw.data) ? raw.data : []
      } else {
        allSantri = Array.isArray(raw) ? raw : []
      }
      
      // Filter: santri dengan jenis_penerimaan = 'mutasi_masuk'
      const santriMutasi = allSantri.filter((s: any) => {
        return s.jenis_penerimaan === 'mutasi_masuk'
      })
      
      // Urutkan berdasarkan created_at terbaru
      santriMutasi.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      
      setSantriList(santriMutasi)
    } catch (error) {
      console.error('Error fetching santri:', error)
      toast.error('Gagal memuat data santri mutasi masuk')
    } finally {
      setLoadingList(false)
    }
  }

  const loadMasterData = async () => {
    try {
      const [kelasRes, asramaRes, tagihanRes] = await Promise.all([
        listKelas(),
        listAsrama(),
        listJenisTagihan()
      ])
      
      // Handle berbagai format response
      let kelasData = []
      let asramaData = []
      let tagihanData = []
      
      // Parse Kelas
      if (Array.isArray(kelasRes)) {
        kelasData = kelasRes
      } else if (kelasRes?.data) {
        kelasData = Array.isArray(kelasRes.data) ? kelasRes.data : (kelasRes.data.data || [])
      }
      
      // Parse Asrama
      if (Array.isArray(asramaRes)) {
        asramaData = asramaRes
      } else if (asramaRes?.data) {
        asramaData = Array.isArray(asramaRes.data) ? asramaRes.data : (asramaRes.data.data || [])
      }
      
      // Parse Jenis Tagihan
      if (Array.isArray(tagihanRes)) {
        tagihanData = tagihanRes
      } else if (tagihanRes?.data) {
        tagihanData = Array.isArray(tagihanRes.data) ? tagihanRes.data : (tagihanRes.data.data || [])
      }
      
      setKelasList(kelasData)
      setAsramaList(asramaData)
      setJenisTagihanList(tagihanData)
      
      console.log('Loaded - Kelas:', kelasData.length, 'Asrama:', asramaData.length, 'Tagihan:', tagihanData.length)
    } catch (error) {
      console.error('Error loading master data:', error)
      toast.error('Gagal memuat data master')
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validasi Step 1
      if (!formStep1.nama_santri || !formStep1.tempat_lahir || !formStep1.tanggal_lahir || !formStep1.nis) {
        toast.error('Mohon lengkapi data pribadi yang wajib diisi')
        return
      }
      if (!formStep1.orang_tua.nama_ayah || !formStep1.orang_tua.nama_ibu) {
        toast.error('Nama ayah dan ibu wajib diisi')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Validasi Step 2
      if (!formStep2.kelas_id || !formStep2.asrama_id) {
        toast.error('Mohon pilih kelas dan asrama')
        return
      }
      // Langsung ke step 3, tidak simpan data dulu
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // Validasi Step 3
      if (selectedTagihan.length === 0) {
        toast.error('Mohon pilih minimal 1 tagihan')
        return
      }
      setCurrentStep(4)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // 1. Simpan data santri dulu
      const formData = new FormData()
      
      // Data santri
      formData.append('nis', formStep1.nis)
      if (formStep1.nisn) formData.append('nisn', formStep1.nisn)
      if (formStep1.nik_santri) formData.append('nik_santri', formStep1.nik_santri)
      formData.append('nama_santri', formStep1.nama_santri)
      formData.append('tempat_lahir', formStep1.tempat_lahir)
      formData.append('tanggal_lahir', formStep1.tanggal_lahir)
      formData.append('jenis_kelamin', formStep1.jenis_kelamin)
      formData.append('alamat', formStep1.alamat)
      formData.append('asal_sekolah', formStep1.asal_sekolah)
      formData.append('status', 'aktif')
      formData.append('jenis_penerimaan', 'mutasi_masuk') // Tandai sebagai mutasi masuk
      
      // Data opsional santri
      if (formStep1.hobi) formData.append('hobi', formStep1.hobi)
      if (formStep1.cita_cita) formData.append('cita_cita', formStep1.cita_cita)
      if (formStep1.jumlah_saudara) formData.append('jumlah_saudara', String(formStep1.jumlah_saudara))
      if (formStep1.desa) formData.append('desa', formStep1.desa)
      if (formStep1.kecamatan) formData.append('kecamatan', formStep1.kecamatan)
      if (formStep1.kabupaten) formData.append('kabupaten', formStep1.kabupaten)
      if (formStep1.provinsi) formData.append('provinsi', formStep1.provinsi)
      if (formStep1.kode_pos) formData.append('kode_pos', formStep1.kode_pos)
      
      // Penempatan
      formData.append('kelas_id', String(formStep2.kelas_id))
      formData.append('asrama_id', String(formStep2.asrama_id))
      
      // Data orang tua
      if (formStep1.orang_tua.no_kk) formData.append('no_kk', formStep1.orang_tua.no_kk)
      formData.append('nama_ayah', formStep1.orang_tua.nama_ayah)
      if (formStep1.orang_tua.nik_ayah) formData.append('nik_ayah', formStep1.orang_tua.nik_ayah)
      if (formStep1.orang_tua.pendidikan_ayah) formData.append('pendidikan_ayah', formStep1.orang_tua.pendidikan_ayah)
      if (formStep1.orang_tua.pekerjaan_ayah) formData.append('pekerjaan_ayah', formStep1.orang_tua.pekerjaan_ayah)
      if (formStep1.orang_tua.hp_ayah) formData.append('hp_ayah', formStep1.orang_tua.hp_ayah)
      formData.append('nama_ibu', formStep1.orang_tua.nama_ibu)
      if (formStep1.orang_tua.nik_ibu) formData.append('nik_ibu', formStep1.orang_tua.nik_ibu)
      if (formStep1.orang_tua.pendidikan_ibu) formData.append('pendidikan_ibu', formStep1.orang_tua.pendidikan_ibu)
      if (formStep1.orang_tua.pekerjaan_ibu) formData.append('pekerjaan_ibu', formStep1.orang_tua.pekerjaan_ibu)
      if (formStep1.orang_tua.hp_ibu) formData.append('hp_ibu', formStep1.orang_tua.hp_ibu)
      
      console.log('Menyimpan data santri...')
      const santriResponse = await createSantri(formData)
      const newSantriId = (
        (santriResponse && (santriResponse as any).data && (santriResponse as any).data.id) ||
        (santriResponse && (santriResponse as any).id) ||
        (santriResponse && (santriResponse as any).santri && (santriResponse as any).santri.id)
      )
      if (!newSantriId) {
        throw new Error('Gagal menyimpan data santri')
      }
      console.log('Santri berhasil disimpan dengan ID:', newSantriId)
      
      // 2. Buat tagihan sebagai tunggakan (endpoint tersedia di backend)
      console.log('Membuat tagihan (tunggakan)...')
      const tunggakan = selectedTagihan.map((tagihan: any) => ({
        santri_id: newSantriId,
        jenis_tagihan_id: tagihan.jenis_tagihan_id,
        bulan: getBulanNamaFromDate(tagihan.jatuh_tempo),
        nominal: Number(tagihan.nominal) || 0,
      }))
      if (tunggakan.length > 0) {
        await createTunggakan(tunggakan)
      }
      
      toast.success('Mutasi masuk berhasil! Santri telah terdaftar dengan tagihan lengkap.')
      
      // Reset form
      resetForm()
      setCurrentStep(1)
      setShowWizard(false)
      
      // Refresh list
      fetchSantriMutasiMasuk()
      
    } catch (error: any) {
      console.error('Error:', error)
      console.error('Error response:', error.response?.data)
      
      const errorData = error.response?.data
      const errorMessage = errorData?.message || error?.message || 'Gagal menyimpan data'
      const errors = errorData?.errors
      
      if (errors) {
        // Tampilkan error validasi dengan detail
        const errorMessages = Object.entries(errors).map(([field, messages]: [string, any]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages]
          return `• ${field}: ${msgArray.join(', ')}`
        }).join('\n')
        
        console.error('Validation errors:', errorMessages)
        
        // Toast dengan pesan yang lebih user-friendly
        if (errors.nis && Array.isArray(errors.nis)) {
          const nisError = errors.nis[0]
          if (nisError.includes('already') || nisError.includes('sudah ada') || nisError.includes('unique')) {
            toast.error('NIS sudah terdaftar! Silakan gunakan NIS yang berbeda.')
            return
          }
        }
        
        toast.error(`${errorMessage}\n\n${errorMessages}`, { duration: 5000 })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormStep1({
      nis: '',
      nisn: '',
      nik_santri: '',
      nama_santri: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: 'L',
      asal_sekolah: '',
      hobi: '',
      cita_cita: '',
      jumlah_saudara: undefined,
      alamat: '',
      provinsi: '',
      kabupaten: '',
      kecamatan: '',
      desa: '',
      kode_pos: '',
      foto: undefined,
      status: 'aktif',
      orang_tua: {
        no_kk: '',
        nama_ayah: '',
        nik_ayah: '',
        pendidikan_ayah: '',
        pekerjaan_ayah: '',
        hp_ayah: '',
        nama_ibu: '',
        nik_ibu: '',
        pendidikan_ibu: '',
        pekerjaan_ibu: '',
        hp_ibu: ''
      }
    })
    setFormStep2({ kelas_id: '', asrama_id: '' })
    setSelectedTagihan([])
  }

  const addTagihan = (jenisTagihan: any) => {
    // Cek apakah sudah ada
    if (selectedTagihan.find(t => t.jenis_tagihan_id === jenisTagihan.id)) {
      toast.error('Tagihan sudah ditambahkan')
      return
    }

    // Tentukan nominal berdasarkan tipe_nominal
    let nominal = 0
    let needsKelasSelection = false
    
    if (jenisTagihan.tipeNominal === 'sama' || jenisTagihan.tipe_nominal === 'sama') {
      // Ambil dari nominal_sama
      nominal = jenisTagihan.nominalSama || jenisTagihan.nominal_sama || 0
    } else if (
      jenisTagihan.tipeNominal === 'beda_perkelas' ||
      jenisTagihan.tipe_nominal === 'beda_perkelas' ||
      jenisTagihan.tipeNominal === 'per_kelas' ||
      jenisTagihan.tipe_nominal === 'per_kelas'
    ) {
      // Akan dipilih oleh user di modal
      needsKelasSelection = true
      nominal = 0 // Will be set after kelas selection
    } else if (jenisTagihan.tipeNominal === 'per_individu' || jenisTagihan.tipe_nominal === 'per_individu') {
      // Bisa custom, default 0
      nominal = 0
    }

    // Hitung jatuh tempo berdasarkan tipe
    let jatuhTempo = toLocalDateStr(new Date())
    
    if (jenisTagihan.kategori === 'Rutin' && jenisTagihan.bulan) {
      const bulanRaw = jenisTagihan.bulan
      let bulanList: string[] = []
      if (Array.isArray(bulanRaw)) {
        bulanList = bulanRaw as string[]
      } else if (typeof bulanRaw === 'string') {
        try {
          const parsed = JSON.parse(bulanRaw)
          bulanList = Array.isArray(parsed) ? parsed : bulanRaw.split(',').map((b: string) => b.trim())
        } catch {
          bulanList = bulanRaw.split(',').map((b: string) => b.trim())
        }
      }

      const monthMap: Record<string, number> = {
        'Januari': 0,
        'Februari': 1,
        'Maret': 2,
        'April': 3,
        'Mei': 4,
        'Juni': 5,
        'Juli': 6,
        'Agustus': 7,
        'September': 8,
        'Oktober': 9,
        'November': 10,
        'Desember': 11
      }

      const today = new Date()
      const defaultDay = (() => {
        const namaUpper = (jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || '').toString().toUpperCase()
        if (namaUpper === 'BERAS' || namaUpper === 'BMP') return 10
        const jt = jenisTagihan.jatuhTempo || jenisTagihan.jatuh_tempo || ''
        const match = String(jt).match(/(\d{1,2})/)
        const d = match ? Number(match[1]) : 10
        return Math.min(Math.max(d, 1), 28)
      })()

      let foundDate: Date | null = null
      for (let i = 0; i < 24; i++) {
        const checkDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
        const monthIndex = checkDate.getMonth()
        const monthName = Object.keys(monthMap).find(k => monthMap[k] === monthIndex)
        if (!monthName) continue
        if (bulanList.includes(monthName)) {
          const candidate = new Date(checkDate.getFullYear(), monthIndex, defaultDay)
          if (candidate >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            foundDate = candidate
            break
          }
        }
      }

      if (foundDate) {
        jatuhTempo = toLocalDateStr(foundDate)
      }
    }

    // Non Rutin: gunakan jatuhTempo yang ditetapkan saat pembuatan jenis tagihan jika ada
    if (jenisTagihan.kategori === 'Non Rutin') {
      const jt = jenisTagihan.jatuhTempo || jenisTagihan.jatuh_tempo
      if (jt) {
        jatuhTempo = jt
      }
    }

    // Jika perlu pilih kelas, khusus BERAS jangan tampilkan modal
    if (needsKelasSelection) {
      const namaUpper = (jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || '').toString().toUpperCase()
      const isBeras = namaUpper === 'BERAS'
      if (!isBeras) {
        // Tampilkan modal untuk pilih nominal per kelas
        setPendingTagihan({
          jenis_tagihan: jenisTagihan,
          jatuh_tempo: jatuhTempo
        })
        setShowKelasModal(true)
        return
      }
      // BERAS: langsung tambahkan dengan nominal 0, bisa diedit di Tagihan Terpilih
      const newTagihanBeras: SelectedTagihan = {
        jenis_tagihan_id: jenisTagihan.id,
        nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
        nominal: 0,
        jatuh_tempo: jatuhTempo,
        is_custom_nominal: false,
        tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
      }
      setSelectedTagihan([...selectedTagihan, newTagihanBeras])
      toast.success('Tagihan BERAS ditambahkan')
      return
    }

    const newTagihan: SelectedTagihan = {
      jenis_tagihan_id: jenisTagihan.id,
      nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
      nominal: nominal,
      jatuh_tempo: jatuhTempo,
      is_custom_nominal: false,
      tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
    }

    setSelectedTagihan([...selectedTagihan, newTagihan])
    
    console.log('Tagihan ditambahkan:', {
      nama: newTagihan.nama_tagihan,
      tipe_nominal: newTagihan.tipe_nominal,
      nominal: newTagihan.nominal
    })
    
    toast.success(`Tagihan ditambahkan${jenisTagihan.kategori === 'Rutin' ? ` (Jatuh tempo: ${jatuhTempo})` : ''}`)
  }

  const removeTagihan = (jenisTagihanId: number) => {
    setSelectedTagihan(selectedTagihan.filter(t => t.jenis_tagihan_id !== jenisTagihanId))
  }

  const updateTagihanJatuhTempo = (jenisTagihanId: number, jatuhTempo: string) => {
    setSelectedTagihan(selectedTagihan.map(t => 
      t.jenis_tagihan_id === jenisTagihanId ? { ...t, jatuh_tempo: jatuhTempo } : t
    ))
  }

  const updateTagihanNominal = (jenisTagihanId: number, nominal: number) => {
    setSelectedTagihan(selectedTagihan.map(t => 
      t.jenis_tagihan_id === jenisTagihanId ? { ...t, nominal, is_custom_nominal: true } : t
    ))
  }

  const handlePilihNominalKelas = (kelasId: number) => {
    if (!pendingTagihan) return
    
    const jenisTagihan = pendingTagihan.jenis_tagihan
    
    // Cari nominal untuk kelas yang dipilih
    const nominalPerkelas = jenisTagihan.nominalPerkelas || jenisTagihan.nominal_perkelas || []
    const selectedKelasNominal = nominalPerkelas.find((n: any) => n.kelas_id === kelasId || n.kelasId === kelasId)
    
    const nominal = selectedKelasNominal?.nominal || 0
    
    const newTagihan: SelectedTagihan = {
      jenis_tagihan_id: jenisTagihan.id,
      nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan',
      nominal: nominal,
      jatuh_tempo: pendingTagihan.jatuh_tempo,
      is_custom_nominal: false,
      kelas_id: kelasId,
      tipe_nominal: jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
    }

    setSelectedTagihan([...selectedTagihan, newTagihan])
    toast.success('Tagihan ditambahkan')
    
    // Close modal
    setShowKelasModal(false)
    setPendingTagihan(null)
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus santri "${nama}"?`)) return
    
    try {
      await deleteSantri(id)
      toast.success('Santri berhasil dihapus')
      fetchSantriMutasiMasuk()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Gagal menghapus santri')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="p-6">
      {!showWizard ? (
        /* List Mode */
        <>
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mutasi Masuk</h1>
              <p className="text-gray-600 mt-1">Daftar santri yang masuk melalui mutasi dari sekolah/pesantren lain</p>
            </div>
            {hasAccess('kesantrian.mutasi.masuk') && (
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Tambah Mutasi Masuk
            </button>)}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asal Sekolah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Lahir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingList ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : santriList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Belum ada data santri mutasi masuk
                      </td>
                    </tr>
                  ) : (
                    santriList.map((santri, idx) => (
                      <tr key={santri.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{idx + 1}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{santri.nama_santri}</td>
                        <td className="px-6 py-4 text-gray-600">{santri.nis}</td>
                        <td className="px-6 py-4 text-gray-600">{santri.asal_sekolah}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(santri.tanggal_lahir)}</td>
                        <td className="px-6 py-4 text-gray-600">{santri.kelas?.nama_kelas || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {hasAccess('kesantrian.mutasi.masuk') && (
                            <button
                              onClick={() => handleDelete(santri.id, santri.nama_santri)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Wizard Mode */
        <>
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mutasi Masuk - Santri Baru</h1>
              <p className="text-gray-600 mt-1">Daftarkan santri baru yang masuk ke pesantren</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Batalkan proses mutasi masuk?')) {
                  setShowWizard(false)
                  resetForm()
                  setCurrentStep(1)
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
          </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Data Pribadi', icon: User },
            { num: 2, label: 'Penempatan', icon: MapPin },
            { num: 3, label: 'Tagihan', icon: DollarSign },
            { num: 4, label: 'Review', icon: FileCheck }
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.num 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.num ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-sm mt-2 font-medium ${
                  currentStep >= step.num ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`h-1 flex-1 mx-2 ${
                  currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Data Pribadi */}
          {currentStep === 1 && (
            <Step1DataPribadi 
              formData={formStep1}
              setFormData={setFormStep1}
            />
          )}

          {/* Step 2: Penempatan */}
          {currentStep === 2 && (
            <Step2Penempatan
              formData={formStep2}
              setFormData={setFormStep2}
              kelasList={kelasList}
              asramaList={asramaList}
            />
          )}

          {/* Step 3: Tagihan */}
          {currentStep === 3 && (
            <Step3Tagihan
              jenisTagihanList={jenisTagihanList}
              kelasList={kelasList}
              selectedTagihan={selectedTagihan}
              addTagihan={addTagihan}
              removeTagihan={removeTagihan}
              updateTagihanJatuhTempo={updateTagihanJatuhTempo}
              updateTagihanNominal={updateTagihanNominal}
            />
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Step4Review
              formStep1={formStep1}
              formStep2={formStep2}
              selectedTagihan={selectedTagihan}
              kelasList={kelasList}
              asramaList={asramaList}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Lanjut'}
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan & Selesai'}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal Pilih Kelas untuk Nominal */}
      {showKelasModal && pendingTagihan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pilih Nominal Berdasarkan Tingkat
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tagihan <strong>{pendingTagihan.jenis_tagihan.namaTagihan}</strong> memiliki nominal berbeda per tingkat.
              Pilih tingkat yang sesuai untuk santri ini:
            </p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(pendingTagihan.jenis_tagihan.nominalPerkelas || pendingTagihan.jenis_tagihan.nominal_perkelas || []).map((item: any) => {
                const kelas = kelasList.find(k => k.id === (item.kelas_id || item.kelasId))
                return (
                  <button
                    key={item.kelas_id || item.kelasId}
                    onClick={() => handlePilihNominalKelas(item.kelas_id || item.kelasId)}
                    className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{kelas?.nama_kelas || `Kelas ${item.kelas_id || item.kelasId}`}</p>
                        <p className="text-xs text-gray-500">Tingkat {kelas?.tingkat || '-'}</p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(item.nominal || 0)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => {
                setShowKelasModal(false)
                setPendingTagihan(null)
              }}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

// Component untuk Step 1
function Step1DataPribadi({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi Santri</h2>
      
      {/* Biodata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama_santri}
            onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIS <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan NIS unik"
              required
            />
            <button
              type="button"
              onClick={() => {
                const randomNIS = 'NIS' + Date.now().toString().slice(-8)
                setFormData({ ...formData, nis: randomNIS })
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
              title="Generate NIS otomatis"
            >
              Auto
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">NIS harus unik (tidak boleh sama dengan santri lain)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
          <input
            type="text"
            value={formData.nisn || ''}
            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIK Santri</label>
          <input
            type="text"
            value={formData.nik_santri || ''}
            onChange={(e) => setFormData({ ...formData, nik_santri: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tempat Lahir <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.tempat_lahir}
            onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Lahir <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.tanggal_lahir}
            onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
          <select
            value={formData.jenis_kelamin}
            onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hobi</label>
          <input
            type="text"
            value={formData.hobi || ''}
            onChange={(e) => setFormData({ ...formData, hobi: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cita-cita</label>
          <input
            type="text"
            value={formData.cita_cita || ''}
            onChange={(e) => setFormData({ ...formData, cita_cita: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Saudara</label>
          <input
            type="number"
            value={formData.jumlah_saudara || ''}
            onChange={(e) => setFormData({ ...formData, jumlah_saudara: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asal Sekolah/Pesantren <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.asal_sekolah}
            onChange={(e) => setFormData({ ...formData, asal_sekolah: e.target.value })}
            placeholder="Contoh: SMP Negeri 1 Jakarta / Pesantren Al-Hikmah"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
          <input
            type="text"
            value={formData.desa || ''}
            onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
          <input
            type="text"
            value={formData.kecamatan || ''}
            onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
          <input
            type="text"
            value={formData.kabupaten || ''}
            onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
          <input
            type="text"
            value={formData.provinsi || ''}
            onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
          <input
            type="text"
            value={formData.kode_pos || ''}
            onChange={(e) => setFormData({ ...formData, kode_pos: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Data Orang Tua */}
      <div className="pt-4 border-t">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Data Orang Tua/Wali</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. KK</label>
            <input
              type="text"
              value={formData.orang_tua.no_kk || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, no_kk: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div></div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Ayah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.orang_tua.nama_ayah}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nama_ayah: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIK Ayah</label>
            <input
              type="text"
              value={formData.orang_tua.nik_ayah || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nik_ayah: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Ayah</label>
            <input
              type="text"
              value={formData.orang_tua.pendidikan_ayah || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pendidikan_ayah: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Ayah</label>
            <input
              type="text"
              value={formData.orang_tua.pekerjaan_ayah || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pekerjaan_ayah: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HP Ayah</label>
            <input
              type="text"
              value={formData.orang_tua.hp_ayah || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, hp_ayah: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Ibu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.orang_tua.nama_ibu}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nama_ibu: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIK Ibu</label>
            <input
              type="text"
              value={formData.orang_tua.nik_ibu || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, nik_ibu: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Ibu</label>
            <input
              type="text"
              value={formData.orang_tua.pendidikan_ibu || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pendidikan_ibu: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Ibu</label>
            <input
              type="text"
              value={formData.orang_tua.pekerjaan_ibu || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, pekerjaan_ibu: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HP Ibu</label>
            <input
              type="text"
              value={formData.orang_tua.hp_ibu || ''}
              onChange={(e) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, hp_ibu: e.target.value } })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Component untuk Step 2
function Step2Penempatan({ formData, setFormData, kelasList, asramaList }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Penempatan Kelas & Asrama</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Kelas <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.kelas_id}
            onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map((kelas: any) => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Asrama <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.asrama_id}
            onChange={(e) => setFormData({ ...formData, asrama_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Pilih Asrama --</option>
            {asramaList.map((asrama: any) => (
              <option key={asrama.id} value={asrama.id}>
                {asrama.nama_asrama}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// Component untuk Step 3
function Step3Tagihan({ jenisTagihanList, kelasList, selectedTagihan, addTagihan, removeTagihan, updateTagihanJatuhTempo, updateTagihanNominal }: any) {
  const formatRupiah = (nominal: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(nominal)
  }

  const totalTagihan = selectedTagihan.reduce((sum: number, t: any) => sum + Number(t.nominal), 0)

  console.log('=== STEP 3 DEBUG ===')
  console.log('jenisTagihanList:', jenisTagihanList)
  console.log('jenisTagihanList.length:', jenisTagihanList.length)
  if (jenisTagihanList.length > 0) {
    console.log('First item:', jenisTagihanList[0])
  }
  console.log('selectedTagihan:', selectedTagihan)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Tagihan</h2>
      
      {/* Daftar Jenis Tagihan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jenis Tagihan Tersedia ({jenisTagihanList.length} item)
        </label>
        
        {jenisTagihanList.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-gray-500 mb-2">Belum ada jenis tagihan tersedia</p>
            <p className="text-sm text-gray-400">Silakan tambahkan jenis tagihan di menu Keuangan → Jenis Tagihan terlebih dahulu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jenisTagihanList.map((jenis: any) => (
            <div
              key={jenis.id}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
              onClick={() => addTagihan(jenis)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{jenis.namaTagihan || jenis.nama_tagihan || 'Tagihan'}</p>
                  <p className="text-xs text-gray-500 mt-1">{jenis.kategori || ''}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addTagihan(jenis)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
                  type="button"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Tagihan Terpilih */}
      {selectedTagihan.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Tagihan Terpilih</h3>
          <div className="space-y-3">
            {selectedTagihan.map((tagihan: any) => (
              <div key={tagihan.jenis_tagihan_id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tagihan.nama_tagihan}</p>
                  </div>
                  <button
                    onClick={() => removeTagihan(tagihan.jenis_tagihan_id)}
                    className="text-red-600 hover:bg-red-100 p-1 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Input Nominal */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nominal {tagihan.is_custom_nominal && <span className="text-blue-600">(Custom)</span>}
                    </label>
                    {tagihan.tipe_nominal === 'per_individu' || tagihan.tipe_nominal === 'per_kelas' || tagihan.tipe_nominal === 'beda_perkelas' ? (
                      <>
                        <input
                          type="number"
                          value={tagihan.nominal || ''}
                          onChange={(e) => updateTagihanNominal(tagihan.jenis_tagihan_id, Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan nominal"
                          min="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">{formatRupiah(Number(tagihan.nominal) || 0)}</p>
                        {tagihan.kelas_id && (
                          <p className="text-xs text-blue-600 mt-1">
                            Tingkat {kelasList.find((k: any) => k.id === tagihan.kelas_id)?.tingkat || tagihan.kelas_id}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700">
                          {tagihan.nominal || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatRupiah(Number(tagihan.nominal) || 0)}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Input Jatuh Tempo */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Jatuh Tempo</label>
                    {tagihan.tipe_nominal === 'per_individu' ? (
                      <input
                        type="date"
                        value={tagihan.jatuh_tempo || ''}
                        onChange={(e) => updateTagihanJatuhTempo(tagihan.jenis_tagihan_id, e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700">
                        {tagihan.jatuh_tempo || '-'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Tagihan:</span>
              <span className="text-xl font-bold text-blue-600">{formatRupiah(totalTagihan)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component untuk Step 4
function Step4Review({ formStep1, formStep2, selectedTagihan, kelasList, asramaList }: any) {
  const formatRupiah = (nominal: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(nominal)
  }

  const kelas = kelasList.find((k: any) => k.id === Number(formStep2.kelas_id))
  const asrama = asramaList.find((a: any) => a.id === Number(formStep2.asrama_id))
  const totalTagihan = selectedTagihan.reduce((sum: number, t: any) => sum + Number(t.nominal), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Konfirmasi</h2>
      
      {/* Data Santri */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Data Santri</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Nama:</span>
            <p className="font-medium">{formStep1.nama_santri}</p>
          </div>
          <div>
            <span className="text-gray-600">NIS:</span>
            <p className="font-medium">{formStep1.nis}</p>
          </div>
          <div>
            <span className="text-gray-600">Tempat, Tgl Lahir:</span>
            <p className="font-medium">{formStep1.tempat_lahir}, {formStep1.tanggal_lahir}</p>
          </div>
          <div>
            <span className="text-gray-600">Jenis Kelamin:</span>
            <p className="font-medium">{formStep1.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
          </div>
          <div>
            <span className="text-gray-600">Asal Sekolah:</span>
            <p className="font-medium">{formStep1.asal_sekolah}</p>
          </div>
          <div>
            <span className="text-gray-600">Orang Tua:</span>
            <p className="font-medium">{formStep1.orang_tua.nama_ayah} & {formStep1.orang_tua.nama_ibu}</p>
          </div>
        </div>
      </div>

      {/* Penempatan */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Penempatan</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Kelas:</span>
            <p className="font-medium">{kelas?.nama_kelas || '-'}</p>
          </div>
          <div>
            <span className="text-gray-600">Asrama:</span>
            <p className="font-medium">{asrama?.nama_asrama || '-'}</p>
          </div>
        </div>
      </div>

      {/* Tagihan */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Tagihan</h3>
        <div className="space-y-2">
          {selectedTagihan.map((tagihan: any) => (
            <div key={tagihan.jenis_tagihan_id} className="flex justify-between text-sm">
              <span className="text-gray-700">{tagihan.nama_tagihan}</span>
              <span className="font-medium">{formatRupiah(tagihan.nominal)}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex justify-between font-semibold">
            <span>Total:</span>
            <span className="text-blue-600">{formatRupiah(totalTagihan)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ Data santri siap disimpan. Klik "Simpan & Selesai" untuk menyelesaikan proses mutasi masuk.
        </p>
      </div>
    </div>
  )
}
  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const bulanNamaID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const getBulanNamaFromDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const idx = d.getMonth()
    return bulanNamaID[idx] || ''
  }