import React from 'react'
import Modal from '../Modal'

type PaymentItem = {
  id: number
  status: 'paid' | 'pending'
  amount: number | string
  failure_reason?: string | null
  santri?: {
    nama_santri?: string
    name?: string
  }
}

type PaymentDetail = {
  id: number
  title?: string
  status?: 'active' | 'completed' | 'cancelled'
  total_santri?: number
  amount_per_santri?: number | string
  collected_amount?: number | string
  outstanding_amount?: number | string
  items?: PaymentItem[]
}

type Props = {
  open: boolean
  onClose: () => void
  selectedPayment: PaymentDetail | null
  detailLoading: boolean
  onRetry: (id: number) => void
  onCancel: (id: number) => void
}

export default function CollectivePaymentPreviewModal({
  open,
  onClose,
  selectedPayment,
  detailLoading,
  onRetry,
  onCancel,
}: Props) {
  const paidItems = selectedPayment?.items?.filter(i => i.status === 'paid') || []
  const pendingItems = selectedPayment?.items?.filter(i => i.status === 'pending') || []

  return (
    <Modal open={open} onClose={onClose} title={selectedPayment?.title || 'Detail Tagihan'}>
      {detailLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : selectedPayment ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total Santri</div>
              <div className="font-semibold">{selectedPayment.total_santri}</div>
            </div>
            <div>
              <div className="text-gray-500">Nominal per Santri</div>
              <div className="font-semibold">
                Rp {parseFloat(String(selectedPayment.amount_per_santri || 0)).toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Terkumpul</div>
              <div className="font-semibold text-green-600">
                Rp {parseFloat(String(selectedPayment.collected_amount || 0)).toLocaleString('id-ID')}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Outstanding</div>
              <div className="font-semibold text-yellow-600">
                Rp {parseFloat(String(selectedPayment.outstanding_amount || 0)).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Sudah Bayar ({paidItems.length})</h3>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {paidItems.map(item => (
                <div key={item.id} className="text-sm bg-green-50 p-2 rounded">
                  {item.santri?.nama_santri || item.santri?.name || 'Unknown'} - Rp{' '}
                  {parseFloat(String(item.amount || 0)).toLocaleString('id-ID')}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Belum Bayar ({pendingItems.length})</h3>
              <div className="flex gap-2">
                {pendingItems.length > 0 && selectedPayment.status !== 'cancelled' && (
                  <button onClick={() => onRetry(selectedPayment.id)} className="btn btn-sm btn-primary">
                    Retry
                  </button>
                )}
                {selectedPayment.status !== 'cancelled' && (
                  <button onClick={() => onCancel(selectedPayment.id)} className="btn btn-sm btn-danger">
                    Batalkan
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {pendingItems.map(item => (
                <div key={item.id} className="text-sm bg-yellow-50 p-2 rounded">
                  <div>
                    {item.santri?.nama_santri || item.santri?.name || 'Unknown'} - Rp{' '}
                    {parseFloat(String(item.amount || 0)).toLocaleString('id-ID')}
                  </div>
                  {item.failure_reason && <div className="text-xs text-red-600">{item.failure_reason}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
