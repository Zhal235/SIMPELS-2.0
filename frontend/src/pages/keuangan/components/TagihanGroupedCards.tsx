import { Printer } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { formatRupiah, isOverdue } from '../../../utils/pembayaranHelpers'
import type { Tagihan, Santri } from '../../../types/pembayaran.types'

interface Props {
  groupedTagihan: { bulan: string; tahun: string; items: Tagihan[] }[]
  selectedTagihan: string[]
  isLunasTab: boolean
  santri: Santri
  onToggle: (id: number | string) => void
  onPrintKwitansi: (data: any) => void
}

export default function TagihanGroupedCards({ groupedTagihan, selectedTagihan, isLunasTab, santri, onToggle, onPrintKwitansi }: Props) {
  if (groupedTagihan.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Tidak ada tagihan di tab ini</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {groupedTagihan.map((group) => {
        const hasOverdue = group.items.some(i => isOverdue(i.tglJatuhTempo, i.bulan, i.tahun) && i.status !== 'lunas')
        return (
          <div key={`${group.bulan}-${group.tahun}`} className={`border rounded-lg overflow-hidden flex flex-col ${hasOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className={`px-4 py-3 border-b ${hasOverdue ? 'bg-gradient-to-r from-red-100 to-red-50 border-red-200' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">{group.bulan} {group.tahun}</h3>
                {hasOverdue && <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded">⚠ Overdue</span>}
              </div>
            </div>
            <div className="divide-y flex-1 overflow-y-auto max-h-64">
              {group.items.map((t) => (
                <div key={t.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {!isLunasTab && (
                        <input type="checkbox" checked={selectedTagihan.includes(String(t.id))} onChange={() => onToggle(t.id)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{t.jenisTagihan}</p>
                          {!isLunasTab && isOverdue(t.tglJatuhTempo, t.bulan, t.tahun) && t.status !== 'lunas' && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded whitespace-nowrap">Overdue</span>
                          )}
                        </div>
                        {!isLunasTab && t.tglJatuhTempo && <p className="text-xs text-gray-500 mt-0.5">Jatuh Tempo: {t.tglJatuhTempo}</p>}
                        {t.tglBayar && (
                          <div className="text-xs text-green-600 mt-1">
                            <p className="font-medium">✓ Dibayar: {new Date(t.tglBayar).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} WIB</p>
                            {t.adminPenerima && <p className="text-gray-600 text-xs mt-0.5">Penerima: {t.adminPenerima}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">{isLunasTab ? formatRupiah(t.jumlahBayar) : formatRupiah(t.nominal)}</p>
                      {t.status === 'sebagian' && (t.sisaBayar ?? 0) > 0 && (
                        <p className={`text-xs mt-1 ${isLunasTab ? 'text-orange-600' : 'text-yellow-600'}`}>Sisa: {formatRupiah(t.sisaBayar)}</p>
                      )}
                      {isLunasTab && t.tglBayar && (
                        <button
                          onClick={() => {
                            const d = new Date(t.tglBayar!)
                            onPrintKwitansi({
                              type: 'lunas', santri, tagihan: [t],
                              totalBayar: t.jumlahBayar || t.nominal, nominalBayar: t.jumlahBayar || t.nominal,
                              admin: t.adminPenerima,
                              tanggal: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric' }),
                              jam: d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' WIB',
                            })
                          }}
                          className="mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 justify-end"
                        >
                          <Printer className="w-3 h-3" /> Print
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 mt-auto flex justify-between items-center">
              <p className="font-semibold text-gray-700 text-xs">Total:</p>
              <p className="font-bold text-base text-blue-600">Rp {(group.items.reduce((s, t) => s + t.nominal, 0) / 1000).toFixed(0)}K</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
