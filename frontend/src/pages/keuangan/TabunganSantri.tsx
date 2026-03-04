import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Wallet, TrendingUp, TrendingDown, Users, Plus, X } from 'lucide-react'
import { listTabungan, getLaporanTabungan, setorTabungan, tarikTabungan, updateTabungan, tutupTabungan } from '../../api/tabungan'
import { SummaryCard, TransaksiModal, TutupTabunganModal, BukaTabunganModal } from '../../components/keuangan/TabunganModals'
import TabunganTable, { type TabunganItem } from '../../components/keuangan/TabunganTable'
import toast from 'react-hot-toast'

const formatRupiah = (val: number | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val) || 0)

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
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua')
  const [showBuka, setShowBuka] = useState(false)
  const [showSetor, setShowSetor] = useState(false)
  const [showTarik, setShowTarik] = useState(false)
  const [showTutup, setShowTutup] = useState(false)
  const [activeSantriId, setActiveSantriId] = useState<string | null>(null)
  const [activeSantriName, setActiveSantriName] = useState('')
  const [activeSaldo, setActiveSaldo] = useState(0)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [submittingTutup, setSubmittingTutup] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterStatus !== 'semua') params.status = filterStatus
      const [res, lapRes] = await Promise.all([listTabungan(params), getLaporanTabungan()])
      setData(res.data)
      setSummary({ ...res.summary, ...lapRes.data })
    } catch {
      toast.error('Gagal memuat data tabungan')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { load() }, [load])

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

  const handleTutupTabungan = async (item: { santri_id: string; saldo: number }) => {
    setSubmittingTutup(true)
    try {
      await tutupTabungan(item.santri_id)
      toast.success('Tabungan berhasil ditutup!')
      setShowTutup(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menutup tabungan')
    } finally {
      setSubmittingTutup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabungan Santri</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola tabungan santri pondok</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTutup(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Tutup Tabungan
          </button>
          <button
            onClick={() => setShowBuka(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Buka Tabungan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<Wallet className="w-6 h-6 text-blue-600" />} label="Total Saldo Tabungan" value={formatRupiah(summary?.total_saldo)} bg="bg-blue-50" />
        <SummaryCard icon={<Users className="w-6 h-6 text-green-600" />} label="Santri Bertabungan" value={String(summary?.total_aktif ?? 0)} bg="bg-green-50" />
        <SummaryCard icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} label="Setor Bulan Ini" value={formatRupiah(summary?.setor_bulan_ini)} bg="bg-emerald-50" />
        <SummaryCard icon={<TrendingDown className="w-6 h-6 text-orange-600" />} label="Tarik Bulan Ini" value={formatRupiah(summary?.tarik_bulan_ini)} bg="bg-orange-50" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama / NIS santri..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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

      <TabunganTable
        data={data}
        loading={loading}
        formatRupiah={formatRupiah}
        onNavigate={(id) => navigate(`/keuangan/tabungan/${id}`)}
        onSetor={openSetor}
        onTarik={openTarik}
        onToggleStatus={handleToggleStatus}
      />

      {showBuka && <BukaTabunganModal onClose={() => setShowBuka(false)} onSuccess={load} />}

      {showSetor && (
        <TransaksiModal
          title={`Setor Tabungan â€” ${activeSantriName}`}
          subtitle={`Saldo saat ini: ${formatRupiah(activeSaldo)}`}
          type="setor"
          amount={amount} setAmount={setAmount}
          description={description} setDescription={setDescription}
          method={method} setMethod={setMethod}
          onClose={() => setShowSetor(false)}
          onSubmit={handleSetor}
          submitting={submitting}
        />
      )}

      {showTarik && (
        <TransaksiModal
          title={`Tarik Tabungan â€” ${activeSantriName}`}
          subtitle={`Saldo saat ini: ${formatRupiah(activeSaldo)}`}
          type="tarik"
          amount={amount} setAmount={setAmount}
          description={description} setDescription={setDescription}
          method={method} setMethod={setMethod}
          onClose={() => setShowTarik(false)}
          onSubmit={handleTarik}
          submitting={submitting}
          maxAmount={activeSaldo}
        />
      )}

      {showTutup && (
        <TutupTabunganModal
          data={data}
          onClose={() => setShowTutup(false)}
          onConfirm={handleTutupTabungan}
          submitting={submittingTutup}
        />
      )}
    </div>
  )
}
