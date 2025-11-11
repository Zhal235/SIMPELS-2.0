import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { listBukuKas, createBukuKas, updateBukuKas, deleteBukuKas } from '../../api/bukuKas'

interface TransaksiKas {
  id: number
  tanggal: string
  jenis: 'pemasukan' | 'pengeluaran'
  kategori: string
  keterangan: string
  metode: 'cash' | 'transfer'
  nominal: number
}

interface BukuKas {
  id: number
  nama_kas: string
  saldo_cash: number
  saldo_bank: number
  total_saldo: number
  total_pemasukan: number
  total_pengeluaran: number
  transaksi: TransaksiKas[]
}

export default function BukuKas() {
  const [dataBukuKas, setDataBukuKas] = useState<BukuKas[]>([])
  const [loading, setLoading] = useState(false)
  const [showLaporanModal, setShowLaporanModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedKas, setSelectedKas] = useState<BukuKas | null>(null)

  // Fetch data dari API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await listBukuKas()
      setDataBukuKas(res.data || res || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data buku kas')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedKas(null)
    setShowFormModal(true)
  }

  const handleSave = async (data: any) => {
    try {
      if (selectedKas) {
        await updateBukuKas(selectedKas.id, data)
        toast.success('Buku kas berhasil diupdate')
      } else {
        await createBukuKas(data)
        toast.success('Buku kas berhasil ditambahkan')
      }
      setShowFormModal(false)
      setSelectedKas(null)
      fetchData()
    } catch (error: any) {
      console.error('Error saving:', error)
      toast.error(error.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedKas) return
    try {
      await deleteBukuKas(selectedKas.id)
      toast.success('Buku kas berhasil dihapus')
      setShowDeleteModal(false)
      setSelectedKas(null)
      fetchData()
    } catch (error: any) {
      console.error('Error deleting:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus data')
    }
  }

  const handleEdit = (kas: BukuKas) => {
    setSelectedKas(kas)
    setShowFormModal(true)
  }

  const handleDelete = (kas: BukuKas) => {
    setSelectedKas(kas)
    setShowDeleteModal(true)
  }

  const handleShowLaporan = (kas: BukuKas) => {
    setSelectedKas(kas)
    setShowLaporanModal(true)
  }

  // Hitung total keseluruhan
  const totalSemuaCash = dataBukuKas.reduce((sum, kas) => sum + kas.saldo_cash, 0)
  const totalSemuaBank = dataBukuKas.reduce((sum, kas) => sum + kas.saldo_bank, 0)
  const totalSemuaSaldo = totalSemuaCash + totalSemuaBank

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buku Kas</h1>
          <p className="text-gray-600 mt-1">Kelola catatan buku kas dan saldo</p>
        </div>
      </div>

      {/* Summary Cards Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Saldo Cash</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalSemuaCash.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-500 mt-1">Dari semua buku kas</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Saldo Bank</p>
              <p className="text-2xl font-bold text-gray-900">Rp {totalSemuaBank.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-500 mt-1">Dari semua buku kas</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Semua Saldo</p>
              <p className="text-2xl font-bold text-green-600">Rp {totalSemuaSaldo.toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-500 mt-1">Cash + Bank</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informasi</p>
            <p>Halaman ini hanya untuk <strong>melihat saldo dan laporan</strong> buku kas. Untuk melakukan transaksi, gunakan menu <strong>Transaksi Kas</strong>.</p>
          </div>
        </div>
      </div>

      {/* Tombol Tambah */}
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Buku Kas
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Kas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pemasukan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pengeluaran</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Cash</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Bank</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Saldo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : dataBukuKas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data buku kas
                  </td>
                </tr>
              ) : (
                dataBukuKas.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{item.nama_kas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-green-600 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Rp {item.total_pemasukan.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-red-600 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Rp {item.total_pengeluaran.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      Rp {item.saldo_cash.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      Rp {item.saldo_bank.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-lg text-blue-600">
                        Rp {item.total_saldo.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleShowLaporan(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Laporan
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
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

      {/* Modal Laporan */}
      {showLaporanModal && selectedKas && (
        <ModalLaporan
          kas={selectedKas}
          onClose={() => {
            setShowLaporanModal(false)
            setSelectedKas(null)
          }}
        />
      )}

      {/* Modal Form */}
      {showFormModal && (
        <ModalForm
          kas={selectedKas}
          onClose={() => {
            setShowFormModal(false)
            setSelectedKas(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Modal Delete */}
      {showDeleteModal && selectedKas && (
        <ModalDelete
          kasNama={selectedKas.nama_kas}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedKas(null)
          }}
        />
      )}
    </div>
  )
}

// Modal Laporan Transaksi
function ModalLaporan({
  kas,
  onClose
}: {
  kas: BukuKas
  onClose: () => void
}) {
  const getJenisBadge = (jenis: string) => {
    return jenis === 'pemasukan' 
      ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Pemasukan</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Pengeluaran</span>
  }

  const getMetodeBadge = (metode: string) => {
    return metode === 'cash'
      ? <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Cash</span>
      : <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Transfer</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Laporan Transaksi</h2>
              <p className="text-gray-600 mt-1">{kas.nama_kas}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
              <p className="text-lg font-bold text-green-600">Rp {kas.total_pemasukan.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
              <p className="text-lg font-bold text-red-600">Rp {kas.total_pengeluaran.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Saldo Cash</p>
              <p className="text-lg font-bold text-gray-900">Rp {kas.saldo_cash.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-1">Saldo Bank</p>
              <p className="text-lg font-bold text-gray-900">Rp {kas.saldo_bank.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Saldo</p>
              <p className="text-lg font-bold text-blue-600">Rp {kas.total_saldo.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Table Transaksi */}
        <div className="flex-1 overflow-y-auto p-6">
          {kas.transaksi.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Metode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kas.transaksi.map((trx, idx) => (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(trx.tanggal).toLocaleDateString('id-ID', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-3">{getJenisBadge(trx.jenis)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{trx.kategori}</td>
                    <td className="px-4 py-3 text-gray-600">{trx.keterangan}</td>
                    <td className="px-4 py-3 text-center">{getMetodeBadge(trx.metode)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${trx.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                        {trx.jenis === 'pemasukan' ? '+' : '-'} Rp {trx.nominal.toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

// Modal Form (Tambah/Edit)
function ModalForm({
  kas,
  onClose,
  onSave
}: {
  kas: BukuKas | null
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [namaKas, setNamaKas] = useState(kas?.nama_kas || '')
  const [saldoCash, setSaldoCash] = useState(kas?.saldo_cash || 0)
  const [saldoBank, setSaldoBank] = useState(kas?.saldo_bank || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nama_kas: namaKas,
      saldo_cash_awal: saldoCash,
      saldo_bank_awal: saldoBank
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">
            {kas ? 'Edit Buku Kas' : 'Tambah Buku Kas'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Buku Kas *
            </label>
            <input
              type="text"
              value={namaKas}
              onChange={(e) => setNamaKas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contoh: Kas SPP"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Cash Awal
            </label>
            <input
              type="number"
              value={saldoCash}
              onChange={(e) => setSaldoCash(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Bank Awal
            </label>
            <input
              type="number"
              value={saldoBank}
              onChange={(e) => setSaldoBank(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {kas ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Delete Confirmation
function ModalDelete({
  kasNama,
  onConfirm,
  onCancel
}: {
  kasNama: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Hapus Buku Kas</h3>
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
                Buku kas <strong>"{kasNama}"</strong> akan dihapus secara permanen.
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
