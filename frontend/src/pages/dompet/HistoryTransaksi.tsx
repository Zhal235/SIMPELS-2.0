import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { listWalletTransactions } from '../../api/wallet'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function HistoryTransaksi() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => { load() }, [location.search])

  async function load() {
    try {
      setLoading(true)
      const query = new URLSearchParams(location.search)
      const params: any = {}
      if (query.get('santri_id')) params.santri_id = query.get('santri_id')
      const res = await listWalletTransactions(params)
      if (res.success) setTransactions(res.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  function exportCSV() {
    if (!transactions.length) { toast.error('Tidak ada data untuk diexport'); return }
    const headers = ['id','wallet_id','type','amount','balance_after','description','reference','method','created_at']
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
    toast.success('Data berhasil diexport')
  }

  const columns = [
    { key: 'id', header: 'ID', render: (v: any) => <div className="text-xs font-mono">{String(v).substring(0, 8)}</div> },
    { key: 'santri_name', header: 'Santri', render: (v: any, r: any) => <div>{r.wallet?.santri?.nama_santri || '-'}</div> },
    { 
      key: 'type', 
      header: 'Tipe', 
      render: (v: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          v === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {v === 'credit' ? 'Top-up' : 'Debit'}
        </span>
      )
    },
    { key: 'amount', header: 'Nominal', render: (v: any) => <div className="font-semibold">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'balance_after', header: 'Saldo Setelah', render: (v: any) => <div>{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { key: 'description', header: 'Keterangan', render: (v: any) => <div className="text-sm">{v || '-'}</div> },
    { 
      key: 'method', 
      header: 'Metode', 
      render: (v: any) => (
        <span className="text-xs capitalize px-2 py-1 bg-gray-100 rounded">
          {v === 'cash' ? '💵 Cash' : v === 'transfer' ? '🏦 Transfer' : v === 'epos' ? '🏪 EPOS' : v || 'cash'}
        </span>
      )
    },
    { key: 'created_at', header: 'Waktu', render: (v: any) => <div className="text-xs">{new Date(v).toLocaleString('id-ID')}</div> },
    {
      key: 'voided',
      header: 'Status',
      render: (v: any) => v ? <span className="text-xs text-red-600 font-medium">VOID</span> : <span className="text-xs text-green-600">✓</span>
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📝 History Transaksi</h2>
        <button className="btn btn-primary" onClick={exportCSV} disabled={!transactions.length}>
          📥 Export CSV
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{transactions.length}</span> transaksi
              </p>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <div>Belum ada transaksi</div>
              </div>
            ) : (
              <Table columns={columns} data={transactions} getRowKey={(r) => r.id} />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
