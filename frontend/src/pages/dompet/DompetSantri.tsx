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
  const roles = useAuthStore((s) => s.roles)
  const currentRole = roles?.find((r: any) => (r.slug === (currentUser?.role)))

  const getBackendOrigin = () => {
    // Get API URL from env - remove /api suffix if present
    const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL
    if (apiBase) {
      const url = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')
      return url
    }
    // Fallback: use current window origin and change port
    return window.location.origin.replace(/5173/, '8001') // Vite dev (5173) -> Laravel (8001)
  }

  const getFotoUrl = (santri: any): string | null => {
    try {
      if (!santri.foto) return null
      
      const s = String(santri.foto || '')
      if (!s) return null
      if (/^data:/i.test(s)) return s
      
      const origin = getBackendOrigin()
      
      if (/^https?:\/\//i.test(s)) {
        // Jika URL absolut mengarah ke localhost:8000, ubah ke origin backend saat ini
        try {
          const u = new URL(s)
          const o = new URL(origin)
          const isLocalHost = ['localhost', '127.0.0.1'].includes(u.hostname)
          if (isLocalHost && u.port && o.port && u.port !== o.port) {
            u.protocol = o.protocol
            u.hostname = o.hostname
            u.port = o.port
            return u.toString()
          }
        } catch {}
        return s
      }
      
      if (s.startsWith('/')) return origin + s
      if (s.startsWith('storage') || s.startsWith('uploads')) return `${origin}/${s}`
      return s
    } catch {
      return null
    }
  }

  useEffect(() => { loadInitial() }, [])

  async function loadInitial() {
    try {
      setLoading(true)
      const santriRes = await listSantri(1, 200)
      if (santriRes?.status === 'success') {
        const santriData = santriRes.data || []
        // Debug foto - cek santri pertama yang punya foto
        const withFoto = santriData.find((s: any) => s.foto)
        if (withFoto) {
          console.log('[DompetSantri] Santri dengan foto:', withFoto.nama_santri, 'foto:', withFoto.foto)
          console.log('[DompetSantri] getFotoUrl result:', getFotoUrl(withFoto))
        }
        setSantriList(santriData)
      }
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
      const errorData = err?.response?.data
      
      // Handle cash insufficient error
      if (errorData?.data?.shortage && errorData?.data?.hint) {
        const shortage = parseFloat(errorData.data.shortage || 0)
        toast.error(`Saldo Cash tidak mencukupi. Silakan melakukan penarikan dari Bank terlebih dahulu (Kurang: Rp ${shortage.toLocaleString('id-ID')})`, { duration: 5000 })
      } else {
        toast.error(errorData?.message || 'Gagal melakukan penarikan')
      }
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
                    <img 
                      src={getFotoUrl(s) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'} 
                      alt={s.nama_santri} 
                      className="w-10 h-10 rounded-full object-cover bg-gray-100" 
                      onError={(e) => {
                        console.error(`Failed to load foto for ${s.nama_santri}`)
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'
                      }}
                    />
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
            <img 
              src={getFotoUrl(selectedSantri) || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'} 
              alt={selectedSantri.nama_santri} 
              className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 bg-gray-100"
              onError={(e) => {
                console.error(`Failed to load main foto for ${selectedSantri.nama_santri}`)
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'
              }}
            />
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
                { key: 'reference', header: 'No Ref', render: (v: any) => v || '-' },
                { 
                  key: 'tanggal', 
                  header: 'Tanggal / Jam', 
                  render: (v: any, r: any) => {
                    try {
                      const dateValue = v || r.created_at || r.tanggal;
                      if (!dateValue) return '-';
                      const date = new Date(dateValue);
                      if (isNaN(date.getTime())) return '-';
                      return date.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    } catch {
                      return '-';
                    }
                  }
                },
                { key: 'keterangan', header: 'Keterangan', render: (v: any, r: any) => String(v || r.description || '-') },
                { key: 'tipe', header: 'Tipe', render: (v: any, r: any) => (v || r.type || '-') },
                { key: 'metode', header: 'Metode', render: (v: any, r: any) => (v || r.method || '-') },
                { 
                  key: 'jumlah', 
                  header: 'Nominal', 
                  render: (v: any, r: any) => {
                    const amount = Number(v || r.amount || 0);
                    if (isNaN(amount)) return 'Rp 0';
                    return `Rp ${amount.toLocaleString('id-ID')}`;
                  }
                },
                    { key: 'author', header: 'Admin', render: (_v:any, r:any) => r?.author?.name ?? (r.created_by && currentUser && r.created_by === currentUser.id ? currentUser.name : '-') },
                    // show actions only for admin
                    ...( (currentUser?.role === 'admin') || (currentRole?.menus && currentRole?.menus.includes('dompet.manage')) ? [{ key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
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
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            💵 Penarikan tunai menggunakan metode Cash
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
