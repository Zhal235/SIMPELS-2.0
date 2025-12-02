import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, ArrowDownCircle, ArrowUpCircle, Filter, Calendar, Eye, ArrowRightLeft } from 'lucide-react'
import { listBukuKas, listTransaksiKas, createTransaksiKas, deleteTransaksiKas } from '../../api/bukuKas'
import { listKategoriPengeluaran, createKategoriPengeluaran } from '../../api/kategoriPengeluaran'
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
  kategori_id?: number | null
  kategoriPengeluaran?: { id: number, name: string } | null
  keterangan?: string
  pembayaran_id?: number
  buku_kas?: BukuKas
  created_at: string
}

export default function TransaksiKas() {
  const [transaksiList, setTransaksiList] = useState<TransaksiKas[]>([])
  const [bukuKasList, setBukuKasList] = useState<BukuKas[]>([])
  const [categories, setCategories] = useState<Array<{id:number,name:string}>>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showModalTransfer, setShowModalTransfer] = useState(false)
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
    kategori_id: '',
    nominal: '',
    keterangan: '',
    nama_pemohon: '',
    metode: 'cash' as 'cash' | 'transfer'
  })

  // Form state untuk transfer
  const [transferData, setTransferData] = useState({
    dari_buku_kas_id: '',
    ke_buku_kas_id: '',
    dari_metode: 'cash' as 'cash' | 'transfer',
    ke_metode: 'cash' as 'cash' | 'transfer',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    keterangan: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [transaksiRes, bukuKasRes, kategoriRes] = await Promise.all([
        listTransaksiKas(),
        listBukuKas(),
        listKategoriPengeluaran()
      ])
      
      if (transaksiRes.success) {
        setTransaksiList(transaksiRes.data)
      }
      
      if (bukuKasRes.success) {
        setBukuKasList(bukuKasRes.data)
      }

      if (kategoriRes) {
        setCategories(kategoriRes)
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

      // ensure category exists or create if missing
      let kategoriIdToSend: number | undefined = undefined

      if (formData.kategori_id) {
        kategoriIdToSend = Number(formData.kategori_id)
      } else if (formData.kategori) {
        const found = categories.find(c => c.name.toLowerCase() === formData.kategori.toLowerCase())
        if (found) kategoriIdToSend = found.id
        else {
          // create new category on the fly
          try {
            const created = await createKategoriPengeluaran({ name: formData.kategori })
            if (created) {
              setCategories(prev => [...prev, created])
              kategoriIdToSend = created.id
            }
          } catch (err: any) {
            // ignore — server validation will surface if problem
          }
        }
      }

      const response = await createTransaksiKas({
        buku_kas_id: Number(formData.buku_kas_id),
        tanggal: formData.tanggal,
        jenis: 'pengeluaran',
        metode: formData.metode,
        kategori: formData.kategori,
        kategori_id: kategoriIdToSend,
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
      kategori_id: '',
      nominal: '',
      keterangan: '',
      nama_pemohon: '',
      metode: 'cash'
    })
  }

  const resetTransferForm = () => {
    setTransferData({
      dari_buku_kas_id: '',
      ke_buku_kas_id: '',
      dari_metode: 'cash',
      ke_metode: 'cash',
      tanggal: new Date().toISOString().split('T')[0],
      nominal: '',
      keterangan: ''
    })
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validasi: tidak boleh transfer ke buku kas yang sama dengan metode yang sama
      if (transferData.dari_buku_kas_id === transferData.ke_buku_kas_id && 
          transferData.dari_metode === transferData.ke_metode) {
        toast.error('Tidak bisa transfer ke akun yang sama')
        return
      }

      const nominal = Number(transferData.nominal)
      const tanggal = transferData.tanggal

      // Tentukan label metode
      const dariLabel = transferData.dari_metode === 'cash' ? 'Cash' : 'Bank'
      const keLabel = transferData.ke_metode === 'cash' ? 'Cash' : 'Bank'
      
      const dariBukuKas = bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id))
      const keBukuKas = bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))

      // Check if this is internal transfer (same buku kas, different metode)
      const isInternalTransfer = transferData.dari_buku_kas_id === transferData.ke_buku_kas_id

      if (isInternalTransfer) {
        // Internal transfer: Bank ↔ Cash dalam buku kas yang sama
        // Gunakan kategori khusus agar tidak mengurangi total saldo
        await createTransaksiKas({
          buku_kas_id: Number(transferData.dari_buku_kas_id),
          tanggal: tanggal,
          jenis: 'pengeluaran',
          metode: transferData.dari_metode,
          kategori: 'Transfer Internal (Keluar)',
          nominal: nominal,
          keterangan: `Transfer internal: ${dariLabel} → ${keLabel} - ${transferData.keterangan}`
        })

        await createTransaksiKas({
          buku_kas_id: Number(transferData.ke_buku_kas_id),
          tanggal: tanggal,
          jenis: 'pemasukan',
          metode: transferData.ke_metode,
          kategori: 'Transfer Internal (Masuk)',
          nominal: nominal,
          keterangan: `Transfer internal: ${dariLabel} → ${keLabel} - ${transferData.keterangan}`
        })
      } else {
        // Transfer antar buku kas berbeda
        await createTransaksiKas({
          buku_kas_id: Number(transferData.dari_buku_kas_id),
          tanggal: tanggal,
          jenis: 'pengeluaran',
          metode: transferData.dari_metode,
          kategori: 'Transfer Keluar',
          nominal: nominal,
          keterangan: `Transfer ke ${keBukuKas?.nama_kas} (${keLabel}) - ${transferData.keterangan}`
        })

        await createTransaksiKas({
          buku_kas_id: Number(transferData.ke_buku_kas_id),
          tanggal: tanggal,
          jenis: 'pemasukan',
          metode: transferData.ke_metode,
          kategori: 'Transfer Masuk',
          nominal: nominal,
          keterangan: `Transfer dari ${dariBukuKas?.nama_kas} (${dariLabel}) - ${transferData.keterangan}`
        })
      }

      toast.success('Transfer saldo berhasil!')
      setShowModalTransfer(false)
      resetTransferForm()
      loadData()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Gagal melakukan transfer')
    }
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowModalTransfer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transfer Saldo
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowDownCircle className="w-5 h-5" />
            Tambah Pengeluaran
          </button>
        </div>
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
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        list="kategori-list"
                        type="text"
                        value={formData.kategori}
                        onChange={(e) => {
                            const newVal = e.target.value
                            const found = categories.find(c => c.name.toLowerCase() === newVal.toLowerCase())
                            setFormData({ ...formData, kategori: newVal, kategori_id: found ? String(found.id) : '' })
                          }}
                        placeholder="Contoh: Pembelian ATK, Gaji Pegawai, Listrik, dll"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <datalist id="kategori-list">
                        {categories.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.kategori || formData.kategori.trim() === '') return
                        try {
                          const created = await createKategoriPengeluaran({ name: formData.kategori })
                          if (created) {
                            setCategories(prev => [...prev, created])
                            setFormData(prev => ({ ...prev, kategori_id: String(created.id), kategori: created.name }))
                            toast.success('Kategori pengeluaran berhasil dibuat')
                          }
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || 'Gagal membuat kategori')
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Tambah
                    </button>
                  </div>
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

      {/* Modal Transfer Saldo */}
      {showModalTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transfer Saldo</h2>
                <p className="text-sm text-gray-500 mt-1">Transfer saldo antar kas atau antar metode pembayaran</p>
              </div>
              <button
                onClick={() => {
                  setShowModalTransfer(false)
                  resetTransferForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleTransfer} className="p-6">
              <div className="space-y-6">
                {/* Grid 2 Kolom: Dari dan Ke */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dari Section - Kiri */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4" />
                      Dari (Sumber)
                    </h3>
                    
                    {/* Buku Kas Sumber */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buku Kas <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={transferData.dari_buku_kas_id}
                        onChange={(e) => setTransferData({ ...transferData, dari_buku_kas_id: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Pilih Buku Kas</option>
                        {bukuKasList.map(bk => (
                          <option key={bk.id} value={bk.id}>{bk.nama_kas}</option>
                        ))}
                      </select>
                    </div>

                    {/* Metode Sumber */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dari Akun <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransferData({ ...transferData, dari_metode: 'cash' })}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                            transferData.dari_metode === 'cash'
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          💵 Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferData({ ...transferData, dari_metode: 'transfer' })}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                            transferData.dari_metode === 'transfer'
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          🏦 Bank
                        </button>
                      </div>
                    </div>

                    {/* Saldo Sumber */}
                    {transferData.dari_buku_kas_id && (
                      <div className="p-3 bg-white border border-red-300 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Saldo Tersedia:</p>
                        <p className="text-lg font-bold text-red-700">
                          {formatRupiah(
                            transferData.dari_metode === 'cash'
                              ? bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id))?.saldo_cash || 0
                              : bukuKasList.find(bk => bk.id === Number(transferData.dari_buku_kas_id))?.saldo_bank || 0
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {transferData.dari_metode === 'cash' ? 'Saldo Cash' : 'Saldo Bank'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ke Section - Kanan */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" />
                      Ke (Tujuan)
                    </h3>
                    
                    {/* Buku Kas Tujuan */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buku Kas <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={transferData.ke_buku_kas_id}
                        onChange={(e) => setTransferData({ ...transferData, ke_buku_kas_id: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Pilih Buku Kas</option>
                        {bukuKasList.map(bk => (
                          <option key={bk.id} value={bk.id}>{bk.nama_kas}</option>
                        ))}
                      </select>
                    </div>

                    {/* Metode Tujuan */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ke Akun <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransferData({ ...transferData, ke_metode: 'cash' })}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                            transferData.ke_metode === 'cash'
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          💵 Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferData({ ...transferData, ke_metode: 'transfer' })}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                            transferData.ke_metode === 'transfer'
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          🏦 Bank
                        </button>
                      </div>
                    </div>

                    {/* Saldo Tujuan */}
                    {transferData.ke_buku_kas_id && (
                      <div className="p-3 bg-white border border-green-300 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Saldo Saat Ini:</p>
                        <p className="text-lg font-bold text-green-700">
                          {formatRupiah(
                            transferData.ke_metode === 'cash'
                              ? bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_cash || 0
                              : bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_bank || 0
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {transferData.ke_metode === 'cash' ? 'Saldo Cash' : 'Saldo Bank'}
                        </p>
                        {transferData.nominal && Number(transferData.nominal) > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <p className="text-xs text-gray-600">Saldo Setelah Transfer:</p>
                            <p className="text-sm font-semibold text-green-800">
                              {formatRupiah(
                                (transferData.ke_metode === 'cash'
                                  ? bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_cash || 0
                                  : bukuKasList.find(bk => bk.id === Number(transferData.ke_buku_kas_id))?.saldo_bank || 0
                                ) + Number(transferData.nominal)
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Icon Transfer di tengah atas grid */}
                <div className="flex justify-center -mt-3 -mb-3">
                  <div className="bg-purple-100 p-3 rounded-full border-4 border-white shadow-lg">
                    <ArrowRightLeft className="w-6 h-6 text-purple-600" />
                  </div>
                </div>

                {/* Detail Transfer */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Detail Transfer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={transferData.tanggal}
                        onChange={(e) => setTransferData({ ...transferData, tanggal: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={transferData.nominal}
                        onChange={(e) => setTransferData({ ...transferData, nominal: e.target.value })}
                        placeholder="0"
                        min="0"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {transferData.nominal && (
                        <p className="mt-1 text-sm text-gray-600">
                          {formatRupiah(Number(transferData.nominal))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keterangan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={transferData.keterangan}
                      onChange={(e) => setTransferData({ ...transferData, keterangan: e.target.value })}
                      placeholder="Keterangan transfer..."
                      rows={3}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalTransfer(false)
                    resetTransferForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
