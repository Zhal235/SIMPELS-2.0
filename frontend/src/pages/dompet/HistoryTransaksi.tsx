import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { listWalletTransactions, deleteImportHistory, listUsers } from '../../api/wallet'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const PER_PAGE = 25

export default function HistoryTransaksi() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deletingImport, setDeletingImport] = useState(false)
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([])  
  const location = useLocation()

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterOperator, setFilterOperator] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [search, filterType, filterMethod, filterStart, filterEnd, filterOperator])
  useEffect(() => { load() }, [page, search, filterType, filterMethod, filterStart, filterEnd, filterOperator, location.search])

  useEffect(() => {
    listUsers().then((res) => { if (res.success) setUsers(res.data ?? []) }).catch(() => {})
  }, [])

  async function load() {
    try {
      setLoading(true)
      const query = new URLSearchParams(location.search)
      const params: any = { page, per_page: PER_PAGE }
      if (query.get('santri_id')) params.santri_id = query.get('santri_id')
      if (search.trim().length >= 2) params.search = search.trim()
      if (filterType) params.type = filterType
      if (filterMethod) params.method = filterMethod
      if (filterStart) params.start = filterStart
      if (filterEnd) params.end = filterEnd + ' 23:59:59'
      if (filterOperator) params.created_by = filterOperator
      const res = await listWalletTransactions(params)
      if (res.success) {
        setTransactions(res.data || [])
        setMeta(res.meta || null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  function resetFilters() {
    setSearch(''); setFilterType(''); setFilterMethod(''); setFilterStart(''); setFilterEnd(''); setFilterOperator(''); setPage(1)
  }

  async function exportCSV() {
    if (totalRows === 0) { toast.error('Tidak ada data untuk diexport'); return }
    
    const loadingToast = toast.loading('Mengambil semua data untuk export...')
    
    try {
      const query = new URLSearchParams(location.search)
      const params: any = { per_page: 999999 }
      if (query.get('santri_id')) params.santri_id = query.get('santri_id')
      if (search.trim().length >= 2) params.search = search.trim()
      if (filterType) params.type = filterType
      if (filterMethod) params.method = filterMethod
      if (filterStart) params.start = filterStart
      if (filterEnd) params.end = filterEnd + ' 23:59:59'
      if (filterOperator) params.created_by = filterOperator
      
      const res = await listWalletTransactions(params)
      
      if (!res.success || !res.data || res.data.length === 0) {
        toast.error('Tidak ada data untuk diexport', { id: loadingToast })
        return
      }
      
      const allData = res.data
      const headers = ['No', 'NIS', 'Nama Santri', 'Tipe', 'Nominal', 'Saldo Setelah', 'Keterangan', 'Metode', 'Operator', 'Waktu', 'Status']
      const csvRows = [headers.join(',')]
      
      allData.forEach((t: any, idx: number) => {
        const row = [
          idx + 1,
          t.wallet?.santri?.nis || '',
          t.wallet?.santri?.nama_santri || '',
          t.type === 'credit' ? 'Top-up' : 'Debit',
          parseFloat(t.amount || 0),
          parseFloat(t.balance_after || 0),
          (t.description || '').replace(/,/g, ';'),
          t.method || '',
          t.author?.name || 'System',
          new Date(t.created_at).toLocaleString('id-ID'),
          t.voided ? 'VOID' : 'Valid'
        ]
        csvRows.push(row.map(v => JSON.stringify(v)).join(','))
      })
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dompet_transactions_${new Date().toISOString().split('T')[0]}_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`Berhasil export ${allData.length.toLocaleString('id-ID')} transaksi`, { id: loadingToast })
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengexport data', { id: loadingToast })
    }
  }

  async function handleDeleteImportHistory() {
    const confirmed = window.confirm(
      'Hapus SEMUA history import?\n\n• Seluruh transaksi MIGRATION dihapus permanen\n• Saldo semua dompet direset ke 0\n\nLakukan ini sebelum upload ulang Excel agar tidak duplikat.\nTindakan ini TIDAK DAPAT dibatalkan.'
    )
    if (!confirmed) return
    setDeletingImport(true)
    try {
      const res = await deleteImportHistory()
      if (res.success) {
        toast.success(res.message)
        load()
      } else {
        toast.error(res.message || 'Gagal menghapus history import')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus history import')
    } finally {
      setDeletingImport(false)
    }
  }

  const columns = [
    { key: '_no', header: 'No', render: (_v: any, _r: any, idx: number) => (
      <div className="text-xs text-gray-500 text-center">{((page - 1) * PER_PAGE) + idx + 1}</div>
    )},
    { key: 'santri_name', header: 'Santri', render: (_v: any, r: any) => (
      <div>
        <div className="font-medium text-sm">{r.wallet?.santri?.nama_santri || '-'}</div>
        <div className="text-xs text-gray-400">{r.wallet?.santri?.nis || ''}</div>
      </div>
    )},
    { key: 'type', header: 'Tipe', render: (v: any) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${v === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {v === 'credit' ? '↑ Top-up' : '↓ Debit'}
      </span>
    )},
    { key: 'amount', header: 'Nominal', render: (v: any) => <div className="font-semibold">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'balance_after', header: 'Saldo Setelah', render: (v: any) => <div className="text-gray-600">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'description', header: 'Keterangan', render: (v: any) => <div className="text-sm text-gray-700 max-w-xs truncate">{v || '-'}</div> },
    { key: 'method', header: 'Metode', render: (v: any) => (
      <span className="text-xs capitalize px-2 py-1 bg-gray-100 rounded">
        {v === 'cash' ? '💵 Cash' : v === 'transfer' ? '🏦 Transfer' : v === 'epos' ? '🏪 EPOS' : v || '-'}
      </span>
    )},
    { key: 'operator', header: 'Operator', render: (_v: any, r: any) => {
      const name = r.author?.name
      if (!name || name === 'System') return <span className="text-xs text-gray-400">System</span>
      return <span className="text-xs text-gray-700 font-medium">{name}</span>
    }},
    { key: 'created_at', header: 'Waktu', render: (v: any) => <div className="text-xs text-gray-500">{new Date(v).toLocaleString('id-ID')}</div> },
    { key: 'voided', header: 'Status', render: (v: any) => v
      ? <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">VOID</span>
      : <span className="text-xs text-green-600">✓</span>
    },
  ]

  const lastPage = meta?.last_page || 1
  const totalRows = meta?.total || transactions.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">📝 History Transaksi</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            className="btn text-sm text-gray-400 border border-gray-200 hover:border-red-300 hover:text-red-500"
            onClick={() => setShowDangerZone(v => !v)}
            title="Kelola data import"
          >
            ⚙️
          </button>
          {showDangerZone && (
            <button
              className="btn bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 text-sm"
              onClick={handleDeleteImportHistory}
              disabled={deletingImport}
              title="Hapus SEMUA history import Excel (MIGRATION transactions)"
            >
              {deletingImport ? '⏳ Menghapus...' : '🗑️ Hapus Semua History Import'}
            </button>
          )}
          <button className="btn btn-primary" onClick={exportCSV} disabled={totalRows === 0}>
            📥 Export CSV {totalRows > 0 && `(${totalRows.toLocaleString('id-ID')} data)`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="🔍 Cari nama / NIS santri"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm col-span-1 sm:col-span-2 lg:col-span-1"
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">Semua Tipe</option>
            <option value="credit">↑ Top-up</option>
            <option value="debit">↓ Debit</option>
          </select>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">Semua Metode</option>
            <option value="cash">💵 Cash</option>
            <option value="transfer">🏦 Transfer</option>
            <option value="epos">🏪 EPOS</option>
          </select>
          <select value={filterOperator} onChange={e => setFilterOperator(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">Semua Operator</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex items-center gap-1 text-sm">
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="border rounded px-2 py-2 flex-1 text-sm" />
            <span className="text-gray-400">–</span>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="border rounded px-2 py-2 flex-1 text-sm" />
          </div>
          <button onClick={resetFilters} className="btn text-sm text-gray-500 border border-gray-300 hover:bg-gray-50">
            Reset Filter
          </button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                Total <span className="font-semibold">{totalRows.toLocaleString('id-ID')}</span> transaksi
                {(search || filterType || filterMethod || filterStart || filterEnd) && (
                  <span className="ml-1 text-blue-600">(difilter)</span>
                )}
              </p>
              <p className="text-sm text-gray-400">Halaman {page} dari {lastPage}</p>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <div>Tidak ada transaksi</div>
              </div>
            ) : (
              <Table columns={columns} data={transactions} getRowKey={(r) => r.id} />
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t flex-wrap gap-2">
                <p className="text-sm text-gray-500">
                  Menampilkan {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, totalRows)} dari {totalRows.toLocaleString('id-ID')}
                </p>
                <div className="flex items-center gap-1">
                  <button className="btn btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                  <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
                  {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, lastPage - 4))
                    const p = start + i
                    return (
                      <button
                        key={p}
                        className={`btn btn-sm min-w-[2rem] ${p === page ? 'btn-primary' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button className="btn btn-sm" onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}>Next ›</button>
                  <button className="btn btn-sm" onClick={() => setPage(lastPage)} disabled={page === lastPage}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

