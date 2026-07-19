import api from './index'

export async function getGraduationPreview() {
  const res = await api.get('/v1/akademik/transition/graduation-preview')
  return res.data
}

export async function processGraduation() {
  const res = await api.post('/v1/akademik/transition/graduate')
  return res.data
}

export async function processGraduationWithDate(payload: { tanggal_kelulusan: string; konfirmasi: boolean; expected_jumlah: number }) {
  const res = await api.post('/v1/akademik/transition/graduate', payload)
  return res.data
}

export async function revokeGraduation(payload: { santri_id?: string; santri_ids?: string[] }) {
  const res = await api.post('/v1/akademik/transition/revoke-graduation', payload)
  return res.data
}

export async function getPromotionPreview() {
  const res = await api.get('/v1/akademik/transition/promotion-preview')
  return res.data
}

export async function processPromotion(mapping: any[]) {
  const res = await api.post('/v1/akademik/transition/promote', { mapping })
  return res.data
}
