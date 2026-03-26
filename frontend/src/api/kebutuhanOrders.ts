import api from './index'

export interface KebutuhanOrderItem {
  name: string
  qty: number
  price: number
  subtotal: number
  unit?: string
}

export interface KebutuhanOrder {
  id: number
  epos_order_id: string
  santri_id: number
  santri_name: string
  items: KebutuhanOrderItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'completed'
  confirmed_by: 'wali' | 'admin' | null
  confirmed_at: string | null
  expired_at: string
  rejection_reason: string | null
  created_at: string
}

export interface KebutuhanOrdersParams {
  status?: string
  santri_id?: number | string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

export async function listKebutuhanOrders(params?: KebutuhanOrdersParams) {
  const res = await api.get('/v1/admin/kebutuhan-orders', { params })
  return res.data
}

export async function confirmKebutuhanOrder(orderId: number) {
  const res = await api.post(`/v1/admin/kebutuhan-orders/${orderId}/confirm`)
  return res.data
}

export async function rejectKebutuhanOrder(orderId: number, reason?: string) {
  const res = await api.post(`/v1/admin/kebutuhan-orders/${orderId}/reject`, {
    rejection_reason: reason ?? 'Ditolak oleh admin',
  })
  return res.data
}
