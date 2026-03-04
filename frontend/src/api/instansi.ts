import api from './index'

export interface InstansiSetting {
  id: number
  nama_yayasan: string
  nama_pesantren: string
  alamat: string | null
  telp: string | null
  email: string | null
  website: string | null
  kop_surat_path: string | null
  kop_surat_url: string | null
}

export async function getInstansiSetting(): Promise<InstansiSetting> {
  const res = await api.get('/v1/instansi')
  return res.data.data
}

export async function updateInstansiSetting(data: Partial<InstansiSetting>) {
  const res = await api.put('/v1/instansi', data)
  return res.data
}

export async function uploadKopSurat(file: File) {
  const form = new FormData()
  form.append('kop_surat', file)
  const res = await api.post('/v1/instansi/upload-kop', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteKopSurat() {
  const res = await api.delete('/v1/instansi/kop-surat')
  return res.data
}
