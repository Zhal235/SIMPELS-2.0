import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Play, X, Search, Filter } from 'lucide-react'
import { listSantri } from '../../api/santri'
import { listKelas } from '../../api/kelas'
import { listJenisTagihan, createJenisTagihan, updateJenisTagihan, deleteJenisTagihan } from '../../api/jenisTagihan'
import toast from 'react-hot-toast'

interface JenisTagihan {
  id: number
  namaTagihan: string
  kategori: 'Rutin' | 'Non Rutin'
  bulan: string[]
  tipeNominal: 'sama' | 'per_kelas' | 'per_individu'
  nominalSama?: number
  nominalPerKelas?: { kelas: string; nominal: number }[]
  nominalPerIndividu?: { santriId: string; santriNama: string; nominal: number }[]
  jatuhTempo: string
  bukuKas: string
}

export default function JenisTagihan() {
  const [showModal, setShowModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState<JenisTagihan | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [kelasList, setKelasList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [dataTagihan, setDataTagihan] = useState<JenisTagihan[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch data kelas, santri, dan jenis tagihan dari API
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [kelasRes, santriRes, tagihanRes] = await Promise.all([
        listKelas(),
        listSantri(1, 1000),
        listJenisTagihan()
      ])
      
      setKelasList(kelasRes.data || kelasRes || [])
      setSantriList(santriRes.data || santriRes || [])
      setDataTagihan(tagihanRes.data || tagihanRes || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = dataTagihan.filter(item =>
    item.namaTagihan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) {
      try {
        await deleteJenisTagihan(id)
        setDataTagihan(dataTagihan.filter(item => item.id !== id))
        toast.success('Tagihan berhasil dihapus!')
      } catch (error) {
        console.error('Error deleting:', error)
        toast.error('Gagal menghapus tagihan')
      }
    }
  }

  const handleSave = async (data: JenisTagihan) => {
    try {
      if (selectedTagihan) {
        // Edit existing
        const response = await updateJenisTagihan(selectedTagihan.id, data)
        setDataTagihan(dataTagihan.map(item => 
          item.id === selectedTagihan.id ? response.data : item
        ))
        toast.success('Tagihan berhasil diperbarui!')
      } else {
        // Add new
        const response = await createJenisTagihan(data)
        setDataTagihan([...dataTagihan, response.data])
        toast.success('Tagihan berhasil ditambahkan!')
      }
      setShowModal(false)
      setSelectedTagihan(null)
    } catch (error: any) {
      console.error('Error saving:', error)
      const errorMessage = error.response?.data?.message || 'Gagal menyimpan tagihan'
      toast.error(errorMessage)
    }
  }

  const handleGenerate = (tagihan: JenisTagihan) => {
    setSelectedTagihan(tagihan)
    setShowPreviewModal(true)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jenis Tagihan</h1>
        <p className="text-gray-600 mt-1">Kelola jenis-jenis tagihan untuk santri</p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex justify-between items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari tagihan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tambah Tagihan Button */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Tagihan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Tagihan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal Default</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buku Kas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data tagihan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.namaTagihan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.kategori === 'Rutin' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.bulan.length > 3 
                          ? `${item.bulan.slice(0, 3).join(', ')}... (+${item.bulan.length - 3})` 
                          : item.bulan.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.tipeNominal === 'sama' && item.nominalSama && (
                          `Rp ${item.nominalSama.toLocaleString('id-ID')}`
                        )}
                        {item.tipeNominal === 'per_kelas' && (
                          <span className="text-orange-600 font-medium">Berbeda per Kelas</span>
                        )}
                        {item.tipeNominal === 'per_individu' && (
                          <span className="text-purple-600 font-medium">Berbeda per Individu</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.jatuhTempo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.bukuKas}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerate(item)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                          title="Generate Tagihan"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTagihan(item)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Tagihan */}
      {showModal && (
        <ModalFormTagihan
          onClose={() => {
            setShowModal(false)
            setSelectedTagihan(null)
          }}
          onSave={handleSave}
          tagihan={selectedTagihan}
          kelasList={kelasList}
          santriList={santriList}
        />
      )}

      {/* Modal Preview Generate */}
      {showPreviewModal && selectedTagihan && (
        <ModalPreviewGenerate
          tagihan={selectedTagihan}
          santriList={santriList}
          onClose={() => {
            setShowPreviewModal(false)
            setSelectedTagihan(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Form Tagihan
function ModalFormTagihan({ 
  onClose,
  onSave,
  tagihan, 
  kelasList, 
  santriList 
}: { 
  onClose: () => void
  onSave: (data: JenisTagihan) => void
  tagihan: JenisTagihan | null
  kelasList: any[]
  santriList: any[]
}) {
  const [namaTagihan, setNamaTagihan] = useState(tagihan?.namaTagihan || '')
  const [kategori, setKategori] = useState<'Rutin' | 'Non Rutin'>(tagihan?.kategori || 'Rutin')
  const [bulanTerpilih, setBulanTerpilih] = useState<string[]>(tagihan?.bulan || [])
  const [tipeNominal, setTipeNominal] = useState<'sama' | 'per_kelas' | 'per_individu'>(tagihan?.tipeNominal || 'sama')
  const [nominalSama, setNominalSama] = useState(tagihan?.nominalSama || 0)
  const [nominalPerKelas, setNominalPerKelas] = useState<{ kelas: string; nominal: number }[]>(tagihan?.nominalPerKelas || [])
  const [nominalPerIndividu, setNominalPerIndividu] = useState<{ santriId: string; santriNama: string; nominal: number }[]>(tagihan?.nominalPerIndividu || [])
  const [jatuhTempo, setJatuhTempo] = useState(tagihan?.jatuhTempo || '')
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [bukuKas, setBukuKas] = useState(tagihan?.bukuKas || '')
  const [searchSantri, setSearchSantri] = useState('')
  const [showAddSantriModal, setShowAddSantriModal] = useState(false)

  const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  // Filter santri based on search
  const filteredSantri = santriList.filter(s => 
    s.nama_santri?.toLowerCase().includes(searchSantri.toLowerCase()) ||
    s.nis?.toLowerCase().includes(searchSantri.toLowerCase())
  )

  // Handle perubahan nominal per kelas
  const handleKelasNominalChange = (kelas: string, nominal: number) => {
    const existing = nominalPerKelas.find(n => n.kelas === kelas)
    if (existing) {
      setNominalPerKelas(nominalPerKelas.map(n => 
        n.kelas === kelas ? { ...n, nominal } : n
      ))
    } else if (nominal > 0) {
      setNominalPerKelas([...nominalPerKelas, { kelas, nominal }])
    }
  }

  // Handle toggle kelas
  const handleToggleKelas = (kelas: string, checked: boolean) => {
    if (!checked) {
      setNominalPerKelas(nominalPerKelas.filter(n => n.kelas !== kelas))
    } else if (!nominalPerKelas.find(n => n.kelas === kelas)) {
      setNominalPerKelas([...nominalPerKelas, { kelas, nominal: 0 }])
    }
  }

  // Handle add santri individu (bisa multiple)
  const handleAddSantri = (santriList: Array<{id: string, nama: string}>, nominal: number) => {
    const newSantri = santriList.map(s => ({
      santriId: s.id,
      santriNama: s.nama,
      nominal
    }))
    
    const existingIds = new Set(nominalPerIndividu.map(n => n.santriId))
    const toAdd = newSantri.filter(s => !existingIds.has(s.santriId))
    
    if (toAdd.length > 0) {
      setNominalPerIndividu([...nominalPerIndividu, ...toAdd])
      toast.success(`${toAdd.length} santri berhasil ditambahkan`)
    } else {
      toast.error('Semua santri sudah ada dalam daftar')
    }
    setShowAddSantriModal(false)
    setSearchSantri('')
  }

  // Handle remove santri individu
  const handleRemoveSantri = (santriId: string) => {
    const santriNama = nominalPerIndividu.find(n => n.santriId === santriId)?.santriNama
    setNominalPerIndividu(nominalPerIndividu.filter(n => n.santriId !== santriId))
    toast.success(`${santriNama} berhasil dihapus`)
  }

  // Handle edit nominal santri
  const handleEditNominalSantri = (santriId: string, nominal: number) => {
    setNominalPerIndividu(nominalPerIndividu.map(n =>
      n.santriId === santriId ? { ...n, nominal } : n
    ))
  }

  // Handle save
  const handleSubmit = () => {
    // Validasi
    if (!namaTagihan.trim()) {
      alert('Nama tagihan harus diisi')
      return
    }
    if (bulanTerpilih.length === 0) {
      alert('Pilih minimal satu bulan')
      return
    }
    if (!jatuhTempo && !tanggalJatuhTempo) {
      alert('Jatuh tempo harus diisi')
      return
    }
    if (!bukuKas) {
      alert('Buku kas harus dipilih')
      return
    }

    // Validasi nominal
    if (tipeNominal === 'sama' && nominalSama <= 0) {
      alert('Nominal harus lebih dari 0')
      return
    }
    if (tipeNominal === 'per_kelas' && nominalPerKelas.length === 0) {
      alert('Pilih minimal satu kelas dan isi nominalnya')
      return
    }
    if (tipeNominal === 'per_individu' && nominalPerIndividu.length === 0) {
      alert('Pilih minimal satu santri dan isi nominalnya')
      return
    }

    // Build data
    const data: JenisTagihan = {
      id: 0, // Will be set by parent
      namaTagihan,
      kategori,
      bulan: bulanTerpilih,
      tipeNominal,
      jatuhTempo: kategori === 'Rutin' ? jatuhTempo : tanggalJatuhTempo,
      bukuKas
    }

    if (tipeNominal === 'sama') {
      data.nominalSama = nominalSama
    } else if (tipeNominal === 'per_kelas') {
      data.nominalPerKelas = nominalPerKelas
    } else if (tipeNominal === 'per_individu') {
      data.nominalPerIndividu = nominalPerIndividu
    }

    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {tagihan ? 'Edit Tagihan' : 'Tambah Tagihan Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Nama Tagihan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tagihan *</label>
            <input
              type="text"
              placeholder="Contoh: SPP, Makan, Ujian"
              value={namaTagihan}
              onChange={(e) => setNamaTagihan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="kategori"
                  value="Rutin"
                  checked={kategori === 'Rutin'}
                  onChange={(e) => setKategori(e.target.value as 'Rutin')}
                  className="mr-2"
                />
                Rutin
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="kategori"
                  value="Non Rutin"
                  checked={kategori === 'Non Rutin'}
                  onChange={(e) => setKategori(e.target.value as 'Non Rutin')}
                  className="mr-2"
                />
                Non Rutin
              </label>
            </div>
          </div>

          {/* Bulan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan Tagihan * 
              <span className="text-xs text-gray-500 ml-2">
                ({kategori === 'Rutin' ? 'Pilih bulan dari tahun ajaran aktif' : 'Pilih bulan penagihan'})
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {bulanList.map((bulan) => (
                <label key={bulan} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulanTerpilih.includes(bulan)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulanTerpilih([...bulanTerpilih, bulan])
                      } else {
                        setBulanTerpilih(bulanTerpilih.filter(b => b !== bulan))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{bulan}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipe Nominal & Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Nominal *</label>
            <div className="space-y-3">
              {/* Nominal Sama */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipeNominal"
                  value="sama"
                  checked={tipeNominal === 'sama'}
                  onChange={() => setTipeNominal('sama')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Nominal Sama untuk Semua Santri</div>
                  <div className="text-xs text-gray-500">Otomatis untuk semua santri aktif</div>
                </div>
              </label>
              {tipeNominal === 'sama' && (
                <div className="ml-6">
                  <input
                    type="number"
                    placeholder="Masukkan nominal"
                    value={nominalSama || ''}
                    onChange={(e) => setNominalSama(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {/* Nominal Per Kelas */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipeNominal"
                  value="per_kelas"
                  checked={tipeNominal === 'per_kelas'}
                  onChange={() => setTipeNominal('per_kelas')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Nominal Berbeda Per Kelas</div>
                  <div className="text-xs text-gray-500">Centang kelas & isi nominal = otomatis jadi target</div>
                </div>
              </label>
              {tipeNominal === 'per_kelas' && (
                <div className="ml-6 space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-semibold mb-2">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">Kelas</div>
                    <div className="col-span-6">Nominal</div>
                  </div>
                  {kelasList.map((kelas) => {
                    const kelasNama = kelas.nama_kelas || kelas.id
                    const isChecked = nominalPerKelas.some(n => n.kelas === kelasNama)
                    const nominalValue = nominalPerKelas.find(n => n.kelas === kelasNama)?.nominal || 0
                    
                    return (
                      <div key={kelas.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleKelas(kelasNama, e.target.checked)}
                          />
                        </div>
                        <div className="col-span-5 text-sm">{kelasNama}</div>
                        <div className="col-span-6">
                          <input
                            type="number"
                            placeholder="0"
                            value={nominalValue || ''}
                            onChange={(e) => handleKelasNominalChange(kelasNama, Number(e.target.value))}
                            disabled={!isChecked}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Nominal Per Individu */}
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="tipeNominal"
                  value="per_individu"
                  checked={tipeNominal === 'per_individu'}
                  onChange={() => setTipeNominal('per_individu')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Nominal Berbeda Per Individu</div>
                  <div className="text-xs text-gray-500">Pilih santri & isi nominal per santri</div>
                </div>
              </label>
              {tipeNominal === 'per_individu' && (
                <div className="ml-6 space-y-2">
                  {/* List Santri Terpilih */}
                  {nominalPerIndividu.length > 0 && (
                    <div className="border border-gray-200 rounded p-3 max-h-48 overflow-y-auto space-y-2">
                      {nominalPerIndividu.map((item) => (
                        <div key={item.santriId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.santriNama}</div>
                          </div>
                          <input
                            type="number"
                            placeholder="Nominal"
                            value={item.nominal || ''}
                            onChange={(e) => handleEditNominalSantri(item.santriId, Number(e.target.value))}
                            className="w-32 px-3 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleRemoveSantri(item.santriId)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowAddSantriModal(true)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Santri
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Jatuh Tempo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jatuh Tempo *
              <span className="text-xs text-gray-500 ml-2">
                ({kategori === 'Rutin' ? 'Contoh: Tanggal 10 setiap bulan' : 'Pilih tanggal spesifik'})
              </span>
            </label>
            {kategori === 'Rutin' ? (
              <div className="flex items-center gap-2">
                <span>Tanggal</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="10"
                  value={jatuhTempo.replace(/\D/g, '')}
                  onChange={(e) => setJatuhTempo(`Tanggal ${e.target.value} setiap bulan`)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span>setiap bulan</span>
              </div>
            ) : (
              <input
                type="date"
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {/* Buku Kas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buku Kas *</label>
            <select
              value={bukuKas}
              onChange={(e) => setBukuKas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Buku Kas</option>
              <option value="Kas SPP">Kas SPP</option>
              <option value="Kas Makan">Kas Makan</option>
              <option value="Kas Ujian">Kas Ujian</option>
              <option value="Kas Perlengkapan">Kas Perlengkapan</option>
            </select>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {tagihan ? 'Simpan Perubahan' : 'Tambah Tagihan'}
          </button>
        </div>
      </div>

      {/* Modal Tambah Santri */}
      {showAddSantriModal && (
        <ModalTambahSantri
          santriList={filteredSantri}
          onAdd={handleAddSantri}
          onClose={() => {
            setShowAddSantriModal(false)
            setSearchSantri('')
          }}
          searchTerm={searchSantri}
          onSearch={setSearchSantri}
        />
      )}
    </div>
  )
}

// Modal Tambah Santri (Multiple Selection)
function ModalTambahSantri({
  santriList,
  onAdd,
  onClose,
  searchTerm,
  onSearch
}: {
  santriList: any[]
  onAdd: (santriList: Array<{id: string, nama: string}>, nominal: number) => void
  onClose: () => void
  searchTerm: string
  onSearch: (term: string) => void
}) {
  const [santriTerpilih, setSantriTerpilih] = useState<Array<{id: string, nama: string}>>([])
  const [nominal, setNominal] = useState(0)
  const [localSearch, setLocalSearch] = useState('')

  // Filter santri yang belum dipilih
  const availableSantri = santriList.filter(s => 
    !santriTerpilih.find(st => st.id === String(s.id))
  )

  // Filter hasil pencarian
  const filteredSantri = availableSantri.filter(s => 
    (s.nama_santri?.toLowerCase().includes(localSearch.toLowerCase()) ||
     s.nis?.toLowerCase().includes(localSearch.toLowerCase())) &&
    localSearch.length >= 2
  )

  const handleToggleSantri = (santri: any) => {
    const santriId = String(santri.id)
    if (santriTerpilih.find(s => s.id === santriId)) {
      setSantriTerpilih(santriTerpilih.filter(s => s.id !== santriId))
    } else {
      setSantriTerpilih([...santriTerpilih, {
        id: santriId,
        nama: santri.nama_santri
      }])
    }
  }

  const handleAdd = () => {
    if (santriTerpilih.length === 0 || nominal <= 0) {
      toast.error('Pilih minimal 1 santri dan isi nominal')
      return
    }
    onAdd(santriTerpilih, nominal)
    setSantriTerpilih([])
    setNominal(0)
    setLocalSearch('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">Tambah Santri (Nominal Sama)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri (min 2 huruf)</label>
            <input
              type="text"
              placeholder="Nama atau NIS..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hasil Pencarian */}
          {localSearch.length >= 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasil Pencarian ({filteredSantri.length})
              </label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredSantri.length > 0 ? (
                  <div className="divide-y">
                    {filteredSantri.map((santri) => (
                      <div
                        key={santri.id}
                        onClick={() => handleToggleSantri(santri)}
                        className={`p-3 cursor-pointer flex items-center gap-3 ${
                          santriTerpilih.find(s => s.id === String(santri.id))
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!santriTerpilih.find(s => s.id === String(santri.id))}
                          onChange={() => {}}
                          className="cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{santri.nama_santri}</div>
                          <div className="text-xs text-gray-500">{santri.nis} • {santri.kelas_nama}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Santri tidak ditemukan
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Santri Terpilih */}
          {santriTerpilih.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Santri Terpilih ({santriTerpilih.length})
              </label>
              <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
                {santriTerpilih.map((santri) => (
                  <div key={santri.id} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm font-medium">{santri.nama}</span>
                    <button
                      onClick={() => setSantriTerpilih(santriTerpilih.filter(s => s.id !== santri.id))}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nominal Input */}
          {santriTerpilih.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominal untuk {santriTerpilih.length} santri
              </label>
              <input
                type="number"
                placeholder="Masukkan nominal"
                value={nominal || ''}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              {nominal > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Total: {santriTerpilih.length} × Rp {nominal.toLocaleString('id-ID')} = <strong>Rp {(santriTerpilih.length * nominal).toLocaleString('id-ID')}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            disabled={santriTerpilih.length === 0 || nominal <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Tambah ({santriTerpilih.length})
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Preview Generate
function ModalPreviewGenerate({ 
  tagihan, 
  santriList,
  onClose 
}: { 
  tagihan: JenisTagihan
  santriList: any[]
  onClose: () => void 
}) {
  // Data santri berdasarkan tipe nominal
  const getDaftarSantri = () => {
    if (tagihan.tipeNominal === 'sama') {
      // Semua santri
      return santriList.map(s => ({
        nama: s.nama_santri,
        kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas',
        nominal: tagihan.nominalSama || 0
      }))
    } else if (tagihan.tipeNominal === 'per_kelas') {
      // Filter berdasarkan kelas yang ada di nominalPerKelas
      const kelasTarget = tagihan.nominalPerKelas?.map(n => n.kelas) || []
      console.log('Kelas Target:', kelasTarget)
      console.log('Santri List Sample:', santriList.slice(0, 3))
      
      return santriList
        .filter(s => {
          // Cek kelas_nama field langsung atau dari relasi
          const kelasNama = s.kelas_nama || s.kelas?.nama_kelas
          console.log(`Santri: ${s.nama_santri}, Kelas: ${kelasNama}, Match: ${kelasNama && kelasTarget.includes(kelasNama)}`)
          
          // Cek apakah kelas santri ada di target
          return kelasNama && kelasTarget.includes(kelasNama)
        })
        .map(s => {
          const kelasNama = s.kelas_nama || s.kelas?.nama_kelas
          const nominalKelas = tagihan.nominalPerKelas?.find(n => n.kelas === kelasNama)
          return {
            nama: s.nama_santri,
            kelas: kelasNama || 'Belum ada kelas',
            nominal: nominalKelas?.nominal || 0
          }
        })
    } else if (tagihan.tipeNominal === 'per_individu') {
      // Hanya santri yang ada di nominalPerIndividu
      const santriIds = tagihan.nominalPerIndividu?.map(n => n.santriId) || []
      console.log('Santri IDs untuk per_individu:', santriIds)
      console.log('Santri List:', santriList)
      
      return santriList
        .filter(s => {
          const match = santriIds.includes(String(s.id))
          console.log(`Filter santri ${s.nama_santri} (ID: ${s.id}): ${match}`)
          return match
        })
        .map(s => {
          const nominalIndividu = tagihan.nominalPerIndividu?.find(n => n.santriId === String(s.id))
          return {
            nama: s.nama_santri,
            kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas',
            nominal: nominalIndividu?.nominal || 0
          }
        })
    }
    return []
  }

  const daftarSantri = getDaftarSantri()
  const totalTagihan = daftarSantri.length * tagihan.bulan.length

  // Informasi target
  const getTargetInfo = () => {
    if (tagihan.tipeNominal === 'sama') {
      return {
        tipe: 'Semua Santri',
        detail: `Nominal: Rp ${tagihan.nominalSama?.toLocaleString('id-ID')}`
      }
    } else if (tagihan.tipeNominal === 'per_kelas') {
      // Filter hanya kelas yang punya santri
      const kelasWithSantri = tagihan.nominalPerKelas?.filter(item => {
        const jumlahSantri = santriList.filter(s => 
          (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas
        ).length
        return jumlahSantri > 0
      }) || []

      const kelasInfo = kelasWithSantri.map(n => 
        `${n.kelas}: Rp ${n.nominal.toLocaleString('id-ID')}`
      ).join(', ') || 'Tidak ada santri ditemukan'
      return {
        tipe: 'Berdasarkan Kelas',
        detail: kelasInfo,
        showDetailList: true,
        kelasWithSantri
      }
    } else {
      const santriCount = tagihan.nominalPerIndividu?.length || 0
      return {
        tipe: 'Santri Individu',
        detail: `${santriCount} santri terpilih`,
        showDetailList: false
      }
    }
  }

  const targetInfo = getTargetInfo()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Preview Generate Tagihan</h2>
          <p className="text-sm text-gray-600 mt-1">Tagihan: <strong>{tagihan.namaTagihan}</strong></p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Tagihan */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-semibold">Kategori:</span> {tagihan.kategori}</div>
              <div><span className="font-semibold">Tipe Nominal:</span> {targetInfo.tipe}</div>
              <div><span className="font-semibold">Bulan:</span> {tagihan.bulan.length} bulan ({tagihan.bulan.slice(0, 3).join(', ')}{tagihan.bulan.length > 3 ? '...' : ''})</div>
              <div><span className="font-semibold">Jatuh Tempo:</span> {tagihan.jatuhTempo}</div>
            </div>
          </div>

          {/* Target Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Target Generate</h3>
            <div className="text-sm text-blue-800">
              <p>✓ {targetInfo.tipe}</p>
              {targetInfo.showDetailList && (targetInfo.kelasWithSantri?.length ?? 0) > 0 ? (
                <div className="ml-4 mt-2 space-y-1">
                  {targetInfo.kelasWithSantri?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded">
                      <span className="font-medium">{item.kelas}</span>
                      <span className="text-blue-900 font-semibold">Rp {item.nominal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ml-4 text-xs mt-1">{targetInfo.detail}</p>
              )}
            </div>
          </div>

          {/* Daftar Santri yang Akan Dibuatkan Tagihan */}
          {tagihan.tipeNominal !== 'per_kelas' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Daftar Santri ({daftarSantri.length} Santri)
              </h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">No</th>
                      <th className="px-4 py-2 text-left">Nama Santri</th>
                      <th className="px-4 py-2 text-left">Kelas</th>
                      <th className="px-4 py-2 text-right">Nominal/Bulan</th>
                      <th className="px-4 py-2 text-right">Jumlah Bulan</th>
                      <th className="px-4 py-2 text-right">Total Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {daftarSantri.map((santri, idx) => {
                      const total = santri.nominal * tagihan.bulan.length

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2 font-medium">{santri.nama}</td>
                          <td className="px-4 py-2">{santri.kelas}</td>
                          <td className="px-4 py-2 text-right">Rp {santri.nominal.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2 text-right">{tagihan.bulan.length}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            Rp {total.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ringkasan Per Kelas untuk tipe per_kelas */}
          {tagihan.tipeNominal === 'per_kelas' && tagihan.nominalPerKelas && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Ringkasan Per Kelas
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Kelas</th>
                      <th className="px-4 py-2 text-right">Nominal/Bulan</th>
                      <th className="px-4 py-2 text-right">Jumlah Santri</th>
                      <th className="px-4 py-2 text-right">Jumlah Bulan</th>
                      <th className="px-4 py-2 text-right">Total Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tagihan.nominalPerKelas
                      ?.filter(item => {
                        // Hanya tampilkan kelas yang punya santri
                        const jumlahSantri = santriList.filter(s => 
                          (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas
                        ).length
                        return jumlahSantri > 0
                      })
                      .map((item, idx) => {
                        const jumlahSantri = santriList.filter(s => 
                          (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas
                        ).length
                        const totalPerKelas = item.nominal * tagihan.bulan.length * jumlahSantri

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{item.kelas}</td>
                            <td className="px-4 py-2 text-right">Rp {item.nominal.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-2 text-right">{jumlahSantri} santri</td>
                            <td className="px-4 py-2 text-right">{tagihan.bulan.length}</td>
                            <td className="px-4 py-2 text-right font-semibold">
                              Rp {totalPerKelas.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ringkasan */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Ringkasan Generate</h3>
            <div className="text-sm text-green-800 space-y-1">
              {tagihan.tipeNominal === 'per_kelas' ? (
                <>
                  <p>• Total kelas: <strong>{tagihan.nominalPerKelas?.length || 0} kelas</strong></p>
                  <p>• Total santri: <strong>{daftarSantri.length} santri</strong></p>
                  <p>• Total bulan: <strong>{tagihan.bulan.length} bulan</strong></p>
                  <p>• Total tagihan yang akan dibuat: <strong>{totalTagihan} tagihan</strong></p>
                </>
              ) : (
                <>
                  <p>• Total santri: <strong>{daftarSantri.length} santri</strong></p>
                  <p>• Total bulan: <strong>{tagihan.bulan.length} bulan</strong></p>
                  <p>• Total tagihan yang akan dibuat: <strong>{totalTagihan} tagihan</strong></p>
                </>
              )}
              <p>• Buku Kas: <strong>{tagihan.bukuKas}</strong></p>
            </div>
          </div>

          {/* Catatan Penting */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Catatan Penting - Tagihan Permanen
            </h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>• Tagihan yang sudah di-generate akan <strong>DISIMPAN PERMANEN</strong> dengan kelas & nominal saat generate</p>
              <p>• Jika santri <strong>pindah kelas</strong>, tagihan lama <strong>TETAP TIDAK BERUBAH</strong></p>
              <p>• Nominal tagihan selalu mengikuti kelas santri <strong>saat tagihan dibuat</strong>, tidak berubah meski santri pindah kelas kemudian</p>
              <p className="pt-1 italic text-yellow-700">Contoh: Santri di kelas IXA bayar Rp 350.000 saat dibuat tagihan, jika pindah ke kelas X tahun depan, tagihan lama tetap Rp 350.000</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={() => {
              alert(`Berhasil generate ${totalTagihan} tagihan untuk ${daftarSantri.length} santri!`)
              onClose()
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Generate Tagihan Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
