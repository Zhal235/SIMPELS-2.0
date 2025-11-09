import api from './index'

export async function listAsrama() {
  const res = await api.get('/v1/kesantrian/asrama')
  return res.data
}

export async function createAsrama(payload: { nama_asrama: string; wali_asrama?: string | null }) {
  const res = await api.post('/v1/kesantrian/asrama', payload)
  return res.data
}

export async function updateAsrama(id: string | number, payload: { nama_asrama: string; wali_asrama?: string | null }) {
  const res = await api.put(`/v1/kesantrian/asrama/${id}`, payload)
  return res.data
}

export async function deleteAsrama(id: string | number) {
  const res = await api.delete(`/v1/kesantrian/asrama/${id}`)
  return res.data
}

export async function tambahAnggotaAsrama(id: string | number, santri_id: string) {
  const res = await api.post(`/v1/kesantrian/asrama/${id}/anggota`, { santri_id })
  return res.data
}

export async function keluarkanAnggotaAsrama(id: string | number, santri_id: string) {
  const res = await api.delete(`/v1/kesantrian/asrama/${id}/anggota/${santri_id}`)
  return res.data
}