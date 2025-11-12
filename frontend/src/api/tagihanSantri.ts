import api from './index'

export async function listTagihanSantri() {
  const res = await api.get('/v1/keuangan/tagihan-santri')
  return res.data
}

export async function generateTagihanSantri(jenisTagihanId: number) {
  const res = await api.post('/v1/keuangan/tagihan-santri/generate', {
    jenis_tagihan_id: jenisTagihanId
  })
  return res.data
}

export async function createTunggakan(tunggakan: Array<{
  santri_id: number
  jenis_tagihan_id: number
  bulan: string
  nominal: number
}>) {
  const res = await api.post('/v1/keuangan/tagihan-santri/tunggakan', {
    tunggakan
  })
  return res.data
}

export async function getTagihanSantri(id: string | number) {
  const res = await api.get(`/v1/keuangan/tagihan-santri/${id}`)
  return res.data
}

export async function updateTagihanSantri(id: string | number, data: Record<string, any>) {
  const res = await api.put(`/v1/keuangan/tagihan-santri/${id}`, data)
  return res.data
}

export async function deleteTagihanSantri(id: string | number) {
  const res = await api.delete(`/v1/keuangan/tagihan-santri/${id}`)
  return res.data
}
