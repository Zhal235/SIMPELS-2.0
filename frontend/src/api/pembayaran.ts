import api from './index'

export async function listPembayaran(params?: Record<string, any>) {
  const res = await api.get('/v1/keuangan/pembayaran', { params })
  return res.data
}

export async function getTagihanBySantri(santriId: string | number) {
  const res = await api.get(`/v1/keuangan/pembayaran/santri/${santriId}/tagihan`)
  return res.data
}

export async function getHistoryPembayaran(santriId: string | number) {
  const res = await api.get(`/v1/keuangan/pembayaran/santri/${santriId}/history`)
  return res.data
}

export async function prosesPembayaran(data: Record<string, any>) {
  const res = await api.post('/v1/keuangan/pembayaran', data)
  return res.data
}

export async function getPembayaran(id: string | number) {
  const res = await api.get(`/v1/keuangan/pembayaran/${id}`)
  return res.data
}

export async function batalkanPembayaran(id: string | number) {
  const res = await api.delete(`/v1/keuangan/pembayaran/${id}`)
  return res.data
}
