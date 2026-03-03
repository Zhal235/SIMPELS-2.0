import { Calendar, User, X } from 'lucide-react'
import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'
import { formatRupiah } from '../../../utils/pembayaranHelpers'

interface Props {
  santri: TagihanSantriRow
  onClose: () => void
}

const STATUS_BADGE: Record<string, string> = {
  lunas: 'bg-green-100 text-green-800',
  sebagian: 'bg-yellow-100 text-yellow-800',
  belum_bayar: 'bg-red-100 text-red-800',
}
const STATUS_LABEL: Record<string, string> = {
  lunas: 'Lunas', sebagian: 'Sebagian', belum_bayar: 'Belum Bayar',
}

export default function ModalDetailTagihan({ santri, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Tagihan Santri</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-600" /><span className="font-medium text-gray-900">{santri.santri_nama}</span></div>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">Kelas: <span className="font-medium">{santri.kelas}</span></span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border"><p className="text-sm text-gray-600 mb-1">Total Tagihan</p><p className="text-xl font-bold text-gray-900">{formatRupiah(santri.total_tagihan)}</p></div>
            <div className="bg-white rounded-lg p-4 border border-green-200"><p className="text-sm text-gray-600 mb-1">Total Dibayar</p><p className="text-xl font-bold text-green-600">{formatRupiah(santri.total_dibayar)}</p></div>
            <div className="bg-white rounded-lg p-4 border border-red-200"><p className="text-sm text-gray-600 mb-1">Sisa Tagihan</p><p className="text-xl font-bold text-red-600">{formatRupiah(santri.sisa_tagihan)}</p></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {['No', 'Jenis Tagihan', 'Periode', 'Nominal', 'Dibayar', 'Sisa', 'Status', 'Jatuh Tempo'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${['Nominal','Dibayar','Sisa'].includes(h) ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {santri.detail_tagihan.map((d, idx) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{d.jenis_tagihan}</td>
                  <td className="px-4 py-3 text-gray-600"><div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{d.bulan} {d.tahun}</div></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatRupiah(d.nominal)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{formatRupiah(d.dibayar)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{formatRupiah(d.sisa)}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[d.status] || ''}`}>{STATUS_LABEL[d.status] || d.status}</span></td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{d.jatuh_tempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t bg-gray-50">
          <button onClick={onClose} className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">Tutup</button>
        </div>
      </div>
    </div>
  )
}
