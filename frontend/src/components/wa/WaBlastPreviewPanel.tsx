import { AlertCircle, MessageSquare, Users, UserX, CheckCircle2 } from 'lucide-react'
import type { WaBlastPreview } from '../../types/wa.types'

interface Props {
  preview: WaBlastPreview
  loading: boolean
  editedMessage: string
  blastType?: string
  onMessageChange: (v: string) => void
}

export function WaBlastPreviewPanel({ preview, loading, editedMessage, blastType, onMessageChange }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
        <span className="animate-pulse">Memuat preview...</span>
      </div>
    )
  }

  const skipLabel = blastType === 'rekap_tunggakan' ? 'Tidak ada tunggakan' : 'Sudah lunas'

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge icon={<Users className="w-4 h-4" />} label="Akan dikirim" value={preview.recipient_count} color="green" />
        <StatBadge icon={<CheckCircle2 className="w-4 h-4" />} label={skipLabel} value={preview.lunas_count} color="gray" />
        <StatBadge icon={<UserX className="w-4 h-4" />} label="Tanpa HP" value={preview.no_phone_count} color="orange" />
      </div>

      {preview.recipient_count === 0 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Tidak ada penerima — semua tagihan sudah lunas atau tidak ada HP terdaftar.
        </div>
      )}

      {/* Editable sample message */}
      {preview.sample_message && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Contoh Pesan (dapat diedit)
          </div>
          <textarea
            value={editedMessage}
            onChange={e => onMessageChange(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1">* Template di atas adalah contoh dari penerima pertama. Setiap penerima akan mendapat pesan dengan data mereka masing-masing.</p>
        </div>
      )}
    </div>
  )
}

function StatBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'green' | 'gray' | 'orange' }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  }
  return (
    <div className={`border rounded-lg p-2.5 flex flex-col items-center gap-1 text-center ${colors[color]}`}>
      {icon}
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}
