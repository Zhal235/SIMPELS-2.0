import api from './index';
export async function listKategoriPengeluaran(q) {
    const res = await api.get('/v1/keuangan/kategori-pengeluaran', { params: q ? { q } : {} });
    return res.data;
}
export async function createKategoriPengeluaran(data) {
    const res = await api.post('/v1/keuangan/kategori-pengeluaran', data);
    return res.data;
}
