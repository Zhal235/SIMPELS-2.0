import api from './index';
export async function listJenisTagihan() {
    const res = await api.get('/v1/keuangan/jenis-tagihan');
    return res.data;
}
export async function createJenisTagihan(data) {
    const res = await api.post('/v1/keuangan/jenis-tagihan', data);
    return res.data;
}
export async function updateJenisTagihan(id, data) {
    const res = await api.put(`/v1/keuangan/jenis-tagihan/${id}`, data);
    return res.data;
}
export async function deleteJenisTagihan(id) {
    const res = await api.delete(`/v1/keuangan/jenis-tagihan/${id}`);
    return res.data;
}
export async function getJenisTagihan(id) {
    const res = await api.get(`/v1/keuangan/jenis-tagihan/${id}`);
    return res.data;
}
