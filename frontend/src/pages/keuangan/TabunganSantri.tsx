import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wallet, TrendingUp, TrendingDown, Users, Plus, ArrowUpCircle, ArrowDownCircle, Eye, X, CheckCircle } from 'lucide-react'
import { listTabungan, getLaporanTabungan, bukaTabungan, setorTabungan, tarikTabungan, updateTabungan } from '../../api/tabungan'
import { listSantri } from '../../api/santri'
import toast from 'react-hot-toast'

const formatRupiah = (val: number | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0)

type TabunganItem = {
  id: number
  santri_id: string
  saldo: number
  status: 'aktif' | 'nonaktif'
  opened_at: string
  notes: string | null
  santri: {
    id: string
    nis: string
    nama_santri: string
    foto: string | null
    kelas: string | null
    asrama: string | null
  }
}

type Summary = {
  total_saldo: number
  total_santri: number
  total_aktif: number
  total_nonaktif: number
  setor_bulan_ini?: number
  tarik_bulan_ini?: number
}

export default function TabunganSantri() {
  const navigate = useNavigate()
  const [data, setData] = useState<TabunganItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua')

  // Modal: buka tabungan baru
  const [showBuka, setShowBuka] = useState(false)
  const [santriSearch, setSantriSearch] = useState('')
  const [santriResults, setSantriResults] = useState<any[]>([])
  const [selectedSantriForBuka, setSelectedSantriForBuka] = useState<any | null>(null)
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [submittingBuka, setSubmittingBuka] = useState(false)

  // Modal: setor / tarik
  const [showSetor, setShowSetor] = useState(false)
  const [showTarik, setShowTarik] = useState(false)
  const [activeSantriId, setActiveSantriId] = useState<string | null>(null)
  const [activeSantriName, setActiveSantriName] = useState('')
  const [activeSaldo, setActiveSaldo] = useState(0)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterStatus !== 'semua') params.status = filterStatus
      const [res, lapRes] = await Promise.all([
        listTabungan(params),
        getLaporanTabungan(),
      ])
      setData(res.data)
      setSummary({ ...res.summary, ...lapRes.data })
    } catch {
      toast.error('Gagal memuat data tabungan')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  useEffect(() => { load() }, [load])

  // Santri search for buka tabungan
  useEffect(() => {
    if (!santriSearch || santriSearch.length < 2) { setSantriResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await listSantri(1, 10, { search: santriSearch, status: 'aktif' })
        setSantriResults(res.data || [])
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [santriSearch])

  const handleBukaTabungan = async () => {
    if (!selectedSantriForBuka) return
    setSubmittingBuka(true)
    try {
      await bukaTabungan({ santri_id: selectedSantriForBuka.id, opened_at: openedAt, notes: notes || undefined })
      toast.success('Tabungan berhasil dibuka!')
      setShowBuka(false)
      setSelectedSantriForBuka(null)
      setSantriSearch('')
      setNotes('')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal membuka tabungan')
    } finally {
      setSubmittingBuka(false)
    }
  }

  const openSetor = (item: TabunganItem) => {
    setActiveSantriId(item.santri_id)
    setActiveSantriName(item.santri.nama_santri)
    setActiveSaldo(item.saldo)
    setAmount('')
    setDescription('')
    setMethod('cash')
    setShowSetor(true)
  }

  const openTarik = (item: TabunganItem) => {
    setActiveSantriId(item.santri_id)
    setActiveSantriName(item.santri.nama_santri)
    setActiveSaldo(item.saldo)
    setAmount('')
    setDescription('')
    setMethod('cash')
    setShowTarik(true)
  }

  const handleSetor = async () => {
    if (!activeSantriId || !amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await setorTabungan(activeSantriId, { amount: Number(amount), description: description || undefined, method })
      toast.success('Setoran berhasil dicatat!')
      setShowSetor(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyetor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTarik = async () => {
    if (!activeSantriId || !amount || Number(amount) <= 0) return
    if (Number(amount) > activeSaldo) { toast.error('Nominal melebihi saldo'); return }
    setSubmitting(true)
    try {
      await tarikTabungan(activeSantriId, { amount: Number(amount), description: description || undefined, method })
      toast.success('Penarikan berhasil dicatat!')
      setShowTarik(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menarik')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: TabunganItem) => {
    const newStatus = item.status === 'aktif' ? 'nonaktif' : 'aktif'
    try {
      await updateTabungan(item.santri_id, { status: newStatus })
      toast.success(`Tabungan ${newStatus === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`)
      load()
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabungan Santri</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola tabungan santri pondok</p>
        </div>
        <button
          onClick={() => setShowBuka(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Buka Tabungan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Wallet className="w-6 h-6 text-blue-600" />}
          label="Total Saldo Tabungan"
          value={formatRupiah(summary?.total_saldo)}
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={<Users className="w-6 h-6 text-green-600" />}
          label="Santri Bertabungan"
          value={String(summary?.total_aktif ?? 0)}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          label="Setor Bulan Ini"
          value={formatRupiah(summary?.setor_bulan_ini)}
          bg="bg-emerald-50"
        />
        <SummaryCard
          icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
          label="Tarik Bulan Ini"
          value={formatRupiah(summary?.tarik_bulan_ini)}
          bg="bg-orange-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama / NIS santri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
        >
          <option value="semua">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wallet className="w-12 h-12 mb-3" />
            <p className="font-medium">Belum ada data tabungan</p>
            <p className="text-sm mt-1">Klik "Buka Tabungan" untuk menambah</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['No', 'Santri', 'Kelas', 'Asrama', 'Saldo', 'Dibuka', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.santri.nama_santri}</p>
                        <p className="text-xs text-gray-500">{item.santri.nis}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.santri.kelas || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.santri.asrama || '-'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{formatRupiah(item.saldo)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {item.opened_at ? new Date(item.opened_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status === 'aktif' ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/keuangan/tabungan/${item.santri_id}`)}
                          title="Lihat riwayat"
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'aktif' && (
                          <>
                            <button
                              onClick={() => openSetor(item)}
                              title="Setor"
                              className="p-1.5 rounded text-green-600 hover:bg-green-50"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openTarik(item)}
                              title="Tarik"
                              className="p-1.5 rounded text-orange-600 hover:bg-orange-50"
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleStatus(item)}
                          title={item.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          className="p-1.5 rounded text-gray-400 hover:bg-gray-100 text-xs"
                        >
                          {item.status === 'aktif' ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Buka Tabungan Baru */}
      {showBuka && (
        <ModalOverlay onClose={() => setShowBuka(false)} title="Buka Tabungan Baru">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ketik nama atau NIS santri..."
                  value={santriSearch}
                  onChange={(e) => { setSantriSearch(e.target.value); setSelectedSantriForBuka(null) }}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
                />
              </div>
              {santriResults.length > 0 && !selectedSantriForBuka && (
                <div className="mt-1 border rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                  {santriResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedSantriForBuka(s); setSantriSearch(s.nama_santri); setSantriResults([]) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <span className="font-medium">{s.nama_santri}</span>
                      <span className="text-gray-400 ml-2">{s.nis}</span>
                      {s.kelas && <span className="text-gray-400 ml-2">· {s.kelas}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedSantriForBuka && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {selectedSantriForBuka.nama_santri} ({selectedSantriForBuka.nis})
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Buka</label>
              <input
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
                placeholder="Catatan tambahan..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowBuka(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button
                onClick={handleBukaTabungan}
                disabled={!selectedSantriForBuka || submittingBuka}
                className="flex-1 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              >
                {submittingBuka ? 'Memproses...' : 'Buka Tabungan'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Modal: Setor */}
      {showSetor && (
        <TransaksiModal
          title={`Setor Tabungan — ${activeSantriName}`}
          subtitle={`Saldo saat ini: ${formatRupiah(activeSaldo)}`}
          type="setor"
          amount={amount}
          setAmount={setAmount}
          description={description}
          setDescription={setDescription}
          method={method}
          setMethod={setMethod}
          onClose={() => setShowSetor(false)}
          onSubmit={handleSetor}
          submitting={submitting}
        />
      )}

      {/* Modal: Tarik */}
      {showTarik && (
        <TransaksiModal
          title={`Tarik Tabungan — ${activeSantriName}`}
          subtitle={`Saldo saat ini: ${formatRupiah(activeSaldo)}`}
          type="tarik"
          amount={amount}
          setAmount={setAmount}
          description={description}
          setDescription={setDescription}
          method={method}
          setMethod={setMethod}
          onClose={() => setShowTarik(false)}
          onSubmit={handleTarik}
          submitting={submitting}
          maxAmount={activeSaldo}
        />
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
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

function ModalOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
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

function TransaksiModal({
  title, subtitle, type, amount, setAmount, description, setDescription,
  method, setMethod, onClose, onSubmit, submitting, maxAmount,
}: {
  title: string; subtitle: string; type: 'setor' | 'tarik'
  amount: string; setAmount: (v: string) => void
  description: string; setDescription: (v: string) => void
  method: 'cash' | 'transfer'; setMethod: (v: 'cash' | 'transfer') => void
  onClose: () => void; onSubmit: () => void; submitting: boolean
  maxAmount?: number
}) {
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
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount))}
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
