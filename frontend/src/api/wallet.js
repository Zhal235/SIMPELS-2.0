import api from './index';
export async function listWallets() {
    const res = await api.get('/v1/wallets');
    return res.data;
}
export async function getWallet(santriId) {
    const res = await api.get(`/v1/wallets/${santriId}`);
    return res.data;
}
export async function topupWallet(santriId, amount, description, method = 'cash') {
    const res = await api.post(`/v1/wallets/${santriId}/topup`, { amount, description, method });
    return res.data;
}
export async function debitWallet(santriId, amount, description, method = 'cash') {
    const res = await api.post(`/v1/wallets/${santriId}/debit`, { amount, description, method });
    return res.data;
}
export async function listWalletTransactions(params) {
    const res = await api.get('/v1/wallets/transactions', { params });
    return res.data;
}
export async function getWalletTransactions(santriId) {
    const res = await api.get(`/v1/wallets/${santriId}/transactions`);
    return res.data;
}
export async function updateTransaction(txnId, payload) {
    const res = await api.put(`/v1/wallets/transactions/${txnId}`, payload);
    return res.data;
}
export async function voidTransaction(txnId) {
    const res = await api.delete(`/v1/wallets/transactions/${txnId}`);
    return res.data;
}
export async function eposTransaction(payload) {
    const res = await api.post('/v1/wallets/epos/transaction', payload);
    return res.data;
}
export async function bindRFID(uid, santriId) {
    const res = await api.post('/v1/wallets/rfid', { uid, santri_id: santriId });
    return res.data;
}
export async function listRFID() {
    const res = await api.get('/v1/wallets/rfid');
    return res.data;
}
export async function unbindRFID(id) {
    const res = await api.delete(`/v1/wallets/rfid/${id}`);
    return res.data;
}
export async function getEposPool() {
    const res = await api.get('/v1/wallets/epos/pool');
    return res.data;
}
export async function createWithdrawal(amount, note) {
    const res = await api.post('/v1/wallets/cash-withdrawal', { amount, note });
    return res.data;
}
export async function listWithdrawals(params) {
    const res = await api.get('/v1/wallets/withdrawals', { params });
    return res.data;
}
export async function createEposWithdrawal(amount, note, requestedBy) {
    const res = await api.post('/v1/wallets/withdrawals', { amount, note, requested_by: requestedBy });
    return res.data;
}
export async function listEposWithdrawals(params) {
    // Get EPOS withdrawals from new endpoint
    const res = await api.get('/v1/wallets/epos/withdrawals', { params });
    return res.data;
}
export async function approveEposWithdrawal(id) {
    const res = await api.put(`/v1/wallets/epos/withdrawal/${id}/approve`);
    return res.data;
}
export async function rejectEposWithdrawal(id, reason) {
    const res = await api.put(`/v1/wallets/epos/withdrawal/${id}/reject`, { reason });
    return res.data;
}
export async function listCashWithdrawals(params) {
    // Cash withdrawals have notes starting with 'CASH_TRANSFER:'
    const res = await api.get('/v1/wallets/withdrawals', { params: { ...params, is_cash: true } });
    return res.data;
}
