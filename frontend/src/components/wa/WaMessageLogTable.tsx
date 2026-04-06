import { useMemo } from 'react'
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react'
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
  sent: { 
    label: 'Terkirim', 
    bg: 'bg-green-50', 
    text: 'text-green-700', 
    border: 'border-green-200',
    icon: CheckCircle 
  },
  failed: { 
    label: 'Gagal', 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200',
    icon: AlertCircle 
  },
  pending: { 
    label: 'Menunggu', 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-700', 
    border: 'border-yellow-200',
    icon: Clock 
  },
}

const TYPE_LABEL: Record<string, string> = {
  reminder: 'Reminder Tagihan',
  tagihan_detail: 'Detail Tagihan',
  rekap_tunggakan: 'Rekap Tunggakan',
  pengumuman: 'Pengumuman',
  custom: 'Pesan Custom',
}

type GroupedLogs = Record<string, WaMessageLog[]>

export function WaMessageLogTable({
  logs,
  loading,
  retryingId,
  filterStatus,
  onFilterChange,
  onPageChange,
  onRetry,
}: Props) {
  // Group logs by message_type then by status
  const groupedLogs = useMemo(() => {
    if (!logs?.data) return {}
    
    const groups: Record<string, GroupedLogs> = {}
    
    logs.data.forEach(log => {
      if (!groups[log.message_type]) {
        groups[log.message_type] = { sent: [], failed: [], pending: [] }
      }
      groups[log.message_type][log.status].push(log)
    })
    
    return groups
  }, [logs?.data])

  const renderLogRow = (log: WaMessageLog) => {
    const statusCfg = STATUS_CONFIG[log.status]
    const StatusIcon = statusCfg.icon

    return (
      <div
        key={log.id}
        className={`flex items-center gap-3 p-3 rounded-lg border ${statusCfg.bg} ${statusCfg.border}`}
      >
        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusCfg.text}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {log.santri_names && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{log.santri_names}</span>
              </div>
            )}
            <span className="text-xs text-gray-500 font-mono">{log.phone}</span>
          </div>
          
          {log.error_reason && (
            <p className="text-xs text-red-600 mt-1 truncate" title={log.error_reason}>
              ⚠️ {log.error_reason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {log.retry_count > 0 && (
            <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
              Retry {log.retry_count}x
            </span>
          )}
          
          <span className="text-xs text-gray-400 w-32 text-right">
            {log.sent_at
              ? new Date(log.sent_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : new Date(log.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </span>

          {log.status === 'failed' && (
            <button
              onClick={() => onRetry(log)}
              disabled={retryingId === log.id}
              className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {retryingId === log.id ? 'Memproses...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="font-semibold text-gray-800 text-base">Log Pesan WA</h2>
        <select
          value={filterStatus ?? ''}
          onChange={(e) => onFilterChange(e.target.value || undefined)}
          className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Terkirim</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      <div className="p-5 space-y-6">
        {loading && (
          <div className="py-8 text-center text-gray-400">Memuat...</div>
        )}
        
        {!loading && (!logs || logs.data.length === 0) && (
          <div className="py-8 text-center text-gray-400">
            Tidak ada log pesan
          </div>
        )}

        {!loading && Object.keys(groupedLogs).length > 0 && (
          <>
            {Object.entries(groupedLogs).map(([messageType, statusGroups]) => {
              const totalLogs = Object.values(statusGroups).flat().length
              if (totalLogs === 0) return null

              return (
                <div key={messageType} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-1 h-4 bg-green-600 rounded"></div>
                      {TYPE_LABEL[messageType] || messageType}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      {statusGroups.sent.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✓ {statusGroups.sent.length} terkirim
                        </span>
                      )}
                      {statusGroups.failed.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          ✗ {statusGroups.failed.length} gagal
                        </span>
                      )}
                      {statusGroups.pending.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          ⏳ {statusGroups.pending.length} pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {statusGroups.failed.map(renderLogRow)}
                    {statusGroups.pending.map(renderLogRow)}
                    {statusGroups.sent.map(renderLogRow)}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {logs && logs.last_page > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-500">
          <span>
            Halaman {logs.current_page} dari {logs.last_page} ({logs.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(logs.current_page - 1)}
              disabled={logs.current_page <= 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => onPageChange(logs.current_page + 1)}
              disabled={logs.current_page >= logs.last_page}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
