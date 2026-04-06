import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, User, ChevronDown, ChevronRight } from 'lucide-react'
import type { WaMessageLog, WaLogsResponse } from '../../types/wa.types'

interface Props {
  logs: WaLogsResponse | null
  loading: boolean
  retryingId: number | null
  filterStatus: string | undefined
  onFilterChange: (status: string | undefined) => void
  onPageChange: (page: number) => void
  onRetry: (log: WaMessageLog) => void
}

const STATUS_CONFIG = {
  sent: { label: 'Terkirim', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  failed: { label: 'Gagal', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
  pending: { label: 'Menunggu', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
}

const TYPE_LABEL: Record<string, string> = {
  reminder: 'Reminder Tagihan',
  tagihan_detail: 'Detail Tagihan',
  rekap_tunggakan: 'Rekap Tunggakan',
  pengumuman: 'Pengumuman',
  custom: 'Pesan Custom',
}

type StatusFilter = 'all' | 'sent' | 'failed' | 'pending'
type GroupedLogs = Record<string, WaMessageLog[]>

export function WaMessageLogTable({ logs, loading, retryingId, filterStatus, onFilterChange, onPageChange, onRetry }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [activeStatusTab, setActiveStatusTab] = useState<StatusFilter>('all')

  const groupedLogs = useMemo(() => {
    if (!logs?.data || !Array.isArray(logs.data)) {
      console.warn('[WA Log] Data log tidak valid atau kosong')
      return {}
    }
    const groups: Record<string, GroupedLogs> = {}
    logs.data.forEach((log, index) => {
      try {
        if (!log?.message_type || !log?.status) {
          console.warn(`[WA Log] Log #${index + 1} tidak memiliki message_type atau status`)
          return
        }
        if (!groups[log.message_type]) groups[log.message_type] = { sent: [], failed: [], pending: [] }
        if (groups[log.message_type][log.status]) groups[log.message_type][log.status].push(log)
      } catch (err) {
        console.error(`[WA Log] Error memproses log #${index + 1}:`, err)
      }
    })
    return groups
  }, [logs?.data])

  const filteredGroupedLogs = useMemo(() => {
    try {
      if (activeStatusTab === 'all') return groupedLogs
      const filtered: Record<string, GroupedLogs> = {}
      Object.entries(groupedLogs).forEach(([messageType, statusGroups]) => {
        if (!statusGroups || typeof statusGroups !== 'object') return
        const filteredStatusGroups: GroupedLogs = { sent: [], failed: [], pending: [] }
        if (Array.isArray(statusGroups[activeStatusTab])) {
          filteredStatusGroups[activeStatusTab] = statusGroups[activeStatusTab]
          if (filteredStatusGroups[activeStatusTab].length > 0) filtered[messageType] = filteredStatusGroups
        }
      })
      return filtered
    } catch (err) {
      console.error('[WA Log] Error filtering logs:', err)
      return {}
    }
  }, [groupedLogs, activeStatusTab])

  const toggleGroup = (messageType: string) => setExpandedGroups(prev => ({ ...prev, [messageType]: !prev[messageType] }))

  const getStatusCounts = () => {
    try {
      let sent = 0, failed = 0, pending = 0
      Object.values(groupedLogs).forEach(statusGroups => {
        if (statusGroups && typeof statusGroups === 'object') {
          sent += Array.isArray(statusGroups.sent) ? statusGroups.sent.length : 0
          failed += Array.isArray(statusGroups.failed) ? statusGroups.failed.length : 0
          pending += Array.isArray(statusGroups.pending) ? statusGroups.pending.length : 0
        }
      })
      return { sent, failed, pending, total: sent + failed + pending }
    } catch (err) {
      console.error('[WA Log] Error menghitung status:', err)
      return { sent: 0, failed: 0, pending: 0, total: 0 }
    }
  }

  const statusCounts = getStatusCounts()

  const StatusTab = ({ status, label, icon, count }: { status: StatusFilter; label: string; icon: string; count: number }) => (
    <button onClick={() => setActiveStatusTab(status)}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        activeStatusTab === status
          ? status === 'all' ? 'bg-blue-600 text-white' : status === 'sent' ? 'bg-green-600 text-white' :
            status === 'failed' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}>
      {icon} {label} ({count})
    </button>
  )

  const formatDate = (date: string) => {
    try {
      if (!date) return '-'
      return new Date(date).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch { return '-' }
  }

  const renderLogRow = (log: WaMessageLog) => {
    try {
      if (!log || !log.id) {
        console.warn('[WA Log] Log tidak valid, tidak ada ID')
        return null
      }
      const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending
      const StatusIcon = statusCfg?.icon || Clock
      return (
        <div key={log.id} className={`flex items-center gap-3 p-3 rounded-lg border ${statusCfg.bg} ${statusCfg.border}`}>
          <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusCfg.text}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {log.santri_names && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>{log.santri_names}</span>
                </div>
              )}
              <span className="text-xs text-gray-500 font-mono">{log.phone || '-'}</span>
            </div>
            {log.error_reason && <p className="text-xs text-red-600 mt-1" title={log.error_reason}>⚠️ {log.error_reason}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {log.retry_count > 0 && <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">Retry {log.retry_count}x</span>}
            <span className="text-xs text-gray-400 w-32 text-right">{formatDate(log.sent_at || log.created_at)}</span>
            {log.status === 'failed' && (
              <button onClick={() => onRetry(log)} disabled={retryingId === log.id}
                className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                {retryingId === log.id ? 'Memproses...' : 'Retry'}
              </button>
            )}
          </div>
        </div>
      )
    } catch (err) {
      console.error('[WA Log] Error rendering log:', err)
      return (
        <div key={log?.id || Math.random()} className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">❌ Gagal menampilkan log: {(err as Error).message}</p>
        </div>
      )
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-800 text-base mb-4">Log Pesan WA</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <StatusTab status="all" label="Semua" icon="" count={statusCounts.total} />
          <StatusTab status="sent" label="Terkirim" icon="✓" count={statusCounts.sent} />
          <StatusTab status="failed" label="Gagal" icon="✗" count={statusCounts.failed} />
          <StatusTab status="pending" label="Pending" icon="⏳" count={statusCounts.pending} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading && <div className="py-8 text-center text-gray-400">Memuat...</div>}
        {!loading && (!logs || logs.data.length === 0) && <div className="py-8 text-center text-gray-400">Tidak ada log pesan</div>}
        {!loading && Object.keys(filteredGroupedLogs).length > 0 && (
          <>
            {Object.entries(filteredGroupedLogs).map(([messageType, statusGroups]) => {
              try {
                const totalLogs = Object.values(statusGroups).flat().length
                if (totalLogs === 0) return null
                const isExpanded = expandedGroups[messageType] !== false
                const [sentCount, failedCount, pendingCount] = [
                  statusGroups.sent?.length || 0, statusGroups.failed?.length || 0, statusGroups.pending?.length || 0
                ]
                return (
                  <div key={messageType} className="border rounded-lg overflow-hidden">
                    <button onClick={() => toggleGroup(messageType)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        <div className="w-1 h-5 bg-green-600 rounded"></div>
                        <h3 className="text-sm font-semibold text-gray-700">{TYPE_LABEL[messageType] || messageType}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {sentCount > 0 && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ {sentCount}</span>}
                        {failedCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">✗ {failedCount}</span>}
                        {pendingCount > 0 && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">⏳ {pendingCount}</span>}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-white">
                        {(statusGroups.failed || []).map(renderLogRow)}
                        {(statusGroups.pending || []).map(renderLogRow)}
                        {(statusGroups.sent || []).map(renderLogRow)}
                      </div>
                    )}
                  </div>
                )
              } catch (err) {
                console.error('[WA Log] Error rendering group:', err)
                return (
                  <div key={messageType} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">❌ Gagal menampilkan grup "{messageType}"</p>
                  </div>
                )
              }
            })}
          </>
        )}
      </div>

      {logs && logs.last_page > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-500">
          <span>Halaman {logs.current_page} dari {logs.last_page} ({logs.total} total)</span>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(logs.current_page - 1)} disabled={logs.current_page <= 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Sebelumnya</button>
            <button onClick={() => onPageChange(logs.current_page + 1)} disabled={logs.current_page >= logs.last_page}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Berikutnya</button>
          </div>
        </div>
      )}
    </div>
  )
}
