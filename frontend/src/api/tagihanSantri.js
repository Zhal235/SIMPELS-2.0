import api from './index';
export async function listTagihanSantri() {
    const res = await api.get('/v1/keuangan/tagihan-santri');
    return res.data;
}
export async function listTagihanBySantri(santriId) {
    const res = await api.get(`/v1/keuangan/tagihan-santri/santri/${santriId}`);
    return res.data;
}
export async function createTagihanSantri(data) {
    const res = await api.post('/v1/keuangan/tagihan-santri', data);
    return res.data;
}
export async function generateTagihanSantri(jenisTagihanId) {
    const res = await api.post('/v1/keuangan/tagihan-santri/generate', {
        jenis_tagihan_id: jenisTagihanId
    });
    return res.data;
}
export async function createTunggakan(tunggakan) {
    const res = await api.post('/v1/keuangan/tagihan-santri/tunggakan', {
        tunggakan
    });
    return res.data;
}
export async function getTagihanSantri(id) {
    const res = await api.get(`/v1/keuangan/tagihan-santri/${id}`);
    return res.data;
}
export async function updateTagihanSantri(id, data) {
    const res = await api.put(`/v1/keuangan/tagihan-santri/${id}`, data);
    return res.data;
}
export async function deleteTagihanSantri(id) {
    const res = await api.delete(`/v1/keuangan/tagihan-santri/${id}`);
    return res.data;
}
