import api from './index'

export async function debugUser() {
  const res = await api.get('/debug/user')
  return res.data
}

export const debugUserInfo = debugUser