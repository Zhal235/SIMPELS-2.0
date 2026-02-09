import api from './index'

export async function getGraduationPreview() {
  const res = await api.get('/v1/akademik/transition/graduation-preview')
  return res.data
}

export async function processGraduation() {
  const res = await api.post('/v1/akademik/transition/graduate')
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
