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

const STATUS_BADGE: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const TYPE_LABEL: Record<string, string> = {
  reminder:       'Reminder',
  tagihan_detail: 'Detail Tagihan',
  pengumuman:     'Pengumuman',
  custom:         'Custom',
}

export function WaMessageLogTable({
  logs,
  loading,
  retryingId,
  filterStatus,
  onFilterChange,
  onPageChange,
  onRetry,
}: Props) {
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Penerima</th>
              <th className="px-4 py-3 text-left">No. HP</th>
              <th className="px-4 py-3 text-left">Tipe</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Retry</th>
              <th className="px-4 py-3 text-left">Waktu</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && (!logs || logs.data.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada log pesan
                </td>
              </tr>
            )}
            {!loading &&
              logs?.data.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 capitalize">{log.recipient_type}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{log.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABEL[log.message_type] ?? log.message_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[log.status]}`}>
                      {log.status}
                    </span>
                    {log.error_reason && (
                      <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate" title={log.error_reason}>
                        {log.error_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.retry_count}x</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {log.sent_at
                      ? new Date(log.sent_at).toLocaleString('id-ID')
                      : new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    {log.status === 'failed' && (
                      <button
                        onClick={() => onRetry(log)}
                        disabled={retryingId === log.id}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {retryingId === log.id ? 'Memproses...' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
