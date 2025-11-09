import api from './index';
export async function listSantri(page = 1, perPage = 10) {
    const res = await api.get('/santri', { params: { page, perPage } });
    return res.data;
}
export async function createSantri(formData) {
    const isFD = typeof FormData !== 'undefined' && formData instanceof FormData;
    const res = await api.post('/santri', formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return res.data;
}
export async function updateSantri(id, formData) {
    const isFD = typeof FormData !== 'undefined' && formData instanceof FormData;
    const res = await api.post(`/santri/${id}?_method=PUT`, formData, isFD ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return res.data;
}
export async function deleteSantri(id) {
    const res = await api.delete(`/santri/${id}`);
    return res.data;
}
