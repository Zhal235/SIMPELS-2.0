import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getEposPool, listEposWithdrawals, createEposWithdrawal, approveEposWithdrawal, rejectEposWithdrawal } from '../../api/wallet'
import toast from 'react-hot-toast'

export default function Withdrawals() {
  const [pool, setPool] = useState<any | null>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [pRes, wRes] = await Promise.all([getEposPool(), listEposWithdrawals()])
      if (pRes.success) setPool(pRes.data)
      if (wRes.success) setWithdrawals(wRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Nominal tidak valid'); return }
    if (!requestedBy.trim()) { toast.error('Nama yang meminta tidak boleh kosong'); return }
    try {
      const res = await createEposWithdrawal(amt, note, requestedBy)
      if (res.success) {
        toast.success('Permintaan penarikan dibuat')
        setShowModal(false)
        setAmount('')
        setNote('')
        setRequestedBy('')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat penarikan')
    }
  }

  async function handleApprove(withdrawal: any) {
    if (!window.confirm(`Setujui penarikan ${withdrawal.withdrawal_number} sebesar Rp ${parseFloat(withdrawal.amount || 0).toLocaleString('id-ID')}?`)) {
      return
    }
    
    try {
      setProcessing(true)
      const res = await approveEposWithdrawal(withdrawal.id)
      if (res.success) {
        toast.success('Penarikan berhasil disetujui')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menyetujui penarikan')
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

  const columns = [
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
    { 
      key: 'requested_by', 
      header: 'Diminta oleh', 
      render: (v: any) => <div className="text-sm">{v || '-'}</div> 
    },
    { 
      key: 'period_start', 
      header: 'Periode', 
      render: (v: any, row: any) => (
        <div className="text-xs">
          {v && row.period_end ? `${new Date(v).toLocaleDateString('id-ID')} - ${new Date(row.period_end).toLocaleDateString('id-ID')}` : '-'}
        </div>
      ) 
    },
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
                onClick={() => handleApprove(row)}
                disabled={processing}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
              >
                Setujui
              </button>
              <button
                onClick={() => openRejectModal(row)}
                disabled={processing}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
              >
                Tolak
              </button>
            </>
          )}
          {row.status !== 'pending' && (
            <span className="text-xs text-gray-400">
              {row.status === 'approved' ? 'Disetujui' : 
               row.status === 'completed' ? 'Selesai' : 
               'Ditolak'}
            </span>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Penarikan ePOS</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => load()}>
            <span className="mr-2">🔄</span> Refresh
          </button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Saldo Pool ePOS</div>
                    <div className="text-xl font-bold text-brand">Rp {Number(pool?.balance || 0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="text-3xl">💰</div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-700">Pending Approval</div>
                    <div className="text-xl font-bold text-yellow-800">
                      {withdrawals.filter(w => w.status === 'pending').length} permintaan
                    </div>
                  </div>
                  <div className="text-3xl">⏳</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-700 mb-2 font-semibold">Daftar Permintaan Penarikan</h3>
              <Table columns={columns} data={withdrawals} getRowKey={(r) => r.id} />
            </div>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
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
