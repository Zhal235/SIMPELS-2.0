import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { topupWallet, getWallet, getWalletTransactions, debitWallet, updateTransaction, voidTransaction } from '../../api/wallet'
import { listSantri } from '../../api/santri'
import { Search } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'

export default function DompetSantri() {
  // wallets list is no longer shown globally — we only load wallet per selected santri
  const [loading, setLoading] = useState(true)
  const [santriList, setSantriList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null)
  const [walletDetail, setWalletDetail] = useState<any | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTxn, setEditingTxn] = useState<any | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editMethod, setEditMethod] = useState<'cash' | 'transfer' | 'epos' | null>('cash')
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)

  // Topup / Tarik states
  const [showTopup, setShowTopup] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')

  const currentUser = useAuthStore((s) => s.user)

  useEffect(() => { loadInitial() }, [])

  async function loadInitial() {
    try {
      setLoading(true)
      const santriRes = await listSantri(1, 200)
      if (santriRes?.status === 'success') setSantriList(santriRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally { setLoading(false) }
  }

  // openTopup not used after removing global wallet list

  async function submitTopup(e?: React.FormEvent) {
    e?.preventDefault()
    if (!selectedSantri) return
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Masukkan nominal top-up yang valid'); return }

    try {
      const id = selectedSantri?.id || selectedSantri?.santri_id || selectedSantri?.santri_id
      const res = await topupWallet(id, amt, note || undefined, method)
      if (res.success) {
        toast.success('Top-up berhasil')
          // refresh wallet detail and transactions
          const updated = await getWallet(id)
          if (updated.success) setWalletDetail(updated.data)
        // refresh transactions for selected santri
        const txn = await getWalletTransactions(id)
        if (txn.success) setTransactions(txn.data || [])
        setShowTopup(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal melakukan top-up')
    }
  }

  async function handleSelectSantri(santri: any) {
    setSelectedSantri(santri)
    setSearchQuery(santri.nama_santri)
    setShowSearchResults(false)

    try {
      const [wRes, tRes] = await Promise.all([getWallet(santri.id), getWalletTransactions(santri.id)])
      if (wRes.success) setWalletDetail(wRes.data)
      if (tRes.success) setTransactions(tRes.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data dompet/riwayat')
    }
  }

  async function submitWithdraw(e?: React.FormEvent) {
    e?.preventDefault()
    if (!selectedSantri) return
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Masukkan nominal yang valid'); return }

    try {
      const id = selectedSantri?.id || selectedSantri?.santri_id || selectedSantri?.santri_id
      const res = await debitWallet(id, amt, note || undefined, method)
      if (res.success) {
        toast.success('Penarikan berhasil')
          const updated = await getWallet(id)
          if (updated.success) setWalletDetail(updated.data)
        setShowWithdraw(false)
        // reload transactions
        const txn = await getWalletTransactions(id)
        if (txn.success) setTransactions(txn.data || [])
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal melakukan penarikan')
    }
  }

  async function submitEditTransaction(e?: React.FormEvent) {
    e?.preventDefault()
    if (!editingTxn || !selectedSantri) return
    const id = editingTxn.id
    const amt = Number(editAmount)
    if (!amt || amt <= 0) { toast.error('Masukkan nominal yang valid'); return }

    try {
      const res = await updateTransaction(id, { amount: amt, description: editDesc || undefined, method: editMethod || undefined })
      if (res.success) {
        toast.success('Transaksi berhasil diubah')
        // refresh wallet + transactions
        const w = await getWallet(selectedSantri.id)
        if (w.success) setWalletDetail(w.data)
        const t = await getWalletTransactions(selectedSantri.id)
        if (t.success) setTransactions(t.data || [])
        setShowEditModal(false)
        setEditingTxn(null)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal mengubah transaksi')
    }
  }

  async function confirmVoidTransaction() {
    if (!editingTxn || !selectedSantri) return
    try {
      const res = await voidTransaction(editingTxn.id)
      if (res.success) {
        toast.success('Transaksi berhasil dihapus (void)')
        const w = await getWallet(selectedSantri.id)
        if (w.success) setWalletDetail(w.data)
        const t = await getWalletTransactions(selectedSantri.id)
        if (t.success) setTransactions(t.data || [])
        setShowVoidConfirm(false)
        setEditingTxn(null)
      }
    } catch (err:any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menghapus transaksi')
    }
  }

  // No global wallet table — we only show per-santri wallet after search selection

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dompet Santri</h1>
          <p className="text-gray-600 mt-1">Kelola saldo dan top-up santri</p>
        </div>
        <div className="w-96">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama santri atau NIS..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(e.target.value.length >= 2) }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); setSelectedSantri(null) }} className="absolute right-3 top-2.5 text-gray-400">✕</button>
            )}

            {showSearchResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {santriList.filter(s => (s.nama_santri || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.nis || '').includes(searchQuery)).map(s => (
                  <button key={s.id} onClick={() => handleSelectSantri(s)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-3">
                    <img src={s.foto ? (s.foto.startsWith('http') ? s.foto : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${s.foto}`) : `https://api.dicebear.com/7.x/identicon/svg?seed=${s.nama_santri}`} alt={s.nama_santri} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.nama_santri}</p>
                      <p className="text-xs text-gray-500">NIS: {s.nis} • {s.kelas || 'N/A'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* search moved to top header — no separate search block here */}

      {/* Show placeholder like PembayaranSantri when no santri selected */}
      {!selectedSantri && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cari Santri</h3>
          <p className="text-gray-500">Gunakan kotak pencarian di sebelah kanan untuk mencari dan memilih santri</p>
        </div>
      )}

      {selectedSantri && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6 mb-2 flex items-start gap-6">
            <img src={(selectedSantri.foto && (selectedSantri.foto.startsWith('http') ? selectedSantri.foto : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${selectedSantri.foto}`)) || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedSantri.nama_santri}`} alt={selectedSantri.nama_santri} className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nama Santri</p>
                <p className="font-semibold text-gray-900">{selectedSantri.nama_santri}</p>
                <p className="text-xs text-gray-500 mt-2">NIS: {selectedSantri.nis}</p>
                <p className="text-xs text-gray-500">Kelas: {selectedSantri.kelas || 'N/A'}</p>
              </div>
              <div>
                <div className="text-sm text-gray-500">Saldo Saat Ini</div>
                <div className="text-2xl font-bold text-brand">Rp {Number(walletDetail?.balance ?? 0).toLocaleString('id-ID')}</div>
                <div className="text-xs text-gray-400 mt-1">{walletDetail ? `Terakhir diupdate: ${new Date(walletDetail.updated_at).toLocaleString('id-ID')}` : ''}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setMethod('cash'); setAmount(''); setNote(''); setShowTopup(true) }} className="px-4 py-2 bg-green-600 text-white rounded-lg">Setor</button>
            <button onClick={() => { setMethod('cash'); setAmount(''); setNote(''); setShowWithdraw(true) }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Tarik</button>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Riwayat Transaksi</h3>
              <div className="text-sm text-gray-500">{transactions.length} catatan</div>
            </div>
            <Table
              columns={[
                { key: 'reference', header: 'No Ref' },
                { key: 'created_at', header: 'Tanggal / Jam', render: (_v:any, r:any) => new Date(r.created_at).toLocaleString('id-ID') },
                { key: 'description', header: 'Keterangan', render: (v:any) => String(v ?? '-'), },
                { key: 'type', header: 'Tipe' },
                { key: 'method', header: 'Metode', render: (_v:any, r:any) => (r?.method ?? '-') },
                    { key: 'amount', header: 'Nominal', render: (v:any) => `Rp ${Number(v).toLocaleString('id-ID')}` },
                    { key: 'author', header: 'Admin', render: (_v:any, r:any) => r?.author?.name ?? (r.created_by && currentUser && r.created_by === currentUser.id ? currentUser.name : '-') },
                    // show actions only for admin
                    ...(currentUser?.role === 'admin' ? [{ key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
                      <div className="flex gap-2">
                        <button disabled={r.voided} onClick={() => { setEditingTxn(r); setEditAmount(String(r.amount)); setEditDesc(r.description ?? ''); setEditMethod((r.method as any) || 'cash'); setShowEditModal(true) }} className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm">Edit</button>
                        <button disabled={r.voided} onClick={() => { setEditingTxn(r); setShowVoidConfirm(true) }} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Hapus</button>
                      </div>
                    ) }] : [])
              ]}
              data={transactions}
              getRowKey={(r) => r.id}
            />
          </Card>
        </div>
      )}

      <Modal open={showTopup} title={`Setor: ${selectedSantri?.nama_santri ?? ''}`} onClose={() => setShowTopup(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowTopup(false)}>Batal</button>
          <button className="btn btn-primary" onClick={(e) => submitTopup(e as any)}>Top-up</button>
        </>
      )}>
        <form onSubmit={submitTopup} className="grid grid-cols-1 gap-3">
          <label className="block text-sm">Nominal (Rp)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className="rounded-md border px-3 py-2" placeholder="Contoh: 50000" />
          <label className="block text-sm">Metode</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setMethod('cash')} className={`px-3 py-2 rounded-lg border ${method === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Cash</button>
            <button type="button" onClick={() => setMethod('transfer')} className={`px-3 py-2 rounded-lg border ${method === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Transfer</button>
          </div>
          <label className="block text-sm">Deskripsi (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-md border px-3 py-2" placeholder="Catatan top-up" />
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={showWithdraw} title={`Tarik: ${selectedSantri?.nama_santri ?? ''}`} onClose={() => setShowWithdraw(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowWithdraw(false)}>Batal</button>
          <button className="btn btn-primary" onClick={(e) => submitWithdraw(e as any)}>Konfirmasi Tarik</button>
        </>
      )}>
        <form onSubmit={submitWithdraw} className="grid grid-cols-1 gap-3">
          <label className="block text-sm">Nominal (Rp)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className="rounded-md border px-3 py-2" placeholder="Contoh: 50000" />
          <label className="block text-sm">Metode</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setMethod('cash')} className={`px-3 py-2 rounded-lg border ${method === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Cash</button>
            <button type="button" onClick={() => setMethod('transfer')} className={`px-3 py-2 rounded-lg border ${method === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Transfer</button>
          </div>
          <label className="block text-sm">Catatan (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-md border px-3 py-2" placeholder="Alasan penarikan" />
        </form>
      </Modal>

      {/* Edit Transaction Modal (admin only) */}
      <Modal open={showEditModal} title={`Edit Transaksi: ${editingTxn?.reference ?? ''}`} onClose={() => { setShowEditModal(false); setEditingTxn(null) }} footer={(
        <>
          <button className="btn" onClick={() => { setShowEditModal(false); setEditingTxn(null) }}>Batal</button>
          <button className="btn btn-primary" onClick={(e) => submitEditTransaction(e as any)}>Simpan Perubahan</button>
        </>
      )}>
        <form onSubmit={submitEditTransaction} className="grid grid-cols-1 gap-3">
          <label className="block text-sm">Nominal (Rp)</label>
          <input value={editAmount} onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))} className="rounded-md border px-3 py-2" />

          <label className="block text-sm">Metode</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setEditMethod('cash')} className={`px-3 py-2 rounded-lg border ${editMethod === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Cash</button>
            <button type="button" onClick={() => setEditMethod('transfer')} className={`px-3 py-2 rounded-lg border ${editMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>Transfer</button>
            <button type="button" onClick={() => setEditMethod('epos')} className={`px-3 py-2 rounded-lg border ${editMethod === 'epos' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>ePOS</button>
          </div>

          <label className="block text-sm">Keterangan</label>
          <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="rounded-md border px-3 py-2" />
        </form>
      </Modal>

      {/* Void confirmation modal */}
      <Modal open={showVoidConfirm} title={`Hapus Transaksi: ${editingTxn?.reference ?? ''}`} onClose={() => setShowVoidConfirm(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowVoidConfirm(false)}>Batal</button>
          <button className="btn btn-danger" onClick={confirmVoidTransaction}>Konfirmasi Hapus</button>
        </>
      )}>
        <div>Anda yakin akan menghapus (void) transaksi ini? Aksi ini akan membuat transaksi pembalikan dan menandai transaksi asli sebagai voided.</div>
      </Modal>
    </div>
  )
}
