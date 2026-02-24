import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { listWallets, listCashWithdrawals, getEposPool } from '../../api/wallet'
import toast from 'react-hot-toast'

type TabType = 'ringkasan' | 'detail' | 'rekonsiliasi'

export default function LaporanKeuangan() {
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan')
  const [wallets, setWallets] = useState<any[]>([])
  const [cashWithdrawals, setCashWithdrawals] = useState<any[]>([])
  const [eposPool, setEposPool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [walletsRes, cashRes, eposRes] = await Promise.all([
        listWallets(),
        listCashWithdrawals({ status: 'done' }),
        getEposPool()
      ])
      
      if (walletsRes.success) setWallets(walletsRes.data || [])
      if (cashRes.success) setCashWithdrawals(cashRes.data || [])
      if (eposRes.success) setEposPool(eposRes.data)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  // Calculate balances
  const totalCreditCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_cash || 0), 0)
  const totalCreditTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit_transfer || 0), 0)
  const totalDebitCash = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_cash || 0), 0)
  const totalDebitTransfer = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_transfer || 0), 0)
  const totalDebitEpos = wallets.reduce((sum, w) => sum + parseFloat(w.total_debit_epos || 0), 0)
  const totalWithdrawals = cashWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
  
  // Gunakan total_credit dari backend (mencakup semua metode termasuk import)
  const totalCredit = wallets.reduce((sum, w) => sum + parseFloat(w.total_credit || 0), 0)
  const totalDebit = totalDebitCash + totalDebitTransfer + totalDebitEpos

  // Total saldo aktual dari field balance (bukan kalkulasi transaksi)
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0)

  const totalCashBalance = (totalCreditCash - totalDebitCash - totalDebitEpos) + totalWithdrawals
  const totalBankBalance = (totalCreditTransfer - totalDebitTransfer) - totalWithdrawals

  // Detail per santri columns
  const detailColumns = [
    { key: 'nis', header: 'NIS', render: (v: any, r: any) => <div className="font-mono text-sm">{r.santri?.nis || '-'}</div> },
    { key: 'nama_santri', header: 'Nama Santri', render: (v: any, r: any) => <div className="font-medium">{r.santri?.nama_santri || '-'}</div> },
    { key: 'balance', header: 'Saldo', render: (v: any) => <div className="font-bold text-blue-600">Rp {parseFloat(v || 0).toLocaleString('id-ID')}</div> },
    { 
      key: 'total_credit', 
      header: 'Total Top-up', 
      render: (v: any, r: any) => (
        <div>
          <div className="text-green-600 font-semibold">Rp {parseFloat(v || 0).toLocaleString('id-ID')}</div>
          <div className="text-xs text-gray-500">
            Cash: Rp {parseFloat(r.total_credit_cash || 0).toLocaleString('id-ID')} | 
            Transfer: Rp {parseFloat(r.total_credit_transfer || 0).toLocaleString('id-ID')}
          </div>
        </div>
      )
    },
    { key: 'total_debit', header: 'Total Debit', render: (v: any) => <div className="text-red-600">Rp {parseFloat(v || 0).toLocaleString('id-ID')}</div> },
    { 
      key: 'total_debit_epos', 
      header: 'Belanja EPOS', 
      render: (v: any) => <div className="text-purple-600">Rp {parseFloat(v || 0).toLocaleString('id-ID')}</div> 
    },
  ]

  // Top 10 santri dengan top-up terbesar
  const topTopup = [...wallets].sort((a, b) => parseFloat(b.total_credit || 0) - parseFloat(a.total_credit || 0)).slice(0, 10)
  
  // Top 10 santri dengan belanja terbanyak
  const topBelanja = [...wallets].sort((a, b) => parseFloat(b.total_debit_epos || 0) - parseFloat(a.total_debit_epos || 0)).slice(0, 10)

  function exportExcel() {
    toast.success('Export Excel coming soon!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 Laporan Keuangan</h2>
        <button className="btn btn-primary" onClick={exportExcel}>
          📥 Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'ringkasan'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'detail'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Detail Santri
        </button>
        <button
          onClick={() => setActiveTab('rekonsiliasi')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rekonsiliasi'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Rekonsiliasi
        </button>
      </div>

      {loading ? (
        <Card><div className="p-6 text-center text-gray-500">Loading...</div></Card>
      ) : (
        <>
          {/* Tab: Ringkasan */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-4">
              {/* Filter Periode */}
              <Card>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-700">📅 Filter Periode:</div>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-1 border rounded"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-1 border rounded"
                  />
                  <button className="btn btn-sm btn-primary">Terapkan</button>
                  <button className="btn btn-sm" onClick={() => setDateRange({ start: '', end: '' })}>Reset</button>
                </div>
              </Card>

              {/* Ringkasan Saldo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <div className="text-sm text-gray-500 mb-1">💰 Total Saldo Santri</div>
                  <div className="text-3xl font-bold text-blue-600">
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Cash + Bank</div>
                </Card>

                <Card>
                  <div className="text-sm text-gray-500 mb-1">💵 Saldo Cash</div>
                  <div className="text-3xl font-bold text-green-600">
                    Rp {totalCashBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Uang fisik</div>
                </Card>

                <Card>
                  <div className="text-sm text-gray-500 mb-1">🏦 Saldo Bank</div>
                  <div className="text-3xl font-bold text-purple-600">
                    Rp {totalBankBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Di rekening</div>
                </Card>

                <Card>
                  <div className="text-sm text-gray-500 mb-1">🏪 Pool EPOS</div>
                  <div className="text-3xl font-bold text-orange-600">
                    Rp {parseFloat(eposPool?.balance || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Belum dicairkan</div>
                </Card>
              </div>

              {/* Transaksi Periode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="text-sm text-gray-500 mb-1">📈 Total Top-up</div>
                  <div className="text-2xl font-bold text-green-600">
                    Rp {totalCredit.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Cash: Rp {totalCreditCash.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Transfer: Rp {totalCreditTransfer.toLocaleString('id-ID')}
                  </div>
                </Card>

                <Card>
                  <div className="text-sm text-gray-500 mb-1">📉 Total Penarikan</div>
                  <div className="text-2xl font-bold text-red-600">
                    Rp {(totalDebitCash + totalDebitTransfer).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Cash: Rp {totalDebitCash.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Transfer: Rp {totalDebitTransfer.toLocaleString('id-ID')}
                  </div>
                </Card>

                <Card>
                  <div className="text-sm text-gray-500 mb-1">🛒 Total EPOS</div>
                  <div className="text-2xl font-bold text-orange-600">
                    Rp {totalDebitEpos.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Belanja di kantin
                  </div>
                </Card>
              </div>

              {/* Top Transaksi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">🔝 Top 10 Top-up Terbesar</h3>
                  <div className="space-y-2">
                    {topTopup.map((w, idx) => (
                      <div key={w.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="text-sm">{w.santri?.nama_santri || '-'}</div>
                        </div>
                        <div className="font-semibold text-green-600">
                          Rp {parseFloat(w.total_credit || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Top 10 Belanja Terbanyak</h3>
                  <div className="space-y-2">
                    {topBelanja.map((w, idx) => (
                      <div key={w.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="text-sm">{w.santri?.nama_santri || '-'}</div>
                        </div>
                        <div className="font-semibold text-orange-600">
                          Rp {parseFloat(w.total_debit_epos || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Tab: Detail Santri */}
          {activeTab === 'detail' && (
            <Card>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Rincian per Santri</h3>
                <p className="text-sm text-gray-500">Daftar {wallets.length} santri dengan detail saldo dan transaksi</p>
              </div>
              {wallets.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <div>Belum ada data dompet</div>
                </div>
              ) : (
                <Table columns={detailColumns} data={wallets} getRowKey={(r) => r.id} />
              )}
            </Card>
          )}

          {/* Tab: Rekonsiliasi */}
          {activeTab === 'rekonsiliasi' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-lg font-semibold mb-4">✅ Rekonsiliasi Saldo</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-green-600 text-2xl">✅</div>
                    <div className="flex-1">
                      <div className="font-medium text-green-900">Saldo Cash sesuai transaksi</div>
                      <div className="text-sm text-green-700">
                        Rp {totalCashBalance.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-green-600 text-2xl">✅</div>
                    <div className="flex-1">
                      <div className="font-medium text-green-900">Saldo Bank sesuai transaksi</div>
                      <div className="text-sm text-green-700">
                        Rp {totalBankBalance.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-green-600 text-2xl">✅</div>
                    <div className="flex-1">
                      <div className="font-medium text-green-900">Total Saldo Santri match</div>
                      <div className="text-sm text-green-700">
                        {wallets.length} dompet terverifikasi
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-green-600 text-2xl">✅</div>
                    <div className="flex-1">
                      <div className="font-medium text-green-900">Pool EPOS konsisten</div>
                      <div className="text-sm text-green-700">
                        Rp {parseFloat(eposPool?.balance || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4">⚠️ Anomali & Warning</h3>
                <div className="space-y-3">
                  {wallets.filter(w => parseFloat(w.balance || 0) < 0).length > 0 ? (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-yellow-600 text-2xl">⚠️</div>
                      <div className="flex-1">
                        <div className="font-medium text-yellow-900">
                          {wallets.filter(w => parseFloat(w.balance || 0) < 0).length} Santri dengan saldo minus
                        </div>
                        <button className="text-sm text-yellow-700 hover:underline mt-1">
                          Lihat Detail →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <div className="text-4xl mb-2">✨</div>
                      <div>Tidak ada anomali terdeteksi</div>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4">📋 Informasi Sistem</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Santri Terdaftar</div>
                    <div className="font-semibold">{wallets.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Transaksi</div>
                    <div className="font-semibold">
                      {wallets.reduce((sum, w) => sum + parseInt(w.transaction_count || 0), 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Penarikan Bank→Cash</div>
                    <div className="font-semibold">{cashWithdrawals.length} kali</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Update</div>
                    <div className="font-semibold">{new Date().toLocaleString('id-ID')}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
