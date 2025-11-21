import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getEposPool, listWithdrawals, createWithdrawal } from '../../api/wallet'
import toast from 'react-hot-toast'

export default function Withdrawals() {
  const [pool, setPool] = useState<any | null>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [pRes, wRes] = await Promise.all([getEposPool(), listWithdrawals()])
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
    try {
      const res = await createWithdrawal(amt, note)
      if (res.success) {
        toast.success('Permintaan penarikan dibuat')
        setShowModal(false)
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat penarikan')
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'amount', header: 'Nominal' },
    { key: 'status', header: 'Status' },
    { key: 'requested_by', header: 'Diminta oleh' },
    { key: 'processed_by', header: 'Diproses oleh' },
    { key: 'created_at', header: 'Waktu' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Penarikan (ePOS)</h2>
        <div className="flex gap-2"><button className="btn btn-primary" onClick={() => setShowModal(true)}>Buat Penarikan</button></div>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat...</div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-white border rounded shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Saldo Pool ePOS</div>
                  <div className="text-xl font-bold text-brand">Rp {Number(pool?.balance || 0).toLocaleString('id-ID')}</div>
                </div>
                <div className="text-sm text-gray-400">Pool name: {pool?.name}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-700 mb-2">Daftar penarikan</h3>
              <Table columns={columns} data={withdrawals} getRowKey={(r) => r.id} />
            </div>
          </div>
        )}
      </Card>

      <Modal open={showModal} title="Buat Penarikan" onClose={() => setShowModal(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowModal(false)}>Batal</button>
          <button className="btn btn-primary" onClick={(e) => handleCreate(e as any)}>Buat</button>
        </>
      )}>
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block text-sm">Nominal (Rp)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-md border px-3 py-2 w-full" />
          <label className="block text-sm">Catatan (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-md border px-3 py-2 w-full" />
        </form>
      </Modal>
    </div>
  )
}
