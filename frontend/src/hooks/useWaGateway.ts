import { useState, useEffect, useCallback } from 'react'
import { getWaStatus, getWaQr, getWaLogs, retryWaLog } from '../api/waGateway'
import type { WaGatewayStatus, WaMessageLog, WaLogsResponse } from '../types/wa.types'

export function useWaGateway() {
  const [gatewayStatus, setGatewayStatus] = useState<WaGatewayStatus | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<WaLogsResponse | null>(null)
  const [logsFilter, setLogsFilter] = useState<{ page: number }>({ page: 1 })
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    setError(null)
    try {
      const data = await getWaStatus()
      
      if (!data || typeof data !== 'object') {
        throw new Error('Format data status tidak valid')
      }
      
      setGatewayStatus(data)

      if (data.status === 'waiting_scan') {
        const qr = await getWaQr()
        if (qr?.qr) {
          setQrDataUrl(qr.qr)
        }
      } else {
        setQrDataUrl(null)
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = error?.response?.data?.message || error?.message || 'Tidak dapat terhubung ke WA Gateway'
      setError(`Gagal memuat status: ${errorMsg}`)
      setGatewayStatus({ status: 'unreachable', phone: null, connected_at: null })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true)
    setError(null)
    try {
      console.log('[WA Gateway] Fetching logs dengan filter:', logsFilter)
      const data = await getWaLogs(logsFilter)
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Format data log tidak valid')
      }
      
      // Debug: cek distribusi status
      const statusDistribution = data.data.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('[WA Gateway] Total logs:', data.total)
      console.log('[WA Gateway] Distribusi status (halaman ini):', statusDistribution)
      console.log('[WA Gateway] Data per page:', data.per_page)
      console.log('[WA Gateway] Current page:', data.current_page)
      
      setLogs(data)
      setError(null)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat memuat data'
      console.error('[WA Gateway] Error loading logs:', errorMsg, err)
      setError(`Gagal memuat log pesan: ${errorMsg}`)
      setLogs(null)
    } finally {
      setLoadingLogs(false)
    }
  }, [logsFilter])

  const handleRetry = useCallback(async (log: WaMessageLog) => {
    setRetryingId(log.id)
    setError(null)
    try {
      if (!log?.id) {
        throw new Error('ID log tidak valid')
      }
      
      await retryWaLog(log.id)
      await fetchLogs()
      setError(null)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = error?.response?.data?.message || error?.message || 'Terjadi kesalahan'
      setError(`Gagal mengirim ulang pesan: ${errorMsg}`)
    } finally {
      setRetryingId(null)
    }
  }, [fetchLogs])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    gatewayStatus,
    qrDataUrl,
    logs,
    logsFilter,
    setLogsFilter,
    loadingStatus,
    loadingLogs,
    retryingId,
    error,
    refreshStatus: fetchStatus,
    refreshLogs: fetchLogs,
    handleRetry,
  }
}
