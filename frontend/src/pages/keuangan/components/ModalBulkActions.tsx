import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { JenisTagihanItem } from '../../../types/jenisTagihan.types'
import { bulkDeleteTagihan, bulkUpdateNominalTagihan } from '../../../api/tagihanSantri'

interface Props {
  tagihan: JenisTagihanItem
  onClose: () => void
  onSuccess: () => void
}

export default function ModalBulkActions({ tagihan, onClose, onSuccess }: Props) {
  const [actionType, setActionType] = useState<'delete' | 'update'>('delete')
  const [newNominal, setNewNominal] = useState<number>(tagihan.nominalSama || 0)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`Yakin ingin menghapus SEMUA tagihan "${tagihan.namaTagihan}" yang BELUM DIBAYAR?`)) return
    setIsProcessing(true)
    try {
      const res = await bulkDeleteTagihan({ jenis_tagihan_id: tagihan.id })
      toast.success(res.message || `${res.deleted_count} tagihan berhasil dihapus`)
      onSuccess(); onClose()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal menghapus tagihan') }
    finally { setIsProcessing(false) }
  }

  const handleBulkUpdate = async () => {
    if (!newNominal || newNominal < 0) { toast.error('Nominal harus lebih dari 0'); return }
    if (!confirm(`Yakin mengubah nominal SEMUA tagihan "${tagihan.namaTagihan}" yang BELUM DIBAYAR menjadi Rp ${newNominal.toLocaleString('id-ID')}?`)) return
    setIsProcessing(true)
    try {
      const res = await bulkUpdateNominalTagihan({ jenis_tagihan_id: tagihan.id, nominal_baru: newNominal })
      toast.success(res.message || `${res.updated_count} tagihan berhasil diperbarui`)
      onSuccess(); onClose()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal memperbarui tagihan') }
    finally { setIsProcessing(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Perbaiki Tagihan: {tagihan.namaTagihan}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Perhatian:</strong> Fitur ini hanya berlaku untuk tagihan yang <strong>BELUM DIBAYAR</strong>.
          </div>
          <div className="space-y-3">
            {(['delete','update'] as const).map(type => (
              <label key={type} className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${actionType===type ? (type==='delete'?'border-red-500 bg-red-50':'border-blue-500 bg-blue-50') : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="actionType" value={type} checked={actionType===type} onChange={() => setActionType(type)} className="mt-1 mr-3" />
                <div>
                  <div className={`font-medium ${type==='delete'?'text-red-700':'text-blue-700'}`}>{type==='delete'?'🗑 Hapus Semua Tagihan':'✏️ Update Nominal Massal'}</div>
                  <div className="text-xs text-gray-600 mt-1">{type==='delete'?'Menghapus semua tagihan yang belum dibayar dari jenis ini':'Mengubah nominal semua tagihan yang belum dibayar ke nominal baru'}</div>
                </div>
              </label>
            ))}
          </div>
          {actionType === 'update' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Baru</label>
              <input type="text" placeholder="Masukkan nominal baru" value={newNominal ? newNominal.toLocaleString('id-ID') : ''} onChange={e => setNewNominal(Number(e.target.value.replace(/\./g,'').replace(/\D/g,'')))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
          <button onClick={actionType==='delete' ? handleBulkDelete : handleBulkUpdate} disabled={isProcessing} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${actionType==='delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isProcessing ? 'Memproses...' : actionType==='delete' ? 'Hapus Semua' : 'Update Semua'}
          </button>
        </div>
      </div>
    </div>
  )
}
