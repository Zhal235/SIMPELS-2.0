import api from './index'

export async function triggerBackup(email?: string) {
  const res = await api.post('/v1/system/backup', { email })
  return res.data
}
