import type { WaGatewayStatus } from '../../types/wa.types'

interface Props {
  status: WaGatewayStatus | null
  qrDataUrl: string | null
  loading: boolean
  onRefresh: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  connected:    { label: 'Terhubung',       color: 'text-green-700 bg-green-50 border-green-200',  dot: 'bg-green-500' },
  waiting_scan: { label: 'Scan QR Code',    color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400 animate-pulse' },
  authenticated:{ label: 'Mengautentikasi', color: 'text-blue-700 bg-blue-50 border-blue-200',     dot: 'bg-blue-400 animate-pulse' },
  disconnected: { label: 'Terputus',        color: 'text-red-700 bg-red-50 border-red-200',        dot: 'bg-red-500' },
  auth_failed:  { label: 'Auth Gagal',      color: 'text-red-700 bg-red-50 border-red-200',        dot: 'bg-red-500' },
  unreachable:  { label: 'Tidak Dapat Dijangkau', color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
}

export function WaStatusCard({ status, qrDataUrl, loading, onRefresh }: Props) {
  const cfg = STATUS_CONFIG[status?.status ?? 'unreachable'] ?? STATUS_CONFIG.unreachable

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 text-base">Status WA Gateway</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.color}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </div>

      {status?.phone && (
        <p className="mt-3 text-sm text-gray-600">
          Nomor: <span className="font-medium text-gray-800">{status.phone}</span>
        </p>
      )}

      {status?.connected_at && (
        <p className="text-xs text-gray-400 mt-1">
          Terhubung sejak: {new Date(status.connected_at).toLocaleString('id-ID')}
        </p>
      )}

      {qrDataUrl && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500">Scan dengan WhatsApp di HP Anda:</p>
          <img
            src={qrDataUrl}
            alt="QR Code WhatsApp"
            className="w-48 h-48 border rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
