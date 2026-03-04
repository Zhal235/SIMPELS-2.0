import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import type { DashboardKpi, TagihanSummaryItem, TrendItem, RecentPaymentItem, KasKeuangan } from '../types/dashboard.types'

export function useDashboardKpi(bulan?: string, tahun?: number) {
  const [data, setData] = useState<DashboardKpi | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (bulan) params.set('bulan', bulan)
    if (tahun) params.set('tahun', String(tahun))
    setLoading(true)
    apiFetch<DashboardKpi>(`/dashboard?${params}`, 'GET')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  return { data, loading }
}

export function useTagihanSummary(bulan?: string, tahun?: number) {
  const [data, setData] = useState<TagihanSummaryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (bulan) params.set('bulan', bulan)
    if (tahun) params.set('tahun', String(tahun))
    setLoading(true)
    apiFetch<{ data: TagihanSummaryItem[] }>(`/dashboard/tagihan-summary?${params}`, 'GET')
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  return { data, loading }
}

export function useDashboardTrend(tahunAjaranId?: number) {
  const [data, setData] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : ''
    setLoading(true)
    apiFetch<{ data: TrendItem[] }>(`/dashboard/trend${params}`, 'GET')
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tahunAjaranId])

  return { data, loading }
}

export function useRecentPayments() {
  const [data, setData] = useState<RecentPaymentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiFetch<{ data: RecentPaymentItem[] }>('/dashboard/recent-payments', 'GET')
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useKasKeuangan(bulan?: string, tahun?: number) {
  const [data, setData] = useState<KasKeuangan | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (bulan) params.set('bulan', bulan)
    if (tahun) params.set('tahun', String(tahun))
    setLoading(true)
    apiFetch<KasKeuangan>(`/dashboard/kas-keuangan?${params}`, 'GET')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  return { data, loading }
}
