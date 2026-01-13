import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getEposPool, listEposWithdrawals, createEposWithdrawal, approveEposWithdrawal, rejectEposWithdrawal, createWithdrawal, listCashWithdrawals, getBalances } from '../../api/wallet'
import toast from 'react-hot-toast'

export default function ManajemenKeuangan() {
  const [activeTab, setActiveTab] = useState<'cash-bank' | 'epos'>('cash-bank')
  
  // Cash & Bank State
  const [cashBalance, setCashBalance] = useState(0)
  const [bankBalance, setBankBalance] = useState(0)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [cashWithdrawals, setCashWithdrawals] = useState<any[]>([])
  
  // EPOS State
  const [pool, setPool] = useState<any | null>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEposModal, setShowEposModal] = useState(false)
  const [eposAmount, setEposAmount] = useState('')
  const [eposNote, setEposNote] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')

  useEffect(() => { load() }, [activeTab])

  async function load() {
    try {
      setLoading(true)
      if (activeTab === 'cash-bank') {
        // Fetch real cash & bank balance from API
        const [balRes, cwRes] = await Promise.all([
          getBalances(),
          listCashWithdrawals()
        ])
        
        if (balRes.success) {
          setCashBalance(balRes.data.cash_balance || 0)
          setBankBalance(balRes.data.bank_balance || 0)
        }
        if (cwRes.success) setCashWithdrawals(cwRes.data || [])
      } else {
        const [pRes, wRes] = await Promise.all([getEposPool(), listEposWithdrawals()])
        if (pRes.success) setPool(pRes.data)
        if (wRes.success) setWithdrawals(wRes.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  // Cash & Bank Functions
  async function handleWithdrawCash(e?: React.FormEvent) {
    e?.preventDefault()
    const amt = Number(withdrawAmount)
    if (!amt || amt <= 0) { toast.error('Nominal tidak valid'); return }
    if (amt > bankBalance) { toast.error('Saldo Bank tidak mencukupi'); return }
    
    try {
      const res = await createWithdrawal(amt, withdrawNote)
      if (res.success) {
        toast.success('Penarikan Bank → Cash berhasil')
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setWithdrawNote('')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal melakukan penarikan')
    }
  }

  // EPOS Functions
  async function handleCreateEpos(e?: React.FormEvent) {
    e?.preventDefault()
    const amt = Number(eposAmount)
    if (!amt || amt <= 0) { toast.error('Nominal tidak valid'); return }
    if (!requestedBy.trim()) { toast.error('Nama yang meminta tidak boleh kosong'); return }
    
    try {
      const res = await createEposWithdrawal(amt, eposNote, requestedBy)
      if (res.success) {
        toast.success('Permintaan penarikan dibuat')
        setShowEposModal(false)
        setEposAmount('')
        setEposNote('')
        setRequestedBy('')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat penarikan')
    }
  }

  function openApproveModal(withdrawal: any) {
    setSelectedWithdrawal(withdrawal)
    setPaymentMethod('cash')
    setShowApproveModal(true)
  }

  async function handleApprove(e?: React.FormEvent) {
    e?.preventDefault()
    
    try {
      setProcessing(true)
      const res = await approveEposWithdrawal(selectedWithdrawal.id, paymentMethod)
      if (res.success) {
        toast.success('Penarikan berhasil disetujui')
        setShowApproveModal(false)
        setSelectedWithdrawal(null)
        load()
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err?.response?.data?.message || 'Gagal menyetujui penarikan'
      const hint = err?.response?.data?.data?.hint
      if (hint) {
        toast.error(`${errorMsg}\n${hint}`, { duration: 6000 })
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setProcessing(false)
    }
  }

  function openRejectModal(withdrawal: any) {
    setSelectedWithdrawal(withdrawal)
    setRejectReason('')
    setShowRejectModal(true)
  }

  async function handleReject(e?: React.FormEvent) {
    e?.preventDefault()
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error('Alasan penolakan minimal 5 karakter')
      return
    }

    try {
      setProcessing(true)
      const res = await rejectEposWithdrawal(selectedWithdrawal.id, rejectReason)
      if (res.success) {
        toast.success('Penarikan berhasil ditolak')
        setShowRejectModal(false)
        setSelectedWithdrawal(null)
        setRejectReason('')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menolak penarikan')
    } finally {
      setProcessing(false)
    }
  }

  // Table columns for EPOS
  const eposColumns = [
    { key: 'withdrawal_number', header: 'Nomor', render: (v: any) => <div className="text-sm font-mono">{v}</div> },
    { key: 'amount', header: 'Nominal', render: (v: any) => <div className="font-semibold">{`Rp ${parseFloat(v || 0).toLocaleString('id-ID')}`}</div> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v: any, row: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          v === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
          v === 'approved' ? 'bg-green-100 text-green-700' : 
          v === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {row.status_label || v}
        </span>
      ) 
    },
    { key: 'requested_by', header: 'Diminta oleh', render: (v: any) => <div className="text-sm">{v || '-'}</div> },
    { 
      key: 'created_at', 
      header: 'Waktu Pengajuan', 
      render: (v: any) => <div className="text-xs">{new Date(v).toLocaleString('id-ID')}</div> 
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (_: any, row: any) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => openApproveModal(row)}
                className="btn btn-sm btn-success"
                disabled={processing}
              >
                Setujui
              </button>
              <button
                onClick={() => openRejectModal(row)}
                className="btn btn-sm btn-danger"
                disabled={processing}
              >
                Tolak
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  // Table columns for Cash Withdrawals
  const cashWithdrawalColumns = [
    { key: 'created_at', header: 'Tanggal', render: (v: any) => <div className="text-sm">{new Date(v).toLocaleDateString('id-ID')}</div> },
    { key: 'amount', header: 'Nominal', render: (v: any) => <div className="font-semibold text-green-600">Rp {parseFloat(v || 0).toLocaleString('id-ID')}</div> },
    { key: 'notes', header: 'Catatan', render: (v: any) => <div className="text-sm">{v?.replace('CASH_TRANSFER: ', '') || '-'}</div> },
    { key: 'epos_ref', header: 'Referensi', render: (v: any) => <div className="text-xs font-mono">{v || '-'}</div> },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">💰 Manajemen Keuangan</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('cash-bank')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'cash-bank'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💵 Cash & Bank
        </button>
        <button
          onClick={() => setActiveTab('epos')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'epos'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏪 Pool EPOS
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'cash-bank' && (
        <div className="space-y-4">
          <Card>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1">💵 Saldo Cash</div>
                    <div className="text-3xl font-bold text-green-900">
                      Rp {cashBalance.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1">🏦 Saldo Bank</div>
                    <div className="text-3xl font-bold text-blue-900">
                      Rp {bankBalance.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="btn btn-primary"
                  >
                    💸 Tarik Dana Bank → Cash
                  </button>
                </div>

                {/* History Table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">History Penarikan Bank → Cash</h3>
                  <Table columns={cashWithdrawalColumns} data={cashWithdrawals} getRowKey={(r) => r.withdrawal_id || r.id} />
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'epos' && (
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Pool Info */}
              {pool && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-700 mb-1">🏪 Saldo Pool EPOS</div>
                      <div className="text-3xl font-bold text-purple-900">
                        Rp {parseFloat(pool.balance || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-purple-600 mt-2">
                        Akumulasi transaksi EPOS belum dicairkan
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEposModal(true)}
                      className="btn btn-primary"
                    >
                      + Buat Permintaan Penarikan
                    </button>
                  </div>
                </div>
              )}

              {/* Withdrawals List */}
              <div>
                <h3 className="text-sm text-gray-700 mb-2 font-semibold">Daftar Permintaan Penarikan</h3>
                <Table columns={eposColumns} data={withdrawals} getRowKey={(r) => r.id} />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Tarik Dana Bank → Cash */}
      <Modal
        open={showWithdrawModal}
        title="Tarik Dana Bank → Cash"
        onClose={() => setShowWithdrawModal(false)}
        footer={(
          <>
            <button className="btn" onClick={() => setShowWithdrawModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={(e) => handleWithdrawCash(e as any)}>
              Konfirmasi Tarik Dana
            </button>
          </>
        )}
      >
        <form onSubmit={handleWithdrawCash} className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <div className="font-medium text-blue-900 mb-1">Saldo Bank Saat Ini</div>
            <div className="text-2xl font-bold text-blue-700">
              Rp {bankBalance.toLocaleString('id-ID')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nominal (Rp) *</label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ''))}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Contoh: 1000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
            <textarea
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Alasan penarikan..."
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            ⚠️ Dana akan dipindahkan dari saldo Bank ke saldo Cash untuk operasional harian.
          </div>
        </form>
      </Modal>

      {/* Modal: Create EPOS Withdrawal */}
      <Modal
        open={showEposModal}
        title="Buat Permintaan Penarikan EPOS"
        onClose={() => setShowEposModal(false)}
        footer={(
          <>
            <button className="btn" onClick={() => setShowEposModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={(e) => handleCreateEpos(e as any)}>
              Buat Permintaan
            </button>
          </>
        )}
      >
        <form onSubmit={handleCreateEpos} className="space-y-3">
          {pool && (
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
              <div className="font-medium text-purple-900 mb-1">Saldo Pool EPOS</div>
              <div className="text-2xl font-bold text-purple-700">
                Rp {parseFloat(pool.balance || 0).toLocaleString('id-ID')}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Nominal (Rp) *</label>
            <input
              type="text"
              value={eposAmount}
              onChange={(e) => setEposAmount(e.target.value.replace(/\D/g, ''))}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Contoh: 500000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Diminta oleh *</label>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Nama bendahara EPOS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
            <textarea
              value={eposNote}
              onChange={(e) => setEposNote(e.target.value)}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Keterangan penarikan..."
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Approve EPOS Withdrawal */}
      <Modal
        open={showApproveModal}
        title="Setujui Penarikan EPOS"
        onClose={() => {
          setShowApproveModal(false)
          setSelectedWithdrawal(null)
        }}
        footer={(
          <>
            <button
              className="btn"
              onClick={() => {
                setShowApproveModal(false)
                setSelectedWithdrawal(null)
              }}
              disabled={processing}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={(e) => handleApprove(e as any)}
              disabled={processing}
            >
              {processing ? 'Memproses...' : 'Setujui Penarikan'}
            </button>
          </>
        )}
      >
        <form onSubmit={handleApprove} className="space-y-4">
          {selectedWithdrawal && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Nomor Penarikan</div>
              <div className="font-mono font-semibold">{selectedWithdrawal.withdrawal_number}</div>
              <div className="text-xs text-gray-500 mt-2">Nominal</div>
              <div className="font-bold text-green-600">
                Rp {parseFloat(selectedWithdrawal.amount || 0).toLocaleString('id-ID')}
              </div>
              {selectedWithdrawal.requested_by && (
                <>
                  <div className="text-xs text-gray-500 mt-2">Diminta oleh</div>
                  <div className="text-sm">{selectedWithdrawal.requested_by}</div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Metode Pembayaran *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'cash' ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'cash' && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <span className="font-semibold">💵 Cash</span>
                </div>
                <div className="text-xs text-gray-600">
                  Bayar dari saldo Cash sekolah
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'transfer' ? 'border-blue-600' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'transfer' && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <span className="font-semibold">🏦 Transfer</span>
                </div>
                <div className="text-xs text-gray-600">
                  Bayar dari saldo Bank sekolah
                </div>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <div className="font-medium text-yellow-800 mb-1">⚠️ Perhatian</div>
            <div className="text-yellow-700 text-xs">
              Pastikan saldo {paymentMethod === 'cash' ? 'Cash' : 'Bank'} mencukupi sebelum menyetujui penarikan.
              {paymentMethod === 'cash' && ' Jika saldo Cash kurang, lakukan penarikan dari Bank ke Cash terlebih dahulu.'}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject EPOS Withdrawal */}
      <Modal
        open={showRejectModal}
        title="Tolak Penarikan"
        onClose={() => {
          setShowRejectModal(false)
          setSelectedWithdrawal(null)
          setRejectReason('')
        }}
        footer={(
          <>
            <button
              className="btn"
              onClick={() => {
                setShowRejectModal(false)
                setSelectedWithdrawal(null)
                setRejectReason('')
              }}
              disabled={processing}
            >
              Batal
            </button>
            <button
              className="btn btn-danger"
              onClick={(e) => handleReject(e as any)}
              disabled={processing || !rejectReason.trim() || rejectReason.trim().length < 5}
            >
              {processing ? 'Memproses...' : 'Tolak'}
            </button>
          </>
        )}
      >
        <form onSubmit={handleReject} className="space-y-3">
          {selectedWithdrawal && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">Nomor Penarikan</div>
              <div className="font-mono font-semibold">{selectedWithdrawal.withdrawal_number}</div>
              <div className="text-xs text-gray-500 mt-2">Nominal</div>
              <div className="font-bold text-red-600">
                Rp {parseFloat(selectedWithdrawal.amount || 0).toLocaleString('id-ID')}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Alasan Penolakan *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-md border px-3 py-2 w-full"
              placeholder="Jelaskan alasan penolakan (minimal 5 karakter)"
              rows={4}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {rejectReason.trim().length} / 5 karakter minimum
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
