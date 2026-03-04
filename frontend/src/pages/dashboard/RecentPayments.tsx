import Card from '../../components/Card'
import { formatRupiah } from '../../utils/pembayaranHelpers'
import type { RecentPaymentItem } from '../../types/dashboard.types'

type Props = { data: RecentPaymentItem[]; loading: boolean }

const METHOD_LABEL: Record<string, string> = {
  tunai: 'Tunai',
  transfer: 'Transfer',
  epos: 'EPOS',
  wallet: 'Dompet',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RecentPayments({ data, loading }: Props) {
  return (
    <Card title="Pembayaran Terbaru">
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Memuat data...</div>
      ) : !data.length ? (
        <div className="text-center py-10 text-gray-400 text-sm">Belum ada pembayaran</div>
      ) : (
        <ul className="divide-y">
          {data.map((p) => (
            <li key={p.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{p.namaSantri}</p>
                <p className="text-xs text-gray-500 truncate">{p.namaTagihan}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(p.tanggalBayar)} ·{' '}
                  {METHOD_LABEL[p.metodePembayaran] ?? p.metodePembayaran}
                </p>
              </div>
              <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                {formatRupiah(p.nominalBayar)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
