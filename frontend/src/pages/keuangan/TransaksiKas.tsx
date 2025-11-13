import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, ArrowDownCircle, ArrowUpCircle, Filter, Calendar, Eye } from 'lucide-react'
import { listBukuKas, listTransaksiKas, createTransaksiKas, deleteTransaksiKas } from '../../api/bukuKas'
import toast from 'react-hot-toast'

// Helper function untuk format rupiah
const formatRupiah = (nominal: number | undefined | null): string => {
  const value = Number(nominal) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function untuk format tanggal
const formatTanggal = (tanggal: string): string => {
  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Types
type BukuKas = {
  id: number
  nama_kas: string
  saldo_cash: number
  saldo_bank: number
  total_saldo: number
}

type TransaksiKas = {
  id: number
  buku_kas_id: number
  no_transaksi: string
  tanggal: string
  jenis: 'pemasukan' | 'pengeluaran'
  metode: 'cash' | 'transfer'
  kategori: string
  nominal: number
  keterangan?: string
  pembayaran_id?: number
  buku_kas?: BukuKas
  created_at: string
}

export default function TransaksiKas() {
  const [transaksiList, setTransaksiList] = useState<TransaksiKas[]>([])
  const [bukuKasList, setBukuKasList] = useState<BukuKas[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTransaksi, setSelectedTransaksi] = useState<TransaksiKas | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterJenis, setFilterJenis] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all')
  const [filterBukuKas, setFilterBukuKas] = useState<number | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Form state untuk transaksi pengeluaran
  const [formData, setFormData] = useState({
    buku_kas_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: '',
    nominal: '',
    keterangan: '',
    nama_pemohon: '',
    metode: 'cash' as 'cash' | 'transfer'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [transaksiRes, bukuKasRes] = await Promise.all([
        listTransaksiKas(),
        listBukuKas()
      ])
      
      if (transaksiRes.success) {
        setTransaksiList(transaksiRes.data)
      }
      
      if (bukuKasRes.success) {
        setBukuKasList(bukuKasRes.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const keteranganFull = formData.nama_pemohon 
        ? `${formData.keterangan} (Pemohon: ${formData.nama_pemohon})`
        : formData.keterangan

      const response = await createTransaksiKas({
        buku_kas_id: Number(formData.buku_kas_id),
        tanggal: formData.tanggal,
        jenis: 'pengeluaran',
        metode: formData.metode,
        kategori: formData.kategori,
        nominal: Number(formData.nominal),
        keterangan: keteranganFull
      })

      if (response.success) {
        toast.success('Transaksi pengeluaran berhasil dicatat')
        setShowModal(false)
        resetForm()
        loadData()
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Gagal mencatat transaksi')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return

    try {
      const response = await deleteTransaksiKas(id)
      if (response.success) {
        toast.success('Transaksi berhasil dihapus')
        loadData()
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus transaksi')
    }
  }

  const resetForm = () => {
    setFormData({
      buku_kas_id: '',
      tanggal: new Date().toISOString().split('T')[0],
      kategori: '',
      nominal: '',
      keterangan: '',
      nama_pemohon: '',
      metode: 'cash'
    })
  }

  // Filter transaksi
  const filteredTransaksi = transaksiList.filter(t => {
    const matchSearch = searchQuery === '' || 
      t.no_transaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keterangan?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchJenis = filterJenis === 'all' || t.jenis === filterJenis
    const matchBukuKas = filterBukuKas === 'all' || t.buku_kas_id === filterBukuKas
    
    let matchDate = true
    if (startDate && endDate) {
      const transaksiDate = new Date(t.tanggal)
      const start = new Date(startDate)
      const end = new Date(endDate)
      matchDate = transaksiDate >= start && transaksiDate <= end
    }

    return matchSearch && matchJenis && matchBukuKas && matchDate
  }).sort((a, b) => {
    // Sort by created_at descending (terbaru di atas)
    // Jika created_at sama, sort by id descending
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    
    if (dateB !== dateA) {
      return dateB - dateA
    }
    
    // Jika tanggal sama, urutkan berdasarkan id (yang lebih besar = lebih baru)
    return b.id - a.id
  })

  // Hitung total
  const totalPemasukan = filteredTransaksi
    .filter(t => t.jenis === 'pemasukan')
    .reduce((sum, t) => sum + Number(t.nominal), 0)

  const totalPengeluaran = filteredTransaksi
    .filter(t => t.jenis === 'pengeluaran')
    .reduce((sum, t) => sum + Number(t.nominal), 0)

  const saldo = totalPemasukan - totalPengeluaran

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Kas</h1>
          <p className="text-gray-600 mt-1">Kelola transaksi kas masuk dan keluar</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Tambah Pengeluaran
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(totalPemasukan)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowDownCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatRupiah(saldo)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${saldo >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <svg className={`w-8 h-8 ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari no transaksi, kategori, keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Jenis */}
          <div>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>

          {/* Filter Buku Kas */}
          <div>
            <select
              value={filterBukuKas}
              onChange={(e) => setFilterBukuKas(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Buku Kas</option>
              {bukuKasList.map(bk => (
                <option key={bk.id} value={bk.id}>{bk.nama_kas}</option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Dari"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Sampai"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buku Kas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metode
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nominal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 text-gray-400 mb-3" />
                      <p>Tidak ada data transaksi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((transaksi) => (
                  <tr key={transaksi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{transaksi.no_transaksi}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTanggal(transaksi.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaksi.buku_kas?.nama_kas || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaksi.jenis === 'pemasukan' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaksi.jenis === 'pemasukan' ? (
                          <ArrowUpCircle className="w-3 h-3" />
                        ) : (
                          <ArrowDownCircle className="w-3 h-3" />
                        )}
                        {transaksi.jenis === 'pemasukan' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaksi.kategori}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        transaksi.metode === 'cash' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transaksi.metode === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                      transaksi.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaksi.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(transaksi.nominal)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {transaksi.keterangan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTransaksi(transaksi)
                            setShowPreview(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Preview transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!transaksi.pembayaran_id ? (
                          <button
                            onClick={() => handleDelete(transaksi.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400" title="Transaksi dari pembayaran">
                            🔒
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {filteredTransaksi.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredTransaksi.length} dari {transaksiList.length} transaksi
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Pengeluaran */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Tambah Transaksi Pengeluaran</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Buku Kas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buku Kas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.buku_kas_id}
                    onChange={(e) => setFormData({ ...formData, buku_kas_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Buku Kas</option>
                    {bukuKasList.map(bk => (
                      <option key={bk.id} value={bk.id}>{bk.nama_kas}</option>
                    ))}
                  </select>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Kategori Pengeluaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    placeholder="Contoh: Pembelian ATK, Gaji Pegawai, Listrik, dll"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                    placeholder="0"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.nominal && (
                    <p className="mt-1 text-sm text-gray-600">
                      {formatRupiah(Number(formData.nominal))}
                    </p>
                  )}
                </div>

                {/* Nama Pemohon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pemohon
                  </label>
                  <input
                    type="text"
                    value={formData.nama_pemohon}
                    onChange={(e) => setFormData({ ...formData, nama_pemohon: e.target.value })}
                    placeholder="Nama orang yang mengajukan pengeluaran"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, metode: 'cash' })}
                      className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                        formData.metode === 'cash'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, metode: 'transfer' })}
                      className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                        formData.metode === 'transfer'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      🏦 Transfer
                    </button>
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Detail keterangan pengeluaran..."
                    rows={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Transaksi */}
      {showPreview && selectedTransaksi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedTransaksi(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Nomor Transaksi */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-500">No. Transaksi</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedTransaksi.no_transaksi}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    selectedTransaksi.jenis === 'pemasukan' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedTransaksi.jenis === 'pemasukan' ? (
                      <ArrowUpCircle className="w-4 h-4" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4" />
                    )}
                    {selectedTransaksi.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tanggal</p>
                    <p className="font-medium text-gray-900">{formatTanggal(selectedTransaksi.tanggal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Buku Kas</p>
                    <p className="font-medium text-gray-900">{selectedTransaksi.buku_kas?.nama_kas || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Kategori</p>
                    <p className="font-medium text-gray-900">{selectedTransaksi.kategori}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Metode</p>
                    <p className="font-medium text-gray-900">
                      {selectedTransaksi.metode === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                    </p>
                  </div>
                </div>

                {/* Nominal */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm text-gray-500 mb-1">Nominal</p>
                  <p className={`text-3xl font-bold ${
                    selectedTransaksi.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTransaksi.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(selectedTransaksi.nominal)}
                  </p>
                </div>

                {/* Keterangan */}
                {selectedTransaksi.keterangan && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Keterangan</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border">{selectedTransaksi.keterangan}</p>
                  </div>
                )}

                {/* Status Pembayaran */}
                {selectedTransaksi.pembayaran_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      🔒 Transaksi ini terkait dengan pembayaran santri (ID: {selectedTransaksi.pembayaran_id})
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400">
                    Dicatat pada: {new Date(selectedTransaksi.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedTransaksi(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white font-medium"
              >
                Tutup
              </button>
              {!selectedTransaksi.pembayaran_id && (
                <button
                  onClick={() => {
                    setShowPreview(false)
                    setSelectedTransaksi(null)
                    handleDelete(selectedTransaksi.id)
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Transaksi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
