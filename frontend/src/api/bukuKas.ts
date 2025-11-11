import api from './index'

export async function listBukuKas() {
  const res = await api.get('/v1/keuangan/buku-kas')
  return res.data
}

export async function createBukuKas(data: Record<string, any>) {
  const res = await api.post('/v1/keuangan/buku-kas', data)
  return res.data
}

export async function getBukuKas(id: string | number) {
  const res = await api.get(`/v1/keuangan/buku-kas/${id}`)
  return res.data
}

export async function updateBukuKas(id: string | number, data: Record<string, any>) {
  const res = await api.put(`/v1/keuangan/buku-kas/${id}`, data)
  return res.data
}

export async function deleteBukuKas(id: string | number) {
  const res = await api.delete(`/v1/keuangan/buku-kas/${id}`)
  return res.data
}
