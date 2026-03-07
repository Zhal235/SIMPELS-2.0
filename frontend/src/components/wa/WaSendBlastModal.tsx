import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { blastPengumuman, blastTagihanDetail, blastReminder, blastRekapTunggakan, previewBlast } from '../../api/waGateway'
import type { BlastPengumumanPayload, BlastTagihanPayload, WaBlastPreview } from '../../types/wa.types'
import { WaBlastPreviewPanel } from './WaBlastPreviewPanel'
import { WaTestMessageModal } from './WaTestMessageModal'

type BlastType = 'pengumuman' | 'tagihan_detail' | 'reminder' | 'rekap_tunggakan'
type Step = 'config' | 'preview'

const BULAN_OPTIONS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

interface Props {
  open: boolean
  defaultType?: BlastType
  onClose: () => void
  onSuccess: (message: string) => void
}

export function WaSendBlastModal({ open, defaultType = 'pengumuman', onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('config')
  const [type, setType] = useState<BlastType>(defaultType)
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [target, setTarget] = useState<'wali' | 'pegawai' | 'all'>('wali')
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [preview, setPreview] = useState<WaBlastPreview | null>(null)
  const [editedMessage, setEditedMessage] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testOpen, setTestOpen] = useState(false)

  if (!open) return null

  const handleClose = () => { setStep('config'); setPreview(null); setError(null); setTestOpen(false); onClose() }

  const handlePreview = async () => {
    setError(null)
    if (type === 'pengumuman' && (!judul.trim() || !isi.trim())) {
      setError('Judul dan isi pengumuman wajib diisi'); return
    }
    setLoadingPreview(true)
    try {
      const payload: Record<string, any> = { type, bulan, tahun }
      if (type === 'pengumuman') { payload.judul = judul; payload.isi = isi; payload.target = target }
      const res = await previewBlast(payload)
      setPreview(res)
      setEditedMessage(res.sample_message ?? '')
      setStep('preview')
    } catch {
      setError('Gagal memuat preview. Periksa koneksi server.')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      let message = ''
      if (type === 'pengumuman') {
        if (!judul.trim() || !isi.trim()) {
          setError('Judul dan isi pengumuman wajib diisi')
          return
        }
        const payload: BlastPengumumanPayload = { judul, isi, target }
        message = (await blastPengumuman(payload)).message
      } else if (type === 'tagihan_detail') {
        message = (await blastTagihanDetail({ bulan, tahun })).message
      } else if (type === 'reminder') {
        message = (await blastReminder({ bulan, tahun })).message
      } else {
        message = (await blastRekapTunggakan({ bulan, tahun })).message
      }
      onSuccess(message)
      handleClose()
    } catch {
      setError('Gagal mengirim blast. Periksa koneksi server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">Kirim Blast WA</h3>
            <p className="text-xs text-gray-400 mt-0.5">{step === 'config' ? 'Langkah 1: Konfigurasi' : 'Langkah 2: Preview & Kirim'}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {step === 'config' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pesan</label>
                <select value={type} onChange={e => setType(e.target.value as BlastType)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="tagihan_detail">Detail Tagihan (+ Tunggakan)</option>
                  <option value="reminder">Reminder Tagihan</option>
                  <option value="rekap_tunggakan">Rekap Tunggakan Lalu</option>
                  <option value="pengumuman">Pengumuman</option>
                </select>
              </div>
              {type === 'pengumuman' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                    <input type="text" value={judul} onChange={e => setJudul(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Judul pengumuman" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                    <textarea value={isi} onChange={e => setIsi(e.target.value)} rows={4}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder="Isi pengumuman..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kirim ke</label>
                    <select value={target} onChange={e => setTarget(e.target.value as typeof target)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="wali">Wali Santri</option>
                      <option value="pegawai">Pegawai</option>
                      <option value="all">Semua (Wali + Pegawai)</option>
                    </select>
                  </div>
                </>
              )}
              {(type === 'tagihan_detail' || type === 'reminder' || type === 'rekap_tunggakan') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                    <select value={bulan} onChange={e => setBulan(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      {BULAN_OPTIONS.map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                    <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))}
                      min={2020} max={2099} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'preview' && preview && (
            <WaBlastPreviewPanel preview={preview} loading={loadingPreview}
              blastType={type} editedMessage={editedMessage} onMessageChange={setEditedMessage} />
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          {step === 'preview' ? (
            <>
              <button onClick={() => setStep('config')} className="border rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                ← Kembali
              </button>
              <button
                onClick={() => setTestOpen(true)}
                disabled={!editedMessage}
                className="flex items-center gap-1.5 border border-amber-400 text-amber-600 hover:bg-amber-50 disabled:opacity-40 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Test
              </button>
              <button onClick={handleSubmit} disabled={loading || (preview?.recipient_count ?? 0) === 0}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Mengirim...' : `Kirim ke ${preview?.recipient_count ?? 0} Penerima`}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handlePreview} disabled={loadingPreview}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {loadingPreview ? 'Memuat...' : 'Preview Pesan →'}
              </button>
            </>
          )}
        </div>
      </div>

      <WaTestMessageModal
        open={testOpen}
        message={editedMessage}
        onClose={() => setTestOpen(false)}
      />
    </div>
  )
}
