import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { getTabungan, getTabunganHistory, setorTabungan, tarikTabungan } from '../../api/tabungan'
import toast from 'react-hot-toast'

const formatRupiah = (val: number | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0)

type Transaction = {
  id: number
  type: 'setor' | 'tarik'
  amount: number
  saldo_after: number
  description: string | null
  method: string
  recorded_by: string | null
  created_at: string
}

export default function TabunganDetail() {
  const { santriId } = useParams<{ santriId: string }>()
  const navigate = useNavigate()
  const [tabungan, setTabungan] = useState<any | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showSetor, setShowSetor] = useState(false)
  const [showTarik, setShowTarik] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!santriId) return
    setLoading(true)
    try {
      const [tabRes, histRes] = await Promise.all([
        getTabungan(santriId),
        getTabunganHistory(santriId),
      ])
      setTabungan(tabRes.data)
      setTransactions(histRes.data)
    } catch {
      toast.error('Gagal memuat data tabungan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [santriId])

  const handleSetor = async () => {
    if (!santriId || !amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await setorTabungan(santriId, { amount: Number(amount), description: description || undefined, method })
      toast.success('Setoran berhasil!')
      setShowSetor(false)
      setAmount('')
      setDescription('')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyetor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTarik = async () => {
    if (!santriId || !amount || Number(amount) <= 0) return
    if (Number(amount) > tabungan?.saldo) { toast.error('Saldo tidak mencukupi'); return }
    setSubmitting(true)
    try {
      await tarikTabungan(santriId, { amount: Number(amount), description: description || undefined, method })
      toast.success('Penarikan berhasil!')
      setShowTarik(false)
      setAmount('')
      setDescription('')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menarik')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSetor = transactions.filter(t => t.type === 'setor').reduce((s, t) => s + t.amount, 0)
  const totalTarik = transactions.filter(t => t.type === 'tarik').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/keuangan/tabungan')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Detail Tabungan</h1>
          {tabungan && (
            <p className="text-sm text-gray-500">{tabungan.santri?.nama_santri} — {tabungan.santri?.nis}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tabungan ? (
        <>
          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Saldo Tabungan</span>
            </div>
            <p className="text-4xl font-bold">{formatRupiah(tabungan.saldo)}</p>
            <div className="mt-4 flex items-center gap-4 text-sm opacity-80">
              <span>Kelas: {tabungan.santri?.kelas || '-'}</span>
              <span>Asrama: {tabungan.santri?.asrama || '-'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tabungan.status === 'aktif' ? 'bg-green-400/30 text-white' : 'bg-gray-400/30'}`}>
                {tabungan.status}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Total Setor</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(totalSetor)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium">Total Tarik</p>
              <p className="text-xl font-bold text-orange-700 mt-1">{formatRupiah(totalTarik)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {tabungan.status === 'aktif' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setAmount(''); setDescription(''); setMethod('cash'); setShowSetor(true) }}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <ArrowUpCircle className="w-5 h-5" />
                Setor Tabungan
              </button>
              <button
                onClick={() => { setAmount(''); setDescription(''); setMethod('cash'); setShowTarik(true) }}
                className="flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                <ArrowDownCircle className="w-5 h-5" />
                Tarik Tabungan
              </button>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Riwayat Transaksi</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'setor' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                      {t.type === 'setor'
                        ? <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                        : <ArrowDownCircle className="w-5 h-5 text-orange-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize">{t.type}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {t.description || (t.type === 'setor' ? 'Setoran tabungan' : 'Penarikan tabungan')}
                        {t.recorded_by ? ` · ${t.recorded_by}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${t.type === 'setor' ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {t.type === 'setor' ? '+' : '-'}{formatRupiah(t.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">Tabungan tidak ditemukan</div>
      )}

      {/* Modal Setor */}
      {showSetor && (
        <TransaksiModal
          title="Setor Tabungan"
          type="setor"
          currentSaldo={tabungan?.saldo}
          amount={amount} setAmount={setAmount}
          description={description} setDescription={setDescription}
          method={method} setMethod={setMethod}
          onClose={() => setShowSetor(false)}
          onSubmit={handleSetor}
          submitting={submitting}
        />
      )}

      {/* Modal Tarik */}
      {showTarik && (
        <TransaksiModal
          title="Tarik Tabungan"
          type="tarik"
          currentSaldo={tabungan?.saldo}
          amount={amount} setAmount={setAmount}
          description={description} setDescription={setDescription}
          method={method} setMethod={setMethod}
          onClose={() => setShowTarik(false)}
          onSubmit={handleTarik}
          submitting={submitting}
          maxAmount={tabungan?.saldo}
        />
      )}
    </div>
  )
}

function TransaksiModal({ title, type, currentSaldo, amount, setAmount, description, setDescription, method, setMethod, onClose, onSubmit, submitting, maxAmount }: {
  title: string; type: 'setor' | 'tarik'; currentSaldo: number
  amount: string; setAmount: (v: string) => void
  description: string; setDescription: (v: string) => void
  method: 'cash' | 'transfer'; setMethod: (v: 'cash' | 'transfer') => void
  onClose: () => void; onSubmit: () => void; submitting: boolean
  maxAmount?: number
}) {
  const isValid = Number(amount) > 0 && (!maxAmount || Number(amount) <= maxAmount)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl max-w-sm w-full shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Saldo saat ini: <span className="font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentSaldo || 0)}</span></p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="Masukkan nominal"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
          />
          {amount && Number(amount) > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount))}
              {maxAmount && Number(amount) > maxAmount && <span className="text-red-500 ml-2">Melebihi saldo!</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['cash', 'transfer'] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)} type="button"
                className={`py-2 text-sm border-2 rounded-lg font-medium ${method === m ? 'border-brand bg-brand/5 text-brand' : 'border-gray-300 hover:border-gray-400'}`}>
                {m === 'cash' ? '💵 Cash' : '🏦 Transfer'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Setor lebaran..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button onClick={onSubmit} disabled={!isValid || submitting}
            className={`flex-1 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-50 ${type === 'setor' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
            {submitting ? 'Memproses...' : type === 'setor' ? 'Setor' : 'Tarik'}
          </button>
        </div>
      </div>
    </div>
  )
}
