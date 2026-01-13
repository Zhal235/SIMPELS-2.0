import api from './index'

export async function listWallets() {
  const res = await api.get('/v1/wallets')
  return res.data
}

export async function getWallet(santriId: string | number) {
  const res = await api.get(`/v1/wallets/${santriId}`)
  return res.data
}

export async function topupWallet(santriId: string | number, amount: number, description?: string, method: 'cash' | 'transfer' = 'cash') {
  const res = await api.post(`/v1/wallets/${santriId}/topup`, { amount, description, method })
  return res.data
}

export async function debitWallet(santriId: string | number, amount: number, description?: string, method: 'cash' | 'transfer' = 'cash') {
  const res = await api.post(`/v1/wallets/${santriId}/debit`, { amount, description, method })
  return res.data
}

export async function listWalletTransactions(params?: any) {
  const res = await api.get('/v1/wallets/transactions', { params })
  return res.data
}

export async function getWalletTransactions(santriId: string | number) {
  const res = await api.get(`/v1/wallets/${santriId}/transactions`)
  return res.data
}

export async function updateTransaction(txnId: string | number, payload: { amount: number, description?: string, method?: string, type?: string }) {
  const res = await api.put(`/v1/wallets/transactions/${txnId}`, payload)
  return res.data
}

export async function voidTransaction(txnId: string | number) {
  const res = await api.delete(`/v1/wallets/transactions/${txnId}`)
  return res.data
}

export async function eposTransaction(payload: { uid?: string, santri_id?: number | string, amount: number, epos_txn_id?: string, meta?: any }) {
  const res = await api.post('/v1/wallets/epos/transaction', payload)
  return res.data
}

export async function bindRFID(uid: string, santriId: number | string) {
  const res = await api.post('/v1/wallets/rfid', { uid, santri_id: santriId })
  return res.data
}

export async function listRFID() {
  const res = await api.get('/v1/wallets/rfid')
  return res.data
}

export async function unbindRFID(id: string | number) {
  const res = await api.delete(`/v1/wallets/rfid/${id}`)
  return res.data
}

export async function getEposPool() {
  const res = await api.get('/v1/wallets/epos/pool')
  return res.data
}

export async function createWithdrawal(amount: number, note?: string) {
  const res = await api.post('/v1/wallets/cash-withdrawal', { amount, note })
  return res.data
}

export async function listWithdrawals(params?: any) {
  const res = await api.get('/v1/wallets/withdrawals', { params })
  return res.data
}

export async function createEposWithdrawal(amount: number, note?: string, requestedBy?: string) {
  const res = await api.post('/v1/wallets/withdrawals', { amount, note, requested_by: requestedBy })
  return res.data
}

export async function listEposWithdrawals(params?: any) {
  // Get EPOS withdrawals from new endpoint
  const res = await api.get('/v1/wallets/epos/withdrawals', { params })
  return res.data
}

export async function approveEposWithdrawal(id: number | string, paymentMethod: 'cash' | 'transfer') {
  const res = await api.put(`/v1/wallets/epos/withdrawal/${id}/approve`, { payment_method: paymentMethod })
  return res.data
}

export async function rejectEposWithdrawal(id: number | string, reason: string) {
  const res = await api.put(`/v1/wallets/epos/withdrawal/${id}/reject`, { reason })
  return res.data
}

export async function listCashWithdrawals(params?: any) {
  // Cash withdrawals have notes starting with 'CASH_TRANSFER:'
  const res = await api.get('/v1/wallets/withdrawals', { params: { ...params, is_cash: true } })
  return res.data
}

export async function getBalances() {
  const res = await api.get('/v1/wallets/balances')
  return res.data
}

// Collective Payments
export async function listCollectivePayments() {
  const res = await api.get('/v1/wallets/collective-payments')
  return res.data
}

export async function getCollectivePayment(id: number | string) {
  const res = await api.get(`/v1/wallets/collective-payments/${id}`)
  return res.data
}

export async function createCollectivePayment(payload: {
  title: string
  description?: string
  amount_per_santri: number
  target_type: 'individual' | 'class' | 'all'
  class_id?: number
  santri_ids?: string[]
}) {
  const res = await api.post('/v1/wallets/collective-payments', payload)
  return res.data
}

export async function retryCollectivePayment(id: number | string) {
  const res = await api.post(`/v1/wallets/collective-payments/${id}/retry`)
  return res.data
}
