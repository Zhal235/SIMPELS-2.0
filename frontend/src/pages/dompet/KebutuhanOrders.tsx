import React, { useEffect, useState, useCallback } from 'react'
import { Package, CheckCircle, XCircle, Clock, RefreshCw, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  listKebutuhanOrders,
  confirmKebutuhanOrder,
  rejectKebutuhanOrder,
  type KebutuhanOrder,
} from '../../api/kebutuhanOrders'
import KebutuhanOrderDetailModal from '../../components/kebutuhan/KebutuhanOrderDetailModal'

const STATUS_CONFIG = {
  pending:   { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected:  { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired:   { label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-600', icon: Clock },
  completed: { label: 'Selesai', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
} as const

const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

export default function KebutuhanOrders() {
  const [orders, setOrders] = useState<KebutuhanOrder[]>([])
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<KebutuhanOrder | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [modal, setModal] = useState<'detail' | 'reject' | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await listKebutuhanOrders({
        status: filterStatus || undefined,
        date_from: filterDate || undefined,
        date_to: filterDate || undefined,
        per_page: 20,
        page,
      })
      if (res.success) {
        setOrders(res.data)
        setMeta(res.meta)
      }
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [filterStatus, filterDate])

  useEffect(() => { load() }, [load])

  async function handleConfirm(order: KebutuhanOrder) {
    if (!confirm(`Konfirmasi pesanan ${order.epos_order_id}?\n\nTotal ${fmt.format(order.total_amount)} akan dipotong dari saldo santri.`)) return
    setProcessing(true)
    try {
      const res = await confirmKebutuhanOrder(order.id)
      if (res.success) { toast.success('Pesanan dikonfirmasi, saldo santri dipotong'); load() }
      else toast.error(res.message || 'Gagal konfirmasi')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Gagal konfirmasi') }
    finally { setProcessing(false) }
  }

  async function handleReject() {
    if (!selectedOrder) return
    setProcessing(true)
    try {
      const res = await rejectKebutuhanOrder(selectedOrder.id, rejectReason)
      if (res.success) { toast.success('Pesanan ditolak'); setModal(null); setRejectReason(''); load() }
      else toast.error(res.message || 'Gagal menolak')
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Gagal menolak') }
    finally { setProcessing(false) }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-teal-600" />
          <h1 className="text-xl font-bold text-gray-800">Pesanan Kebutuhan Santri</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} menunggu
            </span>
          )}
        </div>
        <button onClick={() => load()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="rejected">Ditolak</option>
          <option value="expired">Kedaluwarsa</option>
          <option value="completed">Selesai</option>
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
          placeholder="Filter tanggal"
        />
        {(filterStatus || filterDate) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterDate('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Memuat…</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada pesanan kebutuhan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">No. Pesanan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Dibuat</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.expired
                const StatusIcon = cfg.icon
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      {order.epos_order_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{order.santri_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items.slice(0, 2).map(i => i.name).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2}`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {fmt.format(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedOrder(order); setModal('detail') }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          title="Detail"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button
                              disabled={processing}
                              onClick={() => handleConfirm(order)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              disabled={processing}
                              onClick={() => { setSelectedOrder(order); setModal('reject') }}
                              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${p === meta.current_page ? 'bg-teal-600 text-white' : 'border hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selectedOrder && (
        <KebutuhanOrderDetailModal order={selectedOrder} onClose={() => setModal(null)} onConfirm={() => { setModal(null); handleConfirm(selectedOrder) }} onReject={() => setModal('reject')} />
      )}

      {/* Reject Modal */}
      {modal === 'reject' && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Tolak Pesanan</h3>
            <p className="text-sm text-gray-600">Tolak pesanan <strong>{selectedOrder.epos_order_id}</strong>?</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Alasan penolakan (opsional)"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
              <button disabled={processing} onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {processing ? 'Memproses…' : 'Tolak Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
