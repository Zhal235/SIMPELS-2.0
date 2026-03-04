import { useState, useEffect, type ReactNode } from 'react'
import { X, Search, CheckCircle } from 'lucide-react'
import { listSantri } from '../../api/santri'
import { bukaTabungan } from '../../api/tabungan'
import toast from 'react-hot-toast'

const formatRp = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

export function SummaryCard({ icon, label, value, bg }: { icon: ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-start gap-3`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

type TransaksiModalProps = {
  title: string; subtitle: string; type: 'setor' | 'tarik'
  amount: string; setAmount: (v: string) => void
  description: string; setDescription: (v: string) => void
  method: 'cash' | 'transfer'; setMethod: (v: 'cash' | 'transfer') => void
  onClose: () => void; onSubmit: () => void; submitting: boolean
  maxAmount?: number
}

export function TransaksiModal({
  title, subtitle, type, amount, setAmount, description, setDescription,
  method, setMethod, onClose, onSubmit, submitting, maxAmount,
}: TransaksiModalProps) {
  const isValid = Number(amount) > 0 && (!maxAmount || Number(amount) <= maxAmount)
  const color = type === 'setor' ? 'green' : 'orange'

  return (
    <ModalOverlay onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{subtitle}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="Masukkan nominal"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-${color}-500`}
          />
          {amount && (
            <p className="text-xs text-gray-500 mt-1">
              {formatRp(Number(amount))}
              {maxAmount && Number(amount) > maxAmount && <span className="text-red-500 ml-2">Melebihi saldo!</span>}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'transfer'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-3 py-2 border-2 rounded-lg text-sm font-medium capitalize transition-colors ${method === m ? `border-${color}-500 bg-${color}-50 text-${color}-700` : 'border-gray-300 hover:border-gray-400'}`}
              >
                {m === 'cash' ? '💵 Cash' : '🏦 Transfer'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Setor lebaran..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button
            onClick={onSubmit}
            disabled={!isValid || submitting}
            className={`flex-1 px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-50 transition-opacity ${type === 'setor' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {submitting ? 'Memproses...' : type === 'setor' ? 'Setor' : 'Tarik'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

export function BukaTabunganModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [santriSearch, setSantriSearch] = useState('')
  const [santriResults, setSantriResults] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!santriSearch || santriSearch.length < 2) { setSantriResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await listSantri(1, 25, { q: santriSearch })
        setSantriResults(res.data || [])
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [santriSearch])

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await bukaTabungan({ santri_id: selected.id, opened_at: openedAt, notes: notes || undefined })
      toast.success('Tabungan berhasil dibuka!')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal membuka tabungan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose} title="Buka Tabungan Baru">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik nama atau NIS santri..."
              value={santriSearch}
              onChange={(e) => { setSantriSearch(e.target.value); setSelected(null) }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
            />
          </div>
          {santriResults.length > 0 && !selected && (
            <div className="mt-1 border rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-sm">
              {santriResults.map((s) => (
                <button key={s.id} type="button"
                  onClick={() => { setSelected(s); setSantriSearch(s.nama_santri); setSantriResults([]) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                >
                  <span className="font-medium">{s.nama_santri}</span>
                  <span className="text-gray-400 ml-2">{s.nis}</span>
                  {s.kelas && <span className="text-gray-400 ml-2">· {s.kelas}</span>}
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {selected.nama_santri} ({selected.nis})
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Buka</label>
          <input type="date" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
            placeholder="Catatan tambahan..."
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button onClick={handleSubmit} disabled={!selected || submitting}
            className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Buka Tabungan'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

type TutupItem = {
  santri_id: string
  saldo: number
  santri: { nama_santri: string; nis: string; kelas: string | null; asrama: string | null }
}

type TutupTabunganModalProps = {
  data: TutupItem[]
  onClose: () => void
  onConfirm: (item: TutupItem) => void
  submitting: boolean
}

export function TutupTabunganModal({ data, onClose, onConfirm, submitting }: TutupTabunganModalProps) {
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<TutupItem | null>(null)

  const filtered = keyword.length >= 1
    ? data.filter(
        (d) =>
          d.santri.nama_santri.toLowerCase().includes(keyword.toLowerCase()) ||
          d.santri.nis.includes(keyword)
      )
    : []

  return (
    <ModalOverlay onClose={onClose} title="Tutup Tabungan">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik nama atau NIS santri..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setSelected(null) }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-400"
            />
          </div>
          {filtered.length > 0 && !selected && (
            <div className="mt-1 border rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-sm">
              {filtered.map((item) => (
                <button
                  key={item.santri_id}
                  type="button"
                  onClick={() => { setSelected(item); setKeyword(item.santri.nama_santri) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                >
                  <span className="font-medium">{item.santri.nama_santri}</span>
                  <span className="text-gray-400 ml-2">{item.santri.nis}</span>
                  {item.santri.kelas && <span className="text-gray-400 ml-2">· {item.santri.kelas}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{selected.santri.nama_santri}</span>
              <span className="text-sm text-gray-500">{selected.santri.nis}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Saldo</span>
              <span className="font-bold text-gray-900">{formatRp(selected.saldo)}</span>
            </div>
            {selected.saldo > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-700 flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Seluruh saldo ({formatRp(selected.saldo)}) akan ditarik otomatis sebelum tabungan ditutup.
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
              Tindakan ini tidak dapat dibatalkan. Seluruh data tabungan akan dihapus permanen.
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || submitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Memproses...' : 'Tutup Tabungan'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
