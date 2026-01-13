import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { listCollectivePayments, createCollectivePayment, getCollectivePayment, retryCollectivePayment } from '../../api/wallet'
import { listKelas } from '../../api/kelas'
import { listSantri } from '../../api/santri'
import toast from 'react-hot-toast'

export default function TagihanKolektif() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history')
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [targetType, setTargetType] = useState<'individual' | 'class' | 'all'>('individual')
  const [classId, setClassId] = useState('')
  const [santriIds, setSantriIds] = useState<string[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [searchSantri, setSearchSantri] = useState('')
  
  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { load() }, [activeTab])
  useEffect(() => { loadKelas(); loadSantri() }, [])

  async function load() {
    if (activeTab === 'history') {
      try {
        setLoading(true)
        const res = await listCollectivePayments()
        if (res.success) setPayments(res.data || [])
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat data')
      } finally { setLoading(false) }
    }
  }

  async function loadKelas() {
    try {
      const res = await listKelas()
      if (res.success) setKelasList(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadSantri() {
    try {
      const res = await listSantri(1, 1000) // Load banyak santri untuk dropdown
      // Response format: {status: 'success', data: Array}
      if (res.status === 'success' || res.success) {
        setSantriList(res.data || [])
      }
    } catch (err) {
      console.error('Error loading santri:', err)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!title.trim()) { toast.error('Judul harus diisi'); return }
    if (!amt || amt <= 0) { toast.error('Nominal tidak valid'); return }
    if (targetType === 'class' && !classId) { toast.error('Pilih kelas'); return }
    if (targetType === 'individual' && santriIds.length === 0) { toast.error('Pilih minimal 1 santri'); return }

    try {
      const res = await createCollectivePayment({
        title,
        description,
        amount_per_santri: amt,
        target_type: targetType,
        class_id: targetType === 'class' ? Number(classId) : undefined,
        santri_ids: targetType === 'individual' ? santriIds : undefined,
      })
      
      if (res.success) {
        toast.success('Tagihan kolektif berhasil dibuat!')
        setTitle('')
        setDescription('')
        setAmount('')
        setTargetType('individual')
        setClassId('')
        setSantriIds([])
        setSearchSantri('')
        setActiveTab('history')
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat tagihan')
    }
  }

  async function handlePreview(payment: any) {
    setDetailLoading(true)
    setShowPreviewModal(true)
    try {
      const res = await getCollectivePayment(payment.id)
      if (res.success) setSelectedPayment(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat detail')
    } finally { setDetailLoading(false) }
  }

  async function handleRetry(id: number) {
    if (!confirm('Retry pembayaran yang pending?')) return
    try {
      const res = await retryCollectivePayment(id)
      if (res.success) {
        toast.success(res.message || 'Retry berhasil')
        load()
        if (selectedPayment && selectedPayment.id === id) {
          handlePreview({ id })
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal retry')
    }
  }

  const historyColumns = [
    { key: 'title', header: 'Nama Tagihan', render: (v: any) => <div className="font-medium">{v}</div> },
    { 
      key: 'created_at', 
      header: 'Tanggal', 
      render: (v: any) => <div className="text-sm">{new Date(v).toLocaleDateString('id-ID')}</div> 
    },
    { 
      key: 'total_santri', 
      header: 'Total Santri', 
      render: (v: any) => <div className="text-center font-semibold">{v}</div> 
    },
    { 
      key: 'paid_count', 
      header: 'Sukses', 
      render: (v: any) => <div className="text-center text-green-600 font-semibold">✅ {v}</div> 
    },
    { 
      key: 'pending_count', 
      header: 'Pending', 
      render: (v: any) => <div className="text-center text-yellow-600 font-semibold">⏳ {v}</div> 
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (v: any) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          v === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {v === 'completed' ? 'Selesai' : 'Aktif'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (v: any, row: any) => (
        <button
          onClick={() => handlePreview(row)}
          className="btn btn-sm btn-primary"
        >
          🔍 Preview
        </button>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">💳 Tagihan Kolektif</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'create'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ➕ Buat Tagihan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && (
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table columns={historyColumns} data={payments} />
          )}
        </Card>
      )}

      {activeTab === 'create' && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul Tagihan *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Iuran Ekskul Basket - Januari 2025"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Keterangan tambahan (optional)"
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nominal per Santri *</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="10000"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Target *</label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as any)}
                className="input"
              >
                <option value="individual">Pilih Santri (Anggota Ekskul/Kegiatan)</option>
                <option value="class">Per Kelas</option>
                <option value="all">Semua Santri</option>
              </select>
            </div>

            {targetType === 'class' && (
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Kelas *</label>
                <select value={classId} onChange={e => setClassId(e.target.value)} className="input" required>
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'individual' && (
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Santri * (Anggota Ekskul/Kegiatan)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama santri (min 2 huruf)..."
                    value={searchSantri}
                    onChange={e => setSearchSantri(e.target.value)}
                    className="input"
                  />
                  {searchSantri.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {santriList
                        .filter(s => 
                          s.nama_santri?.toLowerCase().includes(searchSantri.toLowerCase()) ||
                          s.nis?.includes(searchSantri)
                        )
                        .slice(0, 10)
                        .map(santri => (
                          <div
                            key={santri.id}
                            onClick={() => {
                              if (!santriIds.includes(santri.id)) {
                                setSantriIds([...santriIds, santri.id])
                              }
                              setSearchSantri('')
                            }}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                          >
                            <div className="font-medium">{santri.nama_santri}</div>
                            <div className="text-sm text-gray-500">{santri.nis}</div>
                          </div>
                        ))}
                      {santriList.filter(s => 
                        s.nama_santri?.toLowerCase().includes(searchSantri.toLowerCase()) ||
                        s.nis?.includes(searchSantri)
                      ).length === 0 && (
                        <div className="p-3 text-gray-500 text-center">Tidak ada santri ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Santri Tags */}
                {santriIds.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Santri Terpilih ({santriIds.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {santriIds.map(id => {
                        const santri = santriList.find(s => s.id === id)
                        if (!santri) return null
                        return (
                          <div key={id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            <span>{santri.nama_santri}</span>
                            <button
                              type="button"
                              onClick={() => setSantriIds(santriIds.filter(sid => sid !== id))}
                              className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full">
              Buat Tagihan Kolektif
            </button>
          </form>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={selectedPayment?.title || 'Detail Tagihan'}>
          {detailLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : selectedPayment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Total Santri</div>
                  <div className="font-semibold">{selectedPayment.total_santri}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nominal per Santri</div>
                  <div className="font-semibold">Rp {parseFloat(selectedPayment.amount_per_santri || 0).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-gray-500">Terkumpul</div>
                  <div className="font-semibold text-green-600">Rp {parseFloat(selectedPayment.collected_amount || 0).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-gray-500">Outstanding</div>
                  <div className="font-semibold text-yellow-600">Rp {parseFloat(selectedPayment.outstanding_amount || 0).toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">✅ Sudah Bayar ({selectedPayment.items?.filter((i: any) => i.status === 'paid').length || 0})</h3>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedPayment.items?.filter((i: any) => i.status === 'paid').map((item: any) => (
                    <div key={item.id} className="text-sm bg-green-50 p-2 rounded">
                      {item.santri?.nama_santri || item.santri?.name || 'Unknown'} - Rp {parseFloat(item.amount || 0).toLocaleString('id-ID')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">⏳ Belum Bayar ({selectedPayment.items?.filter((i: any) => i.status === 'pending').length || 0})</h3>
                  {selectedPayment.items?.some((i: any) => i.status === 'pending') && (
                    <button onClick={() => handleRetry(selectedPayment.id)} className="btn btn-sm btn-primary">
                      🔄 Retry
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedPayment.items?.filter((i: any) => i.status === 'pending').map((item: any) => (
                    <div key={item.id} className="text-sm bg-yellow-50 p-2 rounded">
                      <div>{item.santri?.nama_santri || item.santri?.name || 'Unknown'} - Rp {parseFloat(item.amount || 0).toLocaleString('id-ID')}</div>
                      {item.failure_reason && <div className="text-xs text-red-600">{item.failure_reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  )
}
