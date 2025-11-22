import api from './index';
export async function getWalletSettings() {
    const res = await api.get('/v1/wallets/settings');
    return res.data;
}
export async function getAllSantriWithLimits() {
    const res = await api.get('/v1/wallets/settings/santri/all');
    return res.data;
}
export async function updateGlobalMinBalance(minBalance) {
    const res = await api.put('/v1/wallets/settings/global', { min_balance: minBalance });
    return res.data;
}
export async function setSantriDailyLimit(santriId, dailyLimit) {
    const res = await api.put(`/v1/wallets/settings/santri/${santriId}`, { daily_limit: dailyLimit });
    return res.data;
}
export async function bulkUpdateSantriLimits(limits) {
    const res = await api.put('/v1/wallets/settings/santri/bulk', { limits });
    return res.data;
}
export async function deleteSantriLimit(santriId) {
    const res = await api.delete(`/v1/wallets/settings/santri/${santriId}`);
    return res.data;
}
export default { getWalletSettings, getAllSantriWithLimits, updateGlobalMinBalance, setSantriDailyLimit, bulkUpdateSantriLimits, deleteSantriLimit };
