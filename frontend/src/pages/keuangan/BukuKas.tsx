import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { listBukuKas, createBukuKas, updateBukuKas, deleteBukuKas, listTransaksiKas } from '../../api/bukuKas'
import { hasAccess } from '../../stores/useAuthStore'
import ModalLaporanBukuKas from './components/ModalLaporanBukuKas'
import ModalFormBukuKas from './components/ModalFormBukuKas'
import ModalDeleteBukuKas from './components/ModalDeleteBukuKas'
import type { BukuKasItem } from './components/bukuKas.types'

export default function BukuKas() {
  const [dataBukuKas, setDataBukuKas] = useState<BukuKasItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showLaporanModal, setShowLaporanModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedKas, setSelectedKas] = useState<BukuKasItem | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await listBukuKas()
      const kasData: BukuKasItem[] = res.data || res || []
      await Promise.all(kasData.map(async (kas) => {
        try {
          const tr = await listTransaksiKas({ buku_kas_id: kas.id })
          kas.transaksi = tr.data || []
        } catch {
          kas.transaksi = []
        }
      }))
      setDataBukuKas(kasData)
    } catch {
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
      toast.error(error.response?.data?.message || 'Gagal menghapus data')
    }
  }

  const handleEdit = (kas: BukuKasItem) => { setSelectedKas(kas); setShowFormModal(true) }
  const handleDelete = (kas: BukuKasItem) => { setSelectedKas(kas); setShowDeleteModal(true) }
  const handleShowLaporan = (kas: BukuKasItem) => { setSelectedKas(kas); setShowLaporanModal(true) }

  const totalSemuaCash = dataBukuKas.reduce((sum, kas) => sum + kas.saldo_cash, 0)
  const totalSemuaBank = dataBukuKas.reduce((sum, kas) => sum + kas.saldo_bank, 0)
  const totalSemuaSaldo = totalSemuaCash + totalSemuaBank

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buku Kas</h1>
          <p className="text-gray-600 mt-1">Kelola catatan buku kas dan saldo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Saldo Cash', val: totalSemuaCash, color: 'blue', sub: 'Dari semua buku kas' },
          { label: 'Total Saldo Bank', val: totalSemuaBank, color: 'purple', sub: 'Dari semua buku kas' },
          { label: 'Total Semua Saldo', val: totalSemuaSaldo, color: 'green', sub: 'Cash + Bank' },
        ].map(({ label, val, color, sub }) => (
          <div key={label} className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>Rp {val.toLocaleString('id-ID')}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Halaman ini hanya untuk <strong>melihat saldo dan laporan</strong> buku kas. Untuk melakukan transaksi, gunakan menu <strong>Transaksi Kas</strong>.
      </div>

      {hasAccess('keuangan.buku-kas.edit') && (
        <div className="flex justify-end">
          <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Buku Kas
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {['No', 'Nama Kas', 'Pemasukan', 'Pengeluaran', 'Saldo Cash', 'Saldo Bank', 'Total Saldo', 'Aksi'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${['Pemasukan','Pengeluaran','Saldo Cash','Saldo Bank','Total Saldo'].includes(h) ? 'text-right' : h === 'Aksi' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : dataBukuKas.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Tidak ada data buku kas</td></tr>
              ) : dataBukuKas.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{idx + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.nama_kas}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">Rp {item.total_pemasukan.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">Rp {item.total_pengeluaran.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">Rp {item.saldo_cash.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">Rp {item.saldo_bank.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">Rp {item.total_saldo.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleShowLaporan(item)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Laporan</button>
                      {hasAccess('keuangan.buku-kas.edit') && (
                        <button onClick={() => handleEdit(item)} className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm">Edit</button>
                      )}
                      {hasAccess('keuangan.buku-kas.delete') && (
                        <button onClick={() => handleDelete(item)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showLaporanModal && selectedKas && (
        <ModalLaporanBukuKas kas={selectedKas} onClose={() => { setShowLaporanModal(false); setSelectedKas(null) }} />
      )}
      {showFormModal && (
        <ModalFormBukuKas kas={selectedKas} onClose={() => { setShowFormModal(false); setSelectedKas(null) }} onSave={handleSave} />
      )}
      {showDeleteModal && selectedKas && (
        <ModalDeleteBukuKas kasNama={selectedKas.nama_kas} onConfirm={handleConfirmDelete} onCancel={() => { setShowDeleteModal(false); setSelectedKas(null) }} />
      )}
    </div>
  )
}
