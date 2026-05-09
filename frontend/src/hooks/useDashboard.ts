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
  const [dataRutin, setDataRutin] = useState<TagihanSummaryItem[]>([])
  const [dataNonRutin, setDataNonRutin] = useState<TagihanSummaryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    
    // Fetch Rutin (dengan filter bulan/tahun)
    const rutinParams = new URLSearchParams()
    rutinParams.set('kategori', 'Rutin')
    if (bulan) rutinParams.set('bulan', bulan)
    if (tahun) rutinParams.set('tahun', String(tahun))
    
    // Fetch Non-Rutin (tanpa filter bulan/tahun, keseluruhan)
    const nonRutinParams = new URLSearchParams()
    nonRutinParams.set('kategori', 'Non Rutin')
    
    Promise.all([
      apiFetch<{ data: TagihanSummaryItem[] }>(`/dashboard/tagihan-summary?${rutinParams}`, 'GET'),
      apiFetch<{ data: TagihanSummaryItem[] }>(`/dashboard/tagihan-summary?${nonRutinParams}`, 'GET'),
    ])
      .then(([resRutin, resNonRutin]) => {
        setDataRutin(resRutin.data ?? [])
        setDataNonRutin(resNonRutin.data ?? [])
      })
      .catch(() => {
        setDataRutin([])
        setDataNonRutin([])
      })
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  return { dataRutin, dataNonRutin, loading }
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

export function useKasKeuangan(params: {
  bulan?: string
  tahun?: number
  startDate?: string
  endDate?: string
}) {
  const [data, setData] = useState<KasKeuangan | null>(null)
  const [loading, setLoading] = useState(false)

  const { bulan, tahun, startDate, endDate } = params

  useEffect(() => {
    const qs = new URLSearchParams()
    if (startDate) {
      qs.set('start', startDate)
      if (endDate) qs.set('end', endDate)
    } else if (bulan) {
      qs.set('bulan', bulan)
      if (tahun) qs.set('tahun', String(tahun))
    }
    setLoading(true)
    apiFetch<KasKeuangan>(`/dashboard/kas-keuangan?${qs}`, 'GET')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bulan, tahun, startDate, endDate])

  return { data, loading }
}
