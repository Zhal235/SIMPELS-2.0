import api from './index';
export async function listPembayaran(params) {
    const res = await api.get('/v1/keuangan/pembayaran', { params });
    return res.data;
}
export async function getTagihanBySantri(santriId) {
    const res = await api.get(`/v1/keuangan/pembayaran/santri/${santriId}/tagihan`);
    return res.data;
}
export async function getHistoryPembayaran(santriId) {
    const res = await api.get(`/v1/keuangan/pembayaran/santri/${santriId}/history`);
    return res.data;
}
export async function prosesPembayaran(data) {
    const res = await api.post('/v1/keuangan/pembayaran', data);
    return res.data;
}
export async function getPembayaran(id) {
    const res = await api.get(`/v1/keuangan/pembayaran/${id}`);
    return res.data;
}
export async function batalkanPembayaran(id) {
    const res = await api.delete(`/v1/keuangan/pembayaran/${id}`);
    return res.data;
}
