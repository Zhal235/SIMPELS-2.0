import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { KebutuhanOrder } from '../../api/kebutuhanOrders'

const STATUS_CONFIG = {
  pending:   { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected:  { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired:   { label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-600', icon: Clock },
  completed: { label: 'Selesai', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
} as const

const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

interface Props {
  order: KebutuhanOrder
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
}

export default function KebutuhanOrderDetailModal({ order, onClose, onConfirm, onReject }: Props) {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.expired
  const StatusIcon = cfg.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-teal-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">Detail Pesanan Kebutuhan</h2>
              <p className="text-teal-100 text-sm font-mono">{order.epos_order_id}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-xl">×</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
            <StatusIcon className="w-4 h-4" /> {cfg.label}
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Santri</p><p className="font-medium">{order.santri_name}</p></div>
            <div><p className="text-gray-500">Dibuat</p><p className="font-medium">{fmtDate(order.created_at)}</p></div>
            <div><p className="text-gray-500">Berlaku sampai</p><p className="font-medium text-orange-600">{fmtDate(order.expired_at)}</p></div>
            {order.confirmed_at && <div><p className="text-gray-500">Dikonfirmasi</p><p className="font-medium">{fmtDate(order.confirmed_at)}</p></div>}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Item yang Dipesan</p>
            <div className="border rounded-xl overflow-hidden">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b last:border-b-0 text-sm">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2 text-xs">{item.qty}× {fmt.format(item.price)}</span>
                  </div>
                  <span className="font-semibold">{fmt.format(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-teal-600 text-white rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="font-bold">Total</span>
            <span className="text-xl font-bold">{fmt.format(order.total_amount)}</span>
          </div>
          {order.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <strong>Alasan penolakan:</strong> {order.rejection_reason}
            </div>
          )}
          {order.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={onReject} className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50">Tolak</button>
              <button onClick={onConfirm} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700">Setujui & Potong Saldo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
