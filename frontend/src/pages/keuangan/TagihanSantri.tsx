import { useState, useEffect } from 'react'
import { Search, Eye, DollarSign, User, CheckCircle, XCircle, Plus, Edit } from 'lucide-react'
import { listTagihanSantri } from '../../api/tagihanSantri'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'
import type { TagihanSantriRow } from '../../types/tagihanSantri.types'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import ModalDetailTagihan from './components/ModalDetailTagihan'
import ModalTambahTunggakan from './components/ModalTambahTunggakan'
import ModalEditNominal from './components/ModalEditNominal'
import ModalBulkDeleteTagihan from './components/ModalBulkDeleteTagihan'

export default function TagihanSantri() {
  const [dataTagihan, setDataTagihan] = useState<TagihanSantriRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTunggakanModal, setShowTunggakanModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<TagihanSantriRow | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState({ total_santri: 0, total_tagihan: 0, total_dibayar: 0, total_sisa: 0 })
  const PAGE_SIZE = 25
  const canEditTagihan = hasAccess('keuangan.tagihan.edit')
  const canDeleteTagihan = hasAccess('keuangan.tagihan.delete')

  const fetchData = async (page = currentPage) => {
    try {
      setLoading(true)
      const res = await listTagihanSantri({ page, perPage: PAGE_SIZE, include_detail: false, q: searchTerm })
      const payload = res && Array.isArray(res.data) ? res : (res?.data || res)
      const rows = Array.isArray(payload?.data) ? payload.data : []
      setDataTagihan(rows)
      setTotalItems(Number(payload?.total || rows.length || 0))
      setSummary(payload?.summary || { total_santri: 0, total_tagihan: 0, total_dibayar: 0, total_sisa: 0 })
    } catch { toast.error('Gagal memuat data tagihan'); setDataTagihan([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData(1) }, [searchTerm])
  useEffect(() => { fetchData(currentPage) }, [currentPage])

  const lastPage = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(currentPage, lastPage)
  const totalTagihan = summary.total_tagihan
  const totalDibayar = summary.total_dibayar
  const totalSisa = summary.total_sisa

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tagihan Santri</h1>
          <p className="text-gray-600 mt-1">Daftar rekap tagihan per santri</p>
        </div>
        {(canEditTagihan || canDeleteTagihan) && (
          <div className="flex gap-2">
            {canEditTagihan && (
              <>
                <button onClick={() => setShowEditModal(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  <Edit className="w-4 h-4" /> Edit Nominal Manual
                </button>
                <button onClick={() => setShowTunggakanModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Tambah Tunggakan Manual
                </button>
              </>
            )}
            {canDeleteTagihan && (
              <button onClick={() => setShowBulkDeleteModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                <XCircle className="w-4 h-4" /> Bulk Hapus Tagihan
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Tagihan', value: totalTagihan, color: 'blue', Icon: DollarSign },
          { label: 'Sudah Dibayar', value: totalDibayar, color: 'green', Icon: CheckCircle },
          { label: 'Sisa Tagihan', value: totalSisa, color: 'red', Icon: XCircle },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className={`bg-white rounded-lg shadow p-4 border-l-4 border-${color}-500`}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">{label}</p><p className="text-2xl font-bold text-gray-900">{formatRupiah(value)}</p></div>
              <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}><Icon className={`w-6 h-6 text-${color}-600`} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Cari nama santri atau kelas..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                {['No', 'Nama Santri', 'Kelas', 'Total Tagihan', 'Total Dibayar', 'Sisa Tagihan', 'Aksi'].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${['Total Tagihan','Total Dibayar','Sisa Tagihan'].includes(h) ? 'text-right' : h === 'Aksi' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : dataTagihan.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada data tagihan</td></tr>
              ) : dataTagihan.map((item, idx) => (
                <tr key={item.santri_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-900">{item.santri_nama}</span></div></td>
                  <td className="px-6 py-4 text-gray-600">{item.kelas}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatRupiah(item.total_tagihan)}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">{formatRupiah(item.total_dibayar)}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">{formatRupiah(item.sisa_tagihan)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => { setSelectedSantri(item); setShowDetailModal(true) }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      <Eye className="w-4 h-4" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">Menampilkan {(safePage-1)*PAGE_SIZE+1}–{Math.min(safePage*PAGE_SIZE,totalItems)} dari {totalItems} santri</p>
            <div className="flex items-center gap-1">
              <button className="btn btn-sm" onClick={() => setCurrentPage(1)} disabled={safePage===1}>«</button>
              <button className="btn btn-sm" onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={safePage===1}>‹</button>
              {Array.from({length:Math.min(5,lastPage)},(_,i)=>{
                const start=Math.max(1,Math.min(safePage-2,lastPage-4)); const p=start+i
                return <button key={p} className={`btn btn-sm min-w-[2rem] ${p===safePage?'btn-primary':''}`} onClick={()=>setCurrentPage(p)}>{p}</button>
              })}
              <button className="btn btn-sm" onClick={() => setCurrentPage(p=>Math.min(lastPage,p+1))} disabled={safePage===lastPage}>›</button>
              <button className="btn btn-sm" onClick={() => setCurrentPage(lastPage)} disabled={safePage===lastPage}>»</button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedSantri && <ModalDetailTagihan santri={selectedSantri} onClose={() => { setShowDetailModal(false); setSelectedSantri(null) }} canDelete={canDeleteTagihan} onRefresh={() => fetchData(currentPage)} />}
      {showTunggakanModal && <ModalTambahTunggakan dataTagihan={dataTagihan} onClose={() => setShowTunggakanModal(false)} onSuccess={() => { setShowTunggakanModal(false); fetchData() }} />}
      {showEditModal && <ModalEditNominal dataTagihan={dataTagihan} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); fetchData() }} />}
      {showBulkDeleteModal && <ModalBulkDeleteTagihan dataTagihan={dataTagihan} onClose={() => setShowBulkDeleteModal(false)} onSuccess={() => { setShowBulkDeleteModal(false); fetchData() }} />}
    </div>
  )
}