import api from './index';
export async function listBukuKas() {
    const res = await api.get('/v1/keuangan/buku-kas');
    return res.data;
}
export async function getBukuKas(id) {
    const res = await api.get(`/v1/keuangan/buku-kas/${id}`);
    return res.data;
}
export async function createBukuKas(data) {
    const res = await api.post('/v1/keuangan/buku-kas', data);
    return res.data;
}
export async function updateBukuKas(id, data) {
    const res = await api.put(`/v1/keuangan/buku-kas/${id}`, data);
    return res.data;
}
export async function deleteBukuKas(id) {
    const res = await api.delete(`/v1/keuangan/buku-kas/${id}`);
    return res.data;
}
// Transaksi Kas
export async function listTransaksiKas(filters) {
    const res = await api.get('/v1/keuangan/transaksi-kas', { params: filters });
    return res.data;
}
export async function getTransaksiKasByBukuKas(bukuKasId) {
    const res = await api.get(`/v1/keuangan/transaksi-kas?buku_kas_id=${bukuKasId}`);
    return res.data;
}
export async function getTransaksiKas(id) {
    const res = await api.get(`/v1/keuangan/transaksi-kas/${id}`);
    return res.data;
}
export async function createTransaksiKas(data) {
    const res = await api.post('/v1/keuangan/transaksi-kas', data);
    return res.data;
}
export async function deleteTransaksiKas(id) {
    const res = await api.delete(`/v1/keuangan/transaksi-kas/${id}`);
    return res.data;
}
