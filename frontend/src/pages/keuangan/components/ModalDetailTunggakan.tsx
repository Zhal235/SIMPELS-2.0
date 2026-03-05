import { X } from 'lucide-react'

const BULAN_MAP: Record<string, number> = {
  Januari:1, Februari:2, Maret:3, April:4, Mei:5, Juni:6,
  Juli:7, Agustus:8, September:9, Oktober:10, November:11, Desember:12,
}

interface TagihanItem {
  id: number
  jenis_tagihan: string | { nama_tagihan: string }
  bulan: string
  tahun: number
  nominal: number
  sisa: number | string
  jatuh_tempo: string
  umur_tunggakan_hari: number
}

interface Props {
  namaLengkap: string
  kelas: string
  tagihan: TagihanItem[]
  onClose: () => void
}

function formatRp(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function umurLabel(hari: number) {
  if (hari < 30) return `${hari} hari`
  if (hari < 365) return `${Math.floor(hari / 30)} bulan`
  return `${Math.floor(hari / 365)} thn ${Math.floor((hari % 365) / 30)} bln`
}

function prioritasColor(hari: number) {
  if (hari > 90) return 'bg-red-100 text-red-700'
  if (hari > 60) return 'bg-orange-100 text-orange-700'
  if (hari > 30) return 'bg-yellow-100 text-yellow-700'
  return 'bg-blue-100 text-blue-700'
}

export default function ModalDetailTunggakan({ namaLengkap, kelas, tagihan, onClose }: Props) {
  const sorted = [...tagihan].sort((a, b) => {
    const av = a.tahun * 100 + (BULAN_MAP[a.bulan] || 0)
    const bv = b.tahun * 100 + (BULAN_MAP[b.bulan] || 0)
    return av - bv
  })
  const totalSisa = sorted.reduce((s, t) => s + Number(t.sisa), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{namaLengkap}</h2>
            <p className="text-sm text-gray-500">{kelas} · {tagihan.length} tagihan tertunggak</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tagihan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Umur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {typeof t.jenis_tagihan === 'string' ? t.jenis_tagihan : t.jenis_tagihan?.nama_tagihan || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.bulan} {t.tahun}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatRp(t.nominal)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{formatRp(Number(t.sisa))}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${prioritasColor(t.umur_tunggakan_hari)}`}>
                      {umurLabel(t.umur_tunggakan_hari)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center rounded-b-xl">
          <span className="text-sm text-gray-600">Total Tunggakan</span>
          <span className="text-lg font-bold text-red-600">{formatRp(totalSisa)}</span>
        </div>
      </div>
    </div>
  )
}
