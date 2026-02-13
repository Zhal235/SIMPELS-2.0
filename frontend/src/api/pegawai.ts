import api from './index'

export interface Pegawai {
  id: number
  nama_pegawai: string
  nip?: string
  nuptk?: string
  nik?: string
  gelar_depan?: string
  gelar_belakang?: string
  jenis_kelamin?: 'L' | 'P'
  tempat_lahir?: string
  tanggal_lahir?: string
  alamat?: string
  no_hp?: string
  email?: string
  jenis_pegawai: string
  status_kepegawaian: string
  tanggal_mulai_tugas?: string
  jabatan?: string | any[] // Support both string and array for multiple jabatan
  pendidikan_terakhir?: string
  foto_profil?: string
  status_pernikahan?: string
  nama_ibu_kandung?: string
}

export const getPegawai = async (params?: any) => {
  const response = await api.get('/v1/kepegawaian/pegawai', { params })
  return response.data
}

export const getPegawaiDetail = async (id: number) => {
  const response = await api.get(`/v1/kepegawaian/pegawai/${id}`)
  return response.data
}

export const createPegawai = async (data: any) => {
  // Remove Content-Type header untuk FormData agar axios set otomatis
  const config = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {}
  const response = await api.post('/v1/kepegawaian/pegawai', data, config)
  return response.data
}

export const updatePegawai = async (id: number, data: any) => {
  // Laravel cannot handle multipart/form-data via PUT directly
  if (data instanceof FormData) {
    if (!data.has('_method')) data.append('_method', 'PUT')
    // Remove Content-Type header untuk FormData agar axios set otomatis
    const response = await api.post(`/v1/kepegawaian/pegawai/${id}`, data, {
      headers: { 'Content-Type': undefined }
    })
    return response.data
  }
  const response = await api.put(`/v1/kepegawaian/pegawai/${id}`, data)
  return response.data
}

export const deletePegawai = async (id: number) => {
  const response = await api.delete(`/v1/kepegawaian/pegawai/${id}`)
  return response.data
}
