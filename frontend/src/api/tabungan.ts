import api from './index'

export async function listTabungan(params?: {
  status?: 'aktif' | 'nonaktif'
  kelas_id?: number | string
  asrama_id?: number | string
  search?: string
}) {
  const res = await api.get('/v1/tabungan', { params })
  return res.data
}

export async function getTabungan(santriId: string) {
  const res = await api.get(`/v1/tabungan/${santriId}`)
  return res.data
}

export async function bukaTabungan(payload: {
  santri_id: string
  opened_at: string
  notes?: string
}) {
  const res = await api.post('/v1/tabungan', payload)
  return res.data
}

export async function updateTabungan(santriId: string, payload: { status?: string; notes?: string }) {
  const res = await api.patch(`/v1/tabungan/${santriId}`, payload)
  return res.data
}

export async function setorTabungan(santriId: string, payload: {
  amount: number
  description?: string
  method?: 'cash' | 'transfer'
}) {
  const res = await api.post(`/v1/tabungan/${santriId}/setor`, payload)
  return res.data
}

export async function tarikTabungan(santriId: string, payload: {
  amount: number
  description?: string
  method?: 'cash' | 'transfer'
}) {
  const res = await api.post(`/v1/tabungan/${santriId}/tarik`, payload)
  return res.data
}

export async function getTabunganHistory(santriId: string) {
  const res = await api.get(`/v1/tabungan/${santriId}/history`)
  return res.data
}

export async function getLaporanTabungan() {
  const res = await api.get('/v1/tabungan/laporan/summary')
  return res.data
}
