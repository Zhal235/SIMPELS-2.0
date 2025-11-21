import api from './index';
// Gunakan endpoint versi baru yang konsisten dengan modul Kesantrian
export async function listSantri(page = 1, perPage = 10, q) {
    const params = { page, perPage };
    if (q && q.length >= 2) params.q = q;
    const res = await api.get('/v1/kesantrian/santri', { params });
    return res.data;
}
export async function createSantri(formData) {
    const isFD = typeof FormData !== 'undefined' && formData instanceof FormData;
    const res = await api.post('/v1/kesantrian/santri', formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return res.data;
}
export async function updateSantri(id, formData) {
    const isFD = typeof FormData !== 'undefined' && formData instanceof FormData;
    const res = await api.post(`/v1/kesantrian/santri/${id}?_method=PUT`, formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return res.data;
}
export async function deleteSantri(id) {
    const res = await api.delete(`/v1/kesantrian/santri/${id}`);
    return res.data;
}
