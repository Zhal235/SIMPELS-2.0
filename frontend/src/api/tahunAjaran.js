import api from './index';
export async function listTahunAjaran() {
    const res = await api.get('/v1/akademik/tahun-ajaran');
    return res.data;
}
export async function createTahunAjaran(data) {
    const res = await api.post('/v1/akademik/tahun-ajaran', data);
    return res.data;
}
export async function updateTahunAjaran(id, data) {
    const res = await api.put(`/v1/akademik/tahun-ajaran/${id}`, data);
    return res.data;
}
export async function deleteTahunAjaran(id) {
    const res = await api.delete(`/v1/akademik/tahun-ajaran/${id}`);
    return res.data;
}
export async function getTahunAjaran(id) {
    const res = await api.get(`/v1/akademik/tahun-ajaran/${id}`);
    return res.data;
}
