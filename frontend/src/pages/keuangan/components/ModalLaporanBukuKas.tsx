import { formatRupiah } from '../../../utils/pembayaranHelpers'
import type { BukuKasItem } from './bukuKas.types'

function JenisBadge({ jenis }: { jenis: string }) {
  return jenis === 'pemasukan'
    ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Pemasukan</span>
    : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Pengeluaran</span>
}

function MetodeBadge({ metode }: { metode: string }) {
  return metode === 'cash'
    ? <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Cash</span>
    : <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Transfer</span>
}

type Props = { kas: BukuKasItem; onClose: () => void }

export default function ModalLaporanBukuKas({ kas, onClose }: Props) {
  const sorted = [...(kas.transaksi ?? [])].sort((a, b) => {
    const diff = new Date(b.created_at ?? b.tanggal).getTime() - new Date(a.created_at ?? a.tanggal).getTime()
    return diff !== 0 ? diff : b.id - a.id
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-blue-50 flex justify-between items-start">
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

        <div className="p-6 bg-gray-50 border-b grid grid-cols-5 gap-4">
          {[
            { label: 'Total Pemasukan', val: kas.total_pemasukan, cls: 'text-green-600' },
            { label: 'Total Pengeluaran', val: kas.total_pengeluaran, cls: 'text-red-600' },
            { label: 'Saldo Cash', val: kas.saldo_cash, cls: 'text-gray-900' },
            { label: 'Saldo Bank', val: kas.saldo_bank, cls: 'text-gray-900' },
            { label: 'Total Saldo', val: kas.total_saldo, cls: 'text-blue-600', border: true },
          ].map(({ label, val, cls, border }) => (
            <div key={label} className={`bg-white rounded-lg p-4 border ${border ? 'border-blue-200' : ''}`}>
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className={`text-lg font-bold ${cls}`}>{formatRupiah(val)}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Belum ada transaksi</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {['No', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Metode', 'Operator', 'Nominal'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((trx, idx) => (
                  <tr key={trx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3"><JenisBadge jenis={trx.jenis} /></td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{trx.kategori}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{trx.keterangan}</td>
                    <td className="px-4 py-3"><MetodeBadge metode={trx.metode} /></td>
                    <td className="px-4 py-3 text-sm">
                      {trx.author?.name
                        ? <span className="font-medium text-gray-700">{trx.author.name}</span>
                        : <span className="text-gray-400 text-xs">System</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${trx.jenis === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                        {trx.jenis === 'pemasukan' ? '+' : '-'} {formatRupiah(trx.nominal)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button onClick={onClose} className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
