import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { listTahunAjaran, createTahunAjaran, updateTahunAjaran, deleteTahunAjaran } from '../../api/tahunAjaran'
import toast from 'react-hot-toast'

interface TahunAjaran {
  id: number
  nama_tahun_ajaran: string
  tanggal_mulai: string
  bulan_mulai: string
  tahun_mulai: number
  tanggal_akhir: string
  bulan_akhir: string
  tahun_akhir: number
  status: 'aktif' | 'tidak_aktif'
}

export default function TahunAjaran() {
  const [dataTahunAjaran, setDataTahunAjaran] = useState<TahunAjaran[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<TahunAjaran | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await listTahunAjaran()
      setDataTahunAjaran(res.data || res || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data tahun ajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (tahunAjaran: TahunAjaran) => {
    setSelectedTahunAjaran(tahunAjaran)
    setShowConfirmModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTahunAjaran) return

    try {
      await deleteTahunAjaran(selectedTahunAjaran.id)
      setDataTahunAjaran(dataTahunAjaran.filter(item => item.id !== selectedTahunAjaran.id))
      toast.success('Tahun ajaran berhasil dihapus!')
      setShowConfirmModal(false)
      setSelectedTahunAjaran(null)
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Gagal menghapus tahun ajaran')
    }
  }

  const handleEdit = (tahunAjaran: TahunAjaran) => {
    setSelectedTahunAjaran(tahunAjaran)
    setShowModal(true)
  }

  const handleAdd = () => {
    setSelectedTahunAjaran(null)
    setShowModal(true)
  }

  const handleSave = async (data: TahunAjaran) => {
    try {
      if (selectedTahunAjaran) {
        // Edit
        const response = await updateTahunAjaran(selectedTahunAjaran.id, data)
        setDataTahunAjaran(dataTahunAjaran.map(item =>
          item.id === selectedTahunAjaran.id ? response.data : item
        ))
        toast.success('Tahun ajaran berhasil diperbarui!')
      } else {
        // Add new
        const response = await createTahunAjaran(data)
        setDataTahunAjaran([...dataTahunAjaran, response.data])
        toast.success('Tahun ajaran berhasil ditambahkan!')
      }
      setShowModal(false)
      setSelectedTahunAjaran(null)
    } catch (error: any) {
      console.error('Error saving:', error)
      const errorMessage = error.response?.data?.message || 'Gagal menyimpan tahun ajaran'
      toast.error(errorMessage)
    }
  }

  const getBulanNama = (nomorBulan: string) => {
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const index = parseInt(nomorBulan) - 1
    return bulan[index] || nomorBulan
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tahun Ajaran</h1>
          <p className="text-gray-600 mt-1">Kelola data tahun ajaran sekolah</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Tambah Tahun Ajaran
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Tahun Ajaran</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Akhir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : dataTahunAjaran.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data tahun ajaran
                  </td>
                </tr>
              ) : (
                dataTahunAjaran.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.nama_tahun_ajaran}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.tanggal_mulai} {getBulanNama(item.bulan_mulai)} {item.tahun_mulai}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.tanggal_akhir} {getBulanNama(item.bulan_akhir)} {item.tahun_akhir}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'aktif'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
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

      {/* Modal Form */}
      {showModal && (
        <ModalFormTahunAjaran
          tahunAjaran={selectedTahunAjaran}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedTahunAjaran(null)
          }}
        />
      )}

      {/* Modal Konfirmasi Delete */}
      {showConfirmModal && selectedTahunAjaran && (
        <ModalConfirmDelete
          nama={selectedTahunAjaran.nama_tahun_ajaran}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowConfirmModal(false)
            setSelectedTahunAjaran(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Form
function ModalFormTahunAjaran({
  tahunAjaran,
  onSave,
  onClose
}: {
  tahunAjaran: TahunAjaran | null
  onSave: (data: TahunAjaran) => void
  onClose: () => void
}) {
  const [namaTahunAjaran, setNamaTahunAjaran] = useState(tahunAjaran?.nama_tahun_ajaran || '')
  const [tanggalMulai, setTanggalMulai] = useState(tahunAjaran?.tanggal_mulai || '')
  const [bulanMulai, setBulanMulai] = useState(tahunAjaran?.bulan_mulai || '')
  const [tahunMulai, setTahunMulai] = useState(tahunAjaran?.tahun_mulai || new Date().getFullYear())
  const [tanggalAkhir, setTanggalAkhir] = useState(tahunAjaran?.tanggal_akhir || '')
  const [bulanAkhir, setBulanAkhir] = useState(tahunAjaran?.bulan_akhir || '')
  const [tahunAkhir, setTahunAkhir] = useState(tahunAjaran?.tahun_akhir || new Date().getFullYear())
  const [status, setStatus] = useState<'aktif' | 'tidak_aktif'>(tahunAjaran?.status || 'tidak_aktif')

  // Convert dari tanggal/bulan/tahun ke format YYYY-MM-DD untuk date input
  const getDateInputValue = (tanggal: string | number, bulan: string | number, tahun: string | number) => {
    if (!tanggal || !bulan || !tahun) return ''
    const paddedBulan = String(bulan).padStart(2, '0')
    const paddedTanggal = String(tanggal).padStart(2, '0')
    return `${tahun}-${paddedBulan}-${paddedTanggal}`
  }

  // Convert dari format YYYY-MM-DD ke tanggal/bulan/tahun
  const parseDateInput = (dateString: string): { tanggal: string; bulan: string; tahun: number } => {
    if (!dateString) return { tanggal: '', bulan: '', tahun: 0 }
    const [tahun, bulan, tanggal] = dateString.split('-')
    return {
      tanggal: String(Number(tanggal)),
      bulan: String(Number(bulan)),
      tahun: Number(tahun)
    }
  }

  const handleTanggalMulaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInput(e.target.value)
    setTanggalMulai(parsed.tanggal)
    setBulanMulai(parsed.bulan)
    setTahunMulai(parsed.tahun)
  }

  const handleTanggalAkhirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInput(e.target.value)
    setTanggalAkhir(parsed.tanggal)
    setBulanAkhir(parsed.bulan)
    setTahunAkhir(parsed.tahun)
  }

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

  const handleSubmit = () => {
    if (!namaTahunAjaran || !tanggalMulai || !bulanMulai || !tanggalAkhir || !bulanAkhir) {
      toast.error('Semua field harus diisi')
      return
    }

    const data: TahunAjaran = {
      id: tahunAjaran?.id || 0,
      nama_tahun_ajaran: namaTahunAjaran,
      tanggal_mulai: tanggalMulai,
      bulan_mulai: bulanMulai,
      tahun_mulai: tahunMulai,
      tanggal_akhir: tanggalAkhir,
      bulan_akhir: bulanAkhir,
      tahun_akhir: tahunAkhir,
      status
    }

    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {tahunAjaran ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nama Tahun Ajaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tahun Ajaran *</label>
            <input
              type="text"
              placeholder="Contoh: 2024/2025"
              value={namaTahunAjaran}
              onChange={(e) => setNamaTahunAjaran(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
            <input
              type="date"
              value={getDateInputValue(tanggalMulai, bulanMulai, tahunMulai)}
              onChange={handleTanggalMulaiChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir *</label>
            <input
              type="date"
              value={getDateInputValue(tanggalAkhir, bulanAkhir, tahunAkhir)}
              onChange={handleTanggalAkhirChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="aktif"
                  checked={status === 'aktif'}
                  onChange={(e) => setStatus(e.target.value as 'aktif')}
                  className="mr-2"
                />
                Aktif
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="tidak_aktif"
                  checked={status === 'tidak_aktif'}
                  onChange={(e) => setStatus(e.target.value as 'tidak_aktif')}
                  className="mr-2"
                />
                Tidak Aktif
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
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
            {tahunAjaran ? 'Simpan Perubahan' : 'Tambah Tahun Ajaran'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Konfirmasi Delete
function ModalConfirmDelete({
  nama,
  onConfirm,
  onCancel
}: {
  nama: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Hapus Tahun Ajaran</h3>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-medium">Anda yakin ingin menghapus?</p>
              <p className="text-gray-600 text-sm mt-1">
                Tahun ajaran <strong>"{nama}"</strong> akan dihapus secara permanen dan tidak dapat dipulihkan.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
