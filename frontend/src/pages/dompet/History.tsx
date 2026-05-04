import React, { useEffect, useState, useMemo, useCallback } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { listWalletTransactions, listWallets, createWithdrawal, listCashWithdrawals } from '../../api/wallet'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

type Mode = 'history' | 'laporan'

// Default: bulan ini
const getNow = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${lastDay}`,
  }
}

export default function History() {
  const [mode, setMode] = useState<Mode>('history')
  const [transactions, setTransactions] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const location = useLocation()

  // Pagination
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, last_page: 1, per_page: 50 })

  // Filter tanggal — default bulan ini
  const { start: defaultStart, end: defaultEnd } = getNow()
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [tempStart, setTempStart] = useState(defaultStart)
  const [tempEnd, setTempEnd] = useState(defaultEnd)
  const [isDefaultMonth, setIsDefaultMonth] = useState(true)

  useEffect(() => {
    setPage(1)
    load(1, startDate, endDate)
  }, [mode, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (p = page, s = startDate, e = endDate) => {
    try {
      setLoading(true)
      if (mode === 'history') {
        const query = new URLSearchParams(location.search)
        const params: any = { page: p, per_page: 50, start: s, end: e }
        if (query.get('santri_id')) params.santri_id = query.get('santri_id')
        const res = await listWalletTransactions(params)
        if (res.success) {
          setTransactions(res.data || [])
          if (res.meta) setMeta(res.meta)
        }
      } else {
        const [walletsRes, cashWithdrawalsRes] = await Promise.all([
          listWallets(),
          listCashWithdrawals({ status: 'done' })
        ])
        if (walletsRes.success) setWallets(walletsRes.data || [])
        if (cashWithdrawalsRes.success) setWithdrawals(cashWithdrawalsRes.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }, [mode, location.search, page, startDate, endDate])

  const handleTerapkan = () => {
    setStartDate(tempStart)
    setEndDate(tempEnd)
    setIsDefaultMonth(false)
    setPage(1)
    load(1, tempStart, tempEnd)
  }

  const handleReset = () => {
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    setTempStart(defaultStart)
    setTempEnd(defaultEnd)
    setIsDefaultMonth(true)
    setPage(1)
    load(1, defaultStart, defaultEnd)
  }

  const handlePageChange = (p: number) => {
    setPage(p)
    load(p, startDate, endDate)
  }

  function exportCSV() {
    if (!transactions.length) { toast.error('Tidak ada data untuk diexport'); return }
    const headers = ['id', 'wallet_id', 'type', 'amount', 'balance_after', 'description', 'reference', 'created_at']
    const csvRows = [headers.join(',')]
    transactions.forEach((t: any) => {
      csvRows.push(headers.map(h => JSON.stringify(t[h] ?? '')).join(','))
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dompet_transactions_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const historyColumns = [
    { key: 'id', header: 'ID', render: (v: any) => <div className="text-xs font-mono">{String(v).substring(0, 8)}</div> },
    { key: 'santri_name', header: 'Santri', render: (v: any, r: any) => <div>{r.wallet?.santri?.nama_santri || '-'}</div> },
    { key: 'type', header: 'Tipe', render: (v: any) => <span className={`px-2 py-1 rounded text-xs ${v === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v === 'credit' ? 'Topup' : 'Debit'}</span> },
    { key: 'amount', header: 'Nominal', render: (v: any) => <div>{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'balance_after', header: 'Saldo Setelah', render: (v: any) => <div>{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'description', header: 'Keterangan' },
    { key: 'method', header: 'Metode', render: (v: any) => <span className="text-xs capitalize">{v || 'cash'}</span> },
    { key: 'created_at', header: 'Waktu', render: (v: any) => <div className="text-xs">{new Date(v).toLocaleString('id-ID')}</div> },
  ]

  const laporanColumns = [
    { key: 'nis', header: 'NIS', render: (v: any, r: any) => <div>{r.santri?.nis || '-'}</div> },
    { key: 'nama_santri', header: 'Nama Santri', render: (v: any, r: any) => <div>{r.santri?.nama_santri || '-'}</div> },
    { key: 'balance', header: 'Saldo', render: (v: any) => <div className="font-semibold">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'total_credit', header: 'Total Credit', render: (v: any) => <div className="text-green-600">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'total_debit', header: 'Total Debit', render: (v: any) => <div className="text-red-600">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
  ]

  // useMemo: hitung total hanya saat wallets/withdrawals berubah
  const totals = useMemo(() => {
    const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance || 0), 0)
    const totalCreditCash = wallets.reduce((s, w) => s + parseFloat(w.total_credit_cash || 0), 0)
    const totalCreditTransfer = wallets.reduce((s, w) => s + parseFloat(w.total_credit_transfer || 0), 0)
    const totalDebitCash = wallets.reduce((s, w) => s + parseFloat(w.total_debit_cash || 0), 0)
    const totalDebitTransfer = wallets.reduce((s, w) => s + parseFloat(w.total_debit_transfer || 0), 0)
    const totalDebitEpos = wallets.reduce((s, w) => s + parseFloat(w.total_debit_epos || 0), 0)
    const totalWithdrawals = withdrawals.reduce((s, w) => s + parseFloat(w.amount || 0), 0)
    const totalCashBalance = (totalCreditCash - totalDebitCash - totalDebitEpos) + totalWithdrawals
    const totalBankBalance = (totalCreditTransfer - totalDebitTransfer) - totalWithdrawals
    return {
      totalBalance, totalCreditCash, totalCreditTransfer,
      totalDebitCash, totalDebitTransfer, totalDebitEpos,
      totalWithdrawals, totalCashBalance, totalBankBalance,
      totalCredit: totalCreditCash + totalCreditTransfer,
      totalDebit: totalDebitCash + totalDebitTransfer + totalDebitEpos,
    }
  }, [wallets, withdrawals])

  async function handleWithdraw() {
    if (!withdrawAmount || withdrawAmount <= 0) { toast.error('Masukkan nominal yang valid'); return }
    if (withdrawAmount > totals.totalBankBalance) {
      toast.error(`Saldo transfer tidak mencukupi (tersedia: Rp ${totals.totalBankBalance.toLocaleString('id-ID')})`); return
    }
    try {
      const res = await createWithdrawal(Number(withdrawAmount), withdrawNote)
      if (res.success) {
        toast.success(`Tarik dana Rp ${parseFloat(String(withdrawAmount)).toLocaleString('id-ID')} berhasil`)
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setWithdrawNote('')
        load()
      } else { toast.error(res.message || 'Gagal tarik dana') }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Gagal tarik dana') }
  }

  const formatTgl = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">History & Laporan Dompet</h2>
        {mode === 'history' && <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b">
        <button className={`px-4 py-2 font-medium ${mode === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`} onClick={() => setMode('history')}>
          History Transaksi
        </button>
        <button className={`px-4 py-2 font-medium ${mode === 'laporan' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`} onClick={() => setMode('laporan')}>
          Laporan Saldo
        </button>
      </div>

      {/* Filter Tanggal (hanya di mode history) */}
      {mode === 'history' && (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Periode:</span>
            <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400">–</span>
            <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleTerapkan} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Terapkan</button>
            <button onClick={handleReset} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm flex items-center gap-1" title="Reset ke bulan ini"><X className="w-3.5 h-3.5" /></button>
            {isDefaultMonth && (
              <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                Menampilkan bulan ini ({formatTgl(startDate)} – {formatTgl(endDate)})
              </span>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <Card><div className="p-6 text-center text-gray-500">Memuat...</div></Card>
      ) : mode === 'history' ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {((page - 1) * meta.per_page) + 1}–{Math.min(page * meta.per_page, meta.total)} dari {meta.total} transaksi
            </p>
          </div>
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Belum ada transaksi pada periode ini</div>
          ) : (
            <Table columns={historyColumns} data={transactions} getRowKey={(r) => r.id} />
          )}
          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => handlePageChange(1)} disabled={page === 1} className="px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">«</button>
              <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">‹</button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p); return acc
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                  : <button key={p} onClick={() => handlePageChange(p as number)} className={`px-3 py-1 text-sm rounded border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white hover:bg-gray-100'}`}>{p}</button>
                )}
              <button onClick={() => handlePageChange(page + 1)} disabled={page === meta.last_page} className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">›</button>
              <button onClick={() => handlePageChange(meta.last_page)} disabled={page === meta.last_page} className="px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">»</button>
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Saldo Keseluruhan</div>
              <div className="text-2xl font-bold text-blue-600">Rp {(totals.totalCashBalance + totals.totalBankBalance).toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 mt-1">Cash + Bank</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Saldo Cash</div>
              <div className="text-2xl font-bold text-gray-700">Rp {totals.totalCashBalance.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 mt-1">Masuk: Rp {totals.totalCreditCash.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500">Keluar: Rp {totals.totalDebitCash.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1 flex items-center justify-between">
                <span>Saldo Bank/Transfer</span>
                <button className="text-blue-600 text-xs hover:underline" onClick={() => setShowWithdrawModal(true)}>Tarik Dana</button>
              </div>
              <div className="text-2xl font-bold text-purple-600">Rp {totals.totalBankBalance.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 mt-1">Masuk: Rp {totals.totalCreditTransfer.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500">Keluar: Rp {totals.totalDebitTransfer.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Credit</div>
              <div className="text-2xl font-bold text-green-600">Rp {totals.totalCredit.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Debit</div>
              <div className="text-2xl font-bold text-red-600">Rp {totals.totalDebit.toLocaleString('id-ID')}</div>
            </Card>
          </div>
          <Card>
            <Table columns={laporanColumns} data={wallets} getRowKey={(r) => r.id} />
          </Card>
        </>
      )}

      {showWithdrawModal && (
        <Modal open={showWithdrawModal} title="Tarik Dana dari Transfer ke Cash" onClose={() => setShowWithdrawModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(Number(e.target.value))} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Saldo transfer tersedia: Rp {totals.totalBankBalance.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleWithdraw} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tarik Dana</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
