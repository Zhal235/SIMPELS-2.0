import api from './index';
export async function listUsers() {
    const res = await api.get('/v1/users');
    return res.data;
}
export async function createUser(payload) {
    const res = await api.post('/v1/users', payload);
    return res.data;
}
export async function updateUser(id, payload) {
    const res = await api.put(`/v1/users/${id}`, payload);
    return res.data;
}
export async function deleteUser(id) {
    const res = await api.delete(`/v1/users/${id}`);
    return res.data;
}
export default { listUsers, updateUser, deleteUser, createUser };
