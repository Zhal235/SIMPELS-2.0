import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, User, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api'

interface DataCorrection {
  id: number
  santri_id: string
  santri_nama: string
  field_name: string
  old_value: string
  new_value: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_by: string
  admin_note: string | null
  approved_by: number | null
  approved_at: string | null
  created_at: string
}

export default function KoreksiDataSantri() {
  const [corrections, setCorrections] = useState<DataCorrection[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedCorrection, setSelectedCorrection] = useState<DataCorrection | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadCorrections()
  }, [filterStatus])

  const loadCorrections = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/data-corrections', {
        params: { status: filterStatus === 'all' ? undefined : filterStatus }
      })
      const dataArray = response.data.data || []
      setCorrections(dataArray)
    } catch (error: any) {
      console.error('Load corrections error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      toast.error(error.response?.data?.message || 'Gagal memuat data')
      setCorrections([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number, note: string) => {
    setProcessing(true)
    try {
      const response = await api.post(`/admin/data-corrections/${id}/approve`, {
        admin_note: note
      })
      toast.success(response.data.message || 'Koreksi berhasil disetujui')
      setShowModal(false)
      setSelectedCorrection(null)
      setAdminNote('')
      loadCorrections()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui koreksi')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (id: number, note: string) => {
    if (!note.trim()) {
      toast.error('Alasan penolakan harus diisi')
      return
    }
    
    setProcessing(true)
    try {
      const response = await api.post(`/admin/data-corrections/${id}/reject`, {
        admin_note: note
      })
      toast.success(response.data.message || 'Koreksi berhasil ditolak')
      setShowModal(false)
      setSelectedCorrection(null)
      setAdminNote('')
      loadCorrections()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak koreksi')
    } finally {
      setProcessing(false)
    }
  }

  const openModal = (correction: DataCorrection) => {
    setSelectedCorrection(correction)
    setAdminNote(correction.admin_note || '')
    setShowModal(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock className="h-4 w-4" /> Pending
        </span>
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
          <CheckCircle className="h-4 w-4" /> Disetujui
        </span>
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
          <XCircle className="h-4 w-4" /> Ditolak
        </span>
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Koreksi Data Santri</h1>
        <p className="text-gray-600 mt-1">Review dan setujui permintaan koreksi data dari wali santri</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                filterStatus === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                filterStatus === 'approved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Disetujui
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                filterStatus === 'rejected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ditolak
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                filterStatus === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Semua
            </button>
          </nav>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Memuat data...</p>
        </div>
      ) : !corrections || corrections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada data koreksi</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Santri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai Lama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai Baru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {corrections.map((correction) => (
                <tr key={correction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        {correction.santri_nama}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {correction.field_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {correction.old_value || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-blue-600">
                      {correction.new_value}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(correction.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(correction.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openModal(correction)}
                      className="text-blue-600 hover:text-blue-900 font-medium text-sm flex items-center gap-1 ml-auto"
                    >
                      <Eye className="h-4 w-4" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedCorrection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detail Koreksi Data</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Santri</label>
                  <p className="text-gray-900 font-semibold">{selectedCorrection.santri_nama}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field yang Dikoreksi</label>
                  <p className="text-gray-900 font-semibold">{selectedCorrection.field_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Lama</label>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedCorrection.old_value || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Baru (Usulan)</label>
                    <p className="text-blue-600 font-semibold bg-blue-50 p-3 rounded">{selectedCorrection.new_value}</p>
                  </div>
                </div>

                {selectedCorrection.note && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan dari Wali</label>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedCorrection.note}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedCorrection.status)}
                </div>

                {selectedCorrection.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan Admin {selectedCorrection.status === 'pending' ? '(opsional untuk approve)' : ''}
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                      placeholder={selectedCorrection.status === 'pending' 
                        ? 'Tambahkan catatan...' 
                        : 'Alasan penolakan (wajib)'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {selectedCorrection.admin_note && selectedCorrection.status !== 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Admin</label>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedCorrection.admin_note}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                {selectedCorrection.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedCorrection.id, adminNote)}
                      disabled={processing}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReject(selectedCorrection.id, adminNote)}
                      disabled={processing}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      Tolak
                    </button>
                  </>
                ) : null}
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedCorrection(null)
                    setAdminNote('')
                  }}
                  className="ml-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
