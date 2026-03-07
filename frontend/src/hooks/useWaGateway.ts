import { useState, useEffect, useCallback } from 'react'
import { getWaStatus, getWaQr, getWaLogs, retryWaLog } from '../api/waGateway'
import type { WaGatewayStatus, WaMessageLog, WaLogsResponse } from '../types/wa.types'

export function useWaGateway() {
  const [gatewayStatus, setGatewayStatus] = useState<WaGatewayStatus | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<WaLogsResponse | null>(null)
  const [logsFilter, setLogsFilter] = useState<{ status?: string; page: number }>({ page: 1 })
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const data = await getWaStatus()
      setGatewayStatus(data)

      if (data.status === 'waiting_scan') {
        const qr = await getWaQr()
        setQrDataUrl(qr.qr)
      } else {
        setQrDataUrl(null)
      }
    } catch {
      setGatewayStatus({ status: 'unreachable', phone: null, connected_at: null })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true)
    try {
      const data = await getWaLogs(logsFilter)
      setLogs(data)
      setError(null)
    } catch {
      setError('Gagal memuat log pesan')
    } finally {
      setLoadingLogs(false)
    }
  }, [logsFilter])

  const handleRetry = useCallback(async (log: WaMessageLog) => {
    setRetryingId(log.id)
    try {
      await retryWaLog(log.id)
      await fetchLogs()
    } catch {
      setError('Gagal melakukan retry')
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
