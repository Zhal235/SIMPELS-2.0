import api from './index'

export async function createMutasiKeluar(payload: Record<string, any>) {
  const res = await api.post('/v1/kesantrian/mutasi-keluar', payload)
  return res.data
}

export async function listMutasiKeluar() {
  const res = await api.get('/v1/kesantrian/mutasi-keluar')
  return res.data
}
