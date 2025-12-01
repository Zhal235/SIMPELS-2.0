import api from './index'

// Gunakan endpoint versi baru yang konsisten dengan modul Kesantrian
export async function listSantri(page: number = 1, perPage: number = 10) {
  const res = await api.get('/v1/kesantrian/santri', { params: { page, perPage } })
  return res.data
}

export async function createSantri(formData: FormData | Record<string, any>) {
  const isFD = typeof FormData !== 'undefined' && formData instanceof FormData
  const res = await api.post('/v1/kesantrian/santri', formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
  return res.data
}

export async function updateSantri(id: string | number, formData: FormData | Record<string, any>) {
  const isFD = typeof FormData !== 'undefined' && formData instanceof FormData
  const res = await api.post(`/v1/kesantrian/santri/${id}?_method=PUT`, formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
  return res.data
}

export async function deleteSantri(id: string | number) {
  const res = await api.delete(`/v1/kesantrian/santri/${id}`)
  return res.data
}

export async function getSantri(id: string | number) {
  const res = await api.get(`/v1/kesantrian/santri/${id}`)
  return res.data
}

export async function downloadTemplate() {
  const res = await api.get('/v1/kesantrian/santri/template', {
    responseType: 'blob',
  })
  return res.data
}

export async function exportSantri() {
  const res = await api.get('/v1/kesantrian/santri/export', {
    responseType: 'blob',
  })
  return res.data
}

export async function importSantri(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/v1/kesantrian/santri/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}