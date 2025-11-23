import api from './index'

export async function getSummary(params = {}) {
  const res = await api.get('/v1/keuangan/reports/summary', { params })
  return res.data || res
}

export async function getExpensesByCategory(params = {}) {
  const res = await api.get('/v1/keuangan/reports/expenses-by-category', { params })
  return res.data || res
}

export default { getSummary, getExpensesByCategory }
