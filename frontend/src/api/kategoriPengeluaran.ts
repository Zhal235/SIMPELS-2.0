import api from './index'

export async function listKategoriPengeluaran(q?: string) {
  const res = await api.get('/v1/keuangan/kategori-pengeluaran', { params: q ? { q } : {} })
  return res.data
}

export async function createKategoriPengeluaran(data: Record<string, any>) {
  const res = await api.post('/v1/keuangan/kategori-pengeluaran', data)
  return res.data
}
