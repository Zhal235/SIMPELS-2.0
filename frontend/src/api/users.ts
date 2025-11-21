import api from './index'

export async function listUsers() {
  const res = await api.get('/v1/users')
  return res.data
}

export async function updateUser(id: string | number, payload: any) {
  const res = await api.put(`/v1/users/${id}`, payload)
  return res.data
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(`/v1/users/${id}`)
  return res.data
}

export default { listUsers, updateUser, deleteUser }
