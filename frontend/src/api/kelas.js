import api from './index';
export async function listKelas() {
    const res = await api.get('/v1/kesantrian/kelas');
    return res.data;
}
export async function createKelas(data) {
    const res = await api.post('/v1/kesantrian/kelas', data);
    return res.data;
}
export async function updateKelas(id, data) {
    const res = await api.put(`/v1/kesantrian/kelas/${id}`, data);
    return res.data;
}
export async function deleteKelas(id) {
    const res = await api.delete(`/v1/kesantrian/kelas/${id}`);
    return res.data;
}
