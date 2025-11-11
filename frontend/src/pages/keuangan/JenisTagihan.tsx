import { useState } from 'react'
import { Plus, Edit2, Trash2, Play, X, Search, Filter } from 'lucide-react'

interface JenisTagihan {
  id: number
  namaTagihan: string
  kategori: 'Rutin' | 'Non Rutin'
  bulan: string[]
  nominalDefault: number | 'Berbeda'
  nominalPerKelas?: { kelas: string; nominal: number }[]
  jatuhTempo: string
  bukuKas: string
  targetGenerate: 'semua' | 'kelas' | 'individu'
  targetDetail?: {
    kelas?: string[]
    santri?: string[]
  }
}

export default function JenisTagihan() {
  const [showModal, setShowModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState<JenisTagihan | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Data dummy
  const [dataTagihan, setDataTagihan] = useState<JenisTagihan[]>([
    {
      id: 1,
      namaTagihan: 'SPP',
      kategori: 'Rutin',
      bulan: ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
      nominalDefault: 500000,
      jatuhTempo: 'Tanggal 10 setiap bulan',
      bukuKas: 'Kas SPP',
      targetGenerate: 'semua'
    },
    {
      id: 2,
      namaTagihan: 'Makan',
      kategori: 'Rutin',
      bulan: ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
      nominalDefault: 'Berbeda',
      nominalPerKelas: [
        { kelas: 'VII A', nominal: 300000 },
        { kelas: 'VII B', nominal: 300000 },
        { kelas: 'VIII A', nominal: 350000 },
        { kelas: 'VIII B', nominal: 350000 }
      ],
      jatuhTempo: 'Tanggal 15 setiap bulan',
      bukuKas: 'Kas Makan',
      targetGenerate: 'kelas',
      targetDetail: {
        kelas: ['VII A', 'VII B', 'VIII A', 'VIII B']
      }
    },
    {
      id: 3,
      namaTagihan: 'Ujian Akhir Semester',
      kategori: 'Non Rutin',
      bulan: ['November'],
      nominalDefault: 200000,
      jatuhTempo: '20 November 2025',
      bukuKas: 'Kas Ujian',
      targetGenerate: 'semua'
    },
    {
      id: 4,
      namaTagihan: 'Perlengkapan Lab',
      kategori: 'Non Rutin',
      bulan: ['Agustus'],
      nominalDefault: 'Berbeda',
      nominalPerKelas: [
        { kelas: 'VII A', nominal: 150000 },
        { kelas: 'VIII A', nominal: 200000 }
      ],
      jatuhTempo: '25 Agustus 2025',
      bukuKas: 'Kas Perlengkapan',
      targetGenerate: 'individu',
      targetDetail: {
        santri: ['Ahmad Putra', 'Budi Santoso']
      }
    }
  ])

  const filteredData = dataTagihan.filter(item =>
    item.namaTagihan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) {
      setDataTagihan(dataTagihan.filter(item => item.id !== id))
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
                        {item.nominalDefault === 'Berbeda' 
                          ? <span className="text-orange-600 font-medium">Nominal Berbeda</span>
                          : `Rp ${item.nominalDefault.toLocaleString('id-ID')}`
                        }
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
          tagihan={selectedTagihan}
        />
      )}

      {/* Modal Preview Generate */}
      {showPreviewModal && selectedTagihan && (
        <ModalPreviewGenerate
          tagihan={selectedTagihan}
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
function ModalFormTagihan({ onClose, tagihan }: { onClose: () => void; tagihan: JenisTagihan | null }) {
  const [kategori, setKategori] = useState<'Rutin' | 'Non Rutin'>(tagihan?.kategori || 'Rutin')
  const [nominalSama, setNominalSama] = useState(tagihan?.nominalDefault !== 'Berbeda')
  const [targetGenerate, setTargetGenerate] = useState<'semua' | 'kelas' | 'individu'>(tagihan?.targetGenerate || 'semua')
  const [kelasTerpilih, setKelasTerpilih] = useState<string[]>(tagihan?.targetDetail?.kelas || [])
  const [santriTerpilih, setSantriTerpilih] = useState<string[]>(tagihan?.targetDetail?.santri || [])

  const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const kelasList = ['VII A', 'VII B', 'VIII A', 'VIII B', 'IX A', 'IX B']
  const santriList = ['Ahmad Putra', 'Budi Santoso', 'Citra Dewi', 'Dimas Pratama', 'Eka Saputra', 'Fitri Handayani']

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
              defaultValue={tagihan?.namaTagihan}
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
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">{bulan}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nominal Default *</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="nominal"
                  checked={nominalSama}
                  onChange={() => setNominalSama(true)}
                  className="mr-2"
                />
                <span>Nominal sama untuk semua kelas</span>
              </label>
              {nominalSama && (
                <input
                  type="number"
                  placeholder="Masukkan nominal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="nominal"
                  checked={!nominalSama}
                  onChange={() => setNominalSama(false)}
                  className="mr-2"
                />
                <span>Nominal berbeda per kelas</span>
              </label>
              {!nominalSama && (
                <div className="ml-6 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Kelas</strong></div>
                    <div><strong>Nominal</strong></div>
                  </div>
                  {['VII A', 'VII B', 'VIII A', 'VIII B'].map((kelas) => (
                    <div key={kelas} className="grid grid-cols-2 gap-2">
                      <div className="flex items-center text-sm">{kelas}</div>
                      <input
                        type="number"
                        placeholder="0"
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))}
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
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span>setiap bulan</span>
              </div>
            ) : (
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {/* Buku Kas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buku Kas *</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Pilih Buku Kas</option>
              <option value="Kas SPP">Kas SPP</option>
              <option value="Kas Makan">Kas Makan</option>
              <option value="Kas Ujian">Kas Ujian</option>
              <option value="Kas Perlengkapan">Kas Perlengkapan</option>
            </select>
          </div>

          {/* Target Generate */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Target Generate Tagihan *</label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="target"
                  value="semua"
                  checked={targetGenerate === 'semua'}
                  onChange={(e) => setTargetGenerate(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Semua Santri</div>
                  <div className="text-xs text-gray-500">Generate untuk seluruh santri aktif</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="target"
                  value="kelas"
                  checked={targetGenerate === 'kelas'}
                  onChange={(e) => setTargetGenerate(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Berdasarkan Kelas</div>
                  <div className="text-xs text-gray-500">Pilih kelas tertentu</div>
                </div>
              </label>

              {targetGenerate === 'kelas' && (
                <div className="ml-6 grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded">
                  {kelasList.map((kelas) => (
                    <label key={kelas} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={kelasTerpilih.includes(kelas)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKelasTerpilih([...kelasTerpilih, kelas])
                          } else {
                            setKelasTerpilih(kelasTerpilih.filter(k => k !== kelas))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{kelas}</span>
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="target"
                  value="individu"
                  checked={targetGenerate === 'individu'}
                  onChange={(e) => setTargetGenerate(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Santri Individu</div>
                  <div className="text-xs text-gray-500">Pilih santri tertentu</div>
                </div>
              </label>

              {targetGenerate === 'individu' && (
                <div className="ml-6 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Cari santri..."
                    className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
                  />
                  {santriList.map((santri) => (
                    <label key={santri} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        checked={santriTerpilih.includes(santri)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSantriTerpilih([...santriTerpilih, santri])
                          } else {
                            setSantriTerpilih(santriTerpilih.filter(s => s !== santri))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{santri}</span>
                    </label>
                  ))}
                </div>
              )}
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
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {tagihan ? 'Simpan Perubahan' : 'Tambah Tagihan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Preview Generate
function ModalPreviewGenerate({ tagihan, onClose }: { tagihan: JenisTagihan; onClose: () => void }) {
  // Data dummy santri berdasarkan target
  const getDaftarSantri = () => {
    const allSantri = [
      { nama: 'Ahmad Putra', kelas: 'VII A' },
      { nama: 'Budi Santoso', kelas: 'VII B' },
      { nama: 'Citra Dewi', kelas: 'VIII A' },
      { nama: 'Dimas Pratama', kelas: 'VIII B' },
      { nama: 'Eka Saputra', kelas: 'VII A' },
      { nama: 'Fitri Handayani', kelas: 'IX A' },
      { nama: 'Galih Pradana', kelas: 'VII B' },
      { nama: 'Hani Azizah', kelas: 'VIII A' },
    ]

    if (tagihan.targetGenerate === 'semua') {
      return allSantri
    } else if (tagihan.targetGenerate === 'kelas') {
      return allSantri.filter(s => tagihan.targetDetail?.kelas?.includes(s.kelas))
    } else if (tagihan.targetGenerate === 'individu') {
      return allSantri.filter(s => tagihan.targetDetail?.santri?.includes(s.nama))
    }
    return []
  }

  const daftarSantri = getDaftarSantri()
  const totalTagihan = daftarSantri.length * tagihan.bulan.length

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
              <div><span className="font-semibold">Nominal:</span> {tagihan.nominalDefault === 'Berbeda' ? 'Berbeda per kelas' : `Rp ${tagihan.nominalDefault.toLocaleString('id-ID')}`}</div>
              <div><span className="font-semibold">Bulan:</span> {tagihan.bulan.length} bulan ({tagihan.bulan.slice(0, 3).join(', ')}{tagihan.bulan.length > 3 ? '...' : ''})</div>
              <div><span className="font-semibold">Jatuh Tempo:</span> {tagihan.jatuhTempo}</div>
            </div>
          </div>

          {/* Target Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Target Generate</h3>
            <div className="text-sm text-blue-800">
              {tagihan.targetGenerate === 'semua' && (
                <p>✓ Generate untuk <strong>Semua Santri Aktif</strong></p>
              )}
              {tagihan.targetGenerate === 'kelas' && (
                <div>
                  <p className="mb-1">✓ Generate untuk <strong>Kelas Terpilih</strong>:</p>
                  <p className="ml-4">{tagihan.targetDetail?.kelas?.join(', ')}</p>
                </div>
              )}
              {tagihan.targetGenerate === 'individu' && (
                <div>
                  <p className="mb-1">✓ Generate untuk <strong>Santri Individu</strong>:</p>
                  <p className="ml-4">{tagihan.targetDetail?.santri?.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Daftar Santri yang Akan Dibuatkan Tagihan */}
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
                    <th className="px-4 py-2 text-right">Jumlah Bulan</th>
                    <th className="px-4 py-2 text-right">Total Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {daftarSantri.map((santri, idx) => {
                    const nominal = tagihan.nominalDefault === 'Berbeda'
                      ? tagihan.nominalPerKelas?.find(n => n.kelas === santri.kelas)?.nominal || 0
                      : tagihan.nominalDefault
                    const total = nominal * tagihan.bulan.length

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{santri.nama}</td>
                        <td className="px-4 py-2">{santri.kelas}</td>
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

          {/* Ringkasan */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Ringkasan Generate</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Total santri: <strong>{daftarSantri.length} santri</strong></p>
              <p>• Total bulan: <strong>{tagihan.bulan.length} bulan</strong></p>
              <p>• Total tagihan yang akan dibuat: <strong>{totalTagihan} tagihan</strong></p>
              <p>• Buku Kas: <strong>{tagihan.bukuKas}</strong></p>
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
