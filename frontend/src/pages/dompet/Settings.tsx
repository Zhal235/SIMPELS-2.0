import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getWalletSettings, updateGlobalMinBalance, getAllSantriWithLimits, setSantriDailyLimit, bulkUpdateSantriLimits } from '../../api/walletSettings'
import toast from 'react-hot-toast'

export default function Settings() {
  const [globalMinBalance, setGlobalMinBalance] = useState(0)
  const [tempGlobalMinBalance, setTempGlobalMinBalance] = useState(0)
  const [santriLimits, setSantriLimits] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [editingSantri, setEditingSantri] = useState<any | null>(null)
  const [editingValue, setEditingValue] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [showEditGlobal, setShowEditGlobal] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [settingsRes, santriRes] = await Promise.all([getWalletSettings(), getAllSantriWithLimits()])
      if (settingsRes?.success) {
        const minBal = settingsRes.data?.global_settings?.global_minimum_balance || 0
        setGlobalMinBalance(minBal)
        setTempGlobalMinBalance(minBal)
      }
      if (santriRes?.success) setSantriLimits((santriRes.data || []).map((s: any) => ({ ...s })))
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data settings')
    } finally { setLoading(false) }
  }

  async function handleSaveGlobalMinBalance() {
    try {
      const res = await updateGlobalMinBalance(parseFloat(String(tempGlobalMinBalance || 0)))
      if (res.success) {
        toast.success('Saldo minimal global berhasil diperbarui')
        setGlobalMinBalance(tempGlobalMinBalance)
        setShowEditGlobal(false)
        load()
      } else toast.error(res.message || 'Gagal memperbarui saldo minimal')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal memperbarui saldo minimal')
    }
  }

  async function handleSaveSingle() {
    if (!editingSantri) return
    try {
      const res = await setSantriDailyLimit(editingSantri.id, Number(editingValue || 0))
      if (res.success) {
        toast.success('Limit transaksi santri berhasil diperbarui')
        setEditingSantri(null)
        setEditingValue('')
        await load()
      } else {
        toast.error(res.message || 'Gagal memperbarui limit')
      }
    } catch (err:any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal memperbarui limit')
    }
  }

  async function handleSetDefaultAll() {
    if (!confirm('Tetapkan limit harian Rp 15.000 untuk semua santri?')) return
    try {
      const limits = santriLimits.map((s: any) => ({ santri_id: s.id, daily_limit: 15000 }))
      const res = await bulkUpdateSantriLimits(limits)
      if (res.success) {
        toast.success('Berhasil menetapkan limit default untuk semua santri')
        await load()
      } else {
        toast.error(res.message || 'Gagal menetapkan limit default')
      }
    } catch (err:any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menetapkan limit default')
    }
  }

  const limitsColumns = [
    { key: 'nis', header: 'NIS' },
    { key: 'nama_santri', header: 'Nama Santri' },
    { key: 'daily_limit', header: 'Limit Harian (Rp)', render: (v: any) => (
      <div>{`Rp ${parseFloat(String(v || 0)).toLocaleString('id-ID')}`}</div>
    ) },
    { key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={() => { setEditingSantri(r); setEditingValue(r.daily_limit || 0) }}>Edit</button>
      </div>
    ) }
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Setting Dompet Digital</h2>
        <p className="text-sm text-gray-500 mt-1">Atur saldo minimal global dan limit transaksi per santri untuk kontrol RFID</p>
      </div>

      {loading ? (
        <Card><div className="p-6 text-center text-gray-500">Memuat...</div></Card>
      ) : (
        <>
          {/* Global Min Balance Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Saldo Minimal Global</h3>
                <p className="text-sm text-gray-500">Mencegah santri belanja/jajan jika saldo kurang dari nilai ini</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setTempGlobalMinBalance(globalMinBalance); setShowEditGlobal(true) }}>Ubah</button>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              Rp {parseFloat(globalMinBalance.toString()).toLocaleString('id-ID')}
            </div>
          </Card>

          {/* Per-Santri Limits Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">Limit Transaksi per Santri</h3>
                <p className="text-sm text-gray-500">Limit harian read-only — gunakan kolom Aksi untuk mengubah nilai per santri</p>
              </div>
                <div className="ml-4">
                  <input placeholder="Cari santri (nama/NIS)" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="rounded border px-3 py-2" />
                </div>
            </div>

            <Card>
              {santriLimits.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Belum ada santri aktif</div>
              ) : (
                <Table
                  columns={limitsColumns}
                  data={santriLimits.filter(s => {
                  if (!searchQ || searchQ.trim().length < 2) return true
                  const q = searchQ.toLowerCase()
                  return String(s.nama_santri).toLowerCase().includes(q) || String(s.nis).toLowerCase().includes(q)
                })}
                  getRowKey={(r) => r.id}
                  renderExpandedRow={(row:any) => (
                    editingSantri?.id === row.id ? (
                      <div className="p-3">
                        <div className="grid md:grid-cols-3 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium">NIS</label>
                            <input disabled value={row.nis} className="rounded border px-3 py-2 w-full bg-gray-100" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Nama Santri</label>
                            <input disabled value={row.nama_santri} className="rounded border px-3 py-2 w-full bg-gray-100" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Limit Harian (Rp)</label>
                            <input type="number" value={editingValue as any} onChange={(e) => setEditingValue(e.target.value ? parseFloat(e.target.value) : '')} className="rounded border px-3 py-2 w-full" />
                          </div>
                          <div className="md:col-span-3 flex justify-end gap-2">
                            <button className="btn" onClick={() => { setEditingSantri(null); setEditingValue('') }}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSaveSingle}>Simpan</button>
                          </div>
                        </div>
                      </div>
                    ) : null
                  )}
                />
              )}
            </Card>
          </div>
        </>
      )}

      {/* Edit Global Min Balance Modal */}
      <Modal 
        open={showEditGlobal} 
        title="Ubah Saldo Minimal Global" 
        onClose={() => setShowEditGlobal(false)}
        footer={(
          <>
            <button className="btn" onClick={() => setShowEditGlobal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSaveGlobalMinBalance}>Simpan</button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium">Saldo Minimal (Rp)</label>
          <input 
            type="number" 
            value={tempGlobalMinBalance} 
            onChange={(e) => setTempGlobalMinBalance(parseFloat(e.target.value) || 0)}
            min="0"
            step="1000"
            className="rounded-md border px-3 py-2 w-full"
          />
          <p className="text-xs text-gray-500">Masukkan jumlah minimal saldo dalam Rupiah</p>
        </div>
      </Modal>
      
    </div>
  )
}
