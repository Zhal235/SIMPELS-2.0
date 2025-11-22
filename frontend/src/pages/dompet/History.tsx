import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { listWalletTransactions, listWallets, createWithdrawal } from '../../api/wallet'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

type Mode = 'history' | 'laporan'

export default function History() {
  const [mode, setMode] = useState<Mode>('history')
  const [transactions, setTransactions] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const location = useLocation()

  useEffect(() => { load() }, [location.search, mode])

  async function load() {
    try {
      setLoading(true)
      if (mode === 'history') {
        const query = new URLSearchParams(location.search)
        const params: any = {}
        if (query.get('santri_id')) params.santri_id = query.get('santri_id')
        const res = await listWalletTransactions(params)
        if (res.success) setTransactions(res.data || [])
      } else {
        // Laporan mode: fetch all wallets
        const res = await listWallets()
        console.log('DEBUG listWallets response:', res)
        if (res.success) {
          console.log('DEBUG first wallet:', res.data?.[0])
          setWallets(res.data || [])
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  function exportCSV() {
    if (!transactions.length) { toast.error('Tidak ada data untuk diexport'); return }
    const headers = ['id','wallet_id','type','amount','balance_after','description','reference','created_at']
    const csvRows = [headers.join(',')]
    transactions.forEach((t:any) => {
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

  // Calculate totals for Laporan mode
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0)
  const totalCredit = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit || 0), 0)
  const totalDebit = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit || 0), 0)
  const totalCreditCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_cash || 0), 0)
  const totalCreditTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_transfer || 0), 0)
  const totalDebitCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_cash || 0), 0)
  const totalDebitTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_transfer || 0), 0)

  async function handleWithdraw() {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Masukkan nominal yang valid')
      return
    }
    const bankBalance = totalCreditTransfer - totalDebitTransfer
    if (withdrawAmount > bankBalance) {
      toast.error(`Saldo transfer tidak mencukupi (tersedia: Rp ${bankBalance.toLocaleString('id-ID')})`)
      return
    }
    try {
      const res = await createWithdrawal(Number(withdrawAmount), withdrawNote)
      if (res.success) {
        toast.success(`Tarik dana Rp ${parseFloat(String(withdrawAmount)).toLocaleString('id-ID')} berhasil`)
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setWithdrawNote('')
        load()
      } else {
        toast.error(res.message || 'Gagal tarik dana')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal tarik dana')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">History & Laporan Dompet</h2>
        {mode === 'history' && <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b">
        <button 
          className={`px-4 py-2 font-medium ${mode === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setMode('history')}
        >
          History Transaksi
        </button>
        <button 
          className={`px-4 py-2 font-medium ${mode === 'laporan' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setMode('laporan')}
        >
          Laporan Saldo
        </button>
      </div>

      {loading ? (
        <Card><div className="p-6 text-center text-gray-500">Memuat...</div></Card>
      ) : mode === 'history' ? (
        <Card>
          <div className="mb-3">
            <p className="text-sm text-gray-500">Menampilkan {transactions.length} transaksi</p>
          </div>
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Belum ada transaksi</div>
          ) : (
            <Table columns={historyColumns} data={transactions} getRowKey={(r) => r.id} />
          )}
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Saldo Keseluruhan</div>
              <div className="text-2xl font-bold text-blue-600">Rp {totalBalance.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Saldo Cash</div>
              <div className="text-2xl font-bold text-gray-700">Rp {(totalCreditCash - totalDebitCash).toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 mt-1">Masuk: Rp {totalCreditCash.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500">Keluar: Rp {totalDebitCash.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1 flex items-center justify-between">
                <span>Saldo Bank/Transfer</span>
                <button className="text-blue-600 text-xs hover:underline" onClick={() => setShowWithdrawModal(true)}>Tarik Dana</button>
              </div>
              <div className="text-2xl font-bold text-purple-600">Rp {(totalCreditTransfer - totalDebitTransfer).toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500 mt-1">Masuk: Rp {totalCreditTransfer.toLocaleString('id-ID')}</div>
              <div className="text-xs text-gray-500">Keluar: Rp {totalDebitTransfer.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Credit</div>
              <div className="text-2xl font-bold text-green-600">Rp {totalCredit.toLocaleString('id-ID')}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Debit</div>
              <div className="text-2xl font-bold text-red-600">Rp {totalDebit.toLocaleString('id-ID')}</div>
            </Card>
          </div>

          {/* Per-Santri Breakdown */}
          <Card>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Rincian per Santri</h3>
              <p className="text-sm text-gray-500">Daftar {wallets.length} santri dengan saldo dan transaksi</p>
            </div>
            {wallets.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Belum ada data dompet</div>
            ) : (
              <Table columns={laporanColumns} data={wallets} getRowKey={(r) => r.id} />
            )}
          </Card>
        </>
      )}

      {/* Modal Tarik Dana */}
      <Modal
        open={showWithdrawModal}
        title="Tarik Dana dari Bank ke Cash"
        onClose={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawNote('') }}
        footer={(
          <>
            <button className="btn" onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawNote('') }}>Batal</button>
            <button className="btn btn-primary" onClick={handleWithdraw}>Tarik Dana</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">Saldo Bank/Transfer tersedia:</div>
            <div className="text-2xl font-bold text-purple-600">Rp {(totalCreditTransfer - totalDebitTransfer).toLocaleString('id-ID')}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nominal Tarik Dana (Rp)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value ? parseFloat(e.target.value) : '')}
              min="0"
              step="1000"
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Masukkan nominal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
            <textarea
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              rows={3}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Catatan tarik dana..."
            />
          </div>
          <div className="text-xs text-gray-500">
            Dana akan dipindahkan dari saldo transfer ke cash untuk operasional.
          </div>
        </div>
      </Modal>
    </div>
  )
}
