import api from './index';
export async function listRoles() {
    const res = await api.get('/v1/roles');
    return res.data;
}
export async function createRole(payload) {
    const res = await api.post('/v1/roles', payload);
    return res.data;
}
export async function updateRole(id, payload) {
    const res = await api.put(`/v1/roles/${id}`, payload);
    return res.data;
}
export async function deleteRole(id) {
    const res = await api.delete(`/v1/roles/${id}`);
    return res.data;
}
export default { listRoles, createRole, updateRole, deleteRole };
