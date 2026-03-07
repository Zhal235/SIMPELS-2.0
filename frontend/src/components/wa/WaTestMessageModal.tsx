import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { sendTestWa } from '../../api/waGateway'

interface Props {
  open: boolean
  message: string
  onClose: () => void
}

export function WaTestMessageModal({ open, message, onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  if (!open) return null

  const handleClose = () => { setPhone(''); setResult(null); onClose() }

  const handleSend = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await sendTestWa(phone.trim(), message)
      setResult({ ok: true, text: res.message })
    } catch {
      setResult({ ok: false, text: 'Gagal mengirim. Periksa koneksi atau nomor HP.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">Kirim Pesan Test</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            Pesan contoh akan dikirim ke nomor ini. Gunakan format <span className="font-medium text-gray-700">08xx</span> atau <span className="font-medium text-gray-700">628xx</span>.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP Tujuan</label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setResult(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Contoh: 08123456789"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              autoFocus
            />
          </div>

          <div className="bg-gray-50 rounded-lg px-3 py-2 max-h-28 overflow-y-auto">
            <p className="text-xs text-gray-400 mb-1 font-medium">Isi pesan:</p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
              {message || '(pesan kosong)'}
            </pre>
          </div>

          {result && (
            <div className={`rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {result.text}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t">
          <button onClick={handleClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
            Tutup
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !phone.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? 'Mengirim...' : '🧪 Kirim Test'}
          </button>
        </div>
      </div>
    </div>
  )
}
