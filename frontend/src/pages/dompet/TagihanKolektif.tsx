import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import CollectivePaymentCreateForm from '../../components/dompet/CollectivePaymentCreateForm'
import CollectivePaymentPreviewModal from '../../components/dompet/CollectivePaymentPreviewModal'
import { buildCollectivePaymentHistoryColumns } from '../../components/dompet/collectivePaymentHistoryColumns'
import {
  listCollectivePayments,
  createCollectivePayment,
  getCollectivePayment,
  retryCollectivePayment,
  cancelCollectivePayment,
  deleteCollectivePayment,
} from '../../api/wallet'
import { listKelas } from '../../api/kelas'
import { listSantri } from '../../api/santri'
import toast from 'react-hot-toast'

export default function TagihanKolektif() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history')
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [targetType, setTargetType] = useState<'individual' | 'class' | 'all'>('individual')
  const [classId, setClassId] = useState('')
  const [santriIds, setSantriIds] = useState<string[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [searchSantri, setSearchSantri] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      const res = await listSantri(1, 1000)
      if (res.status === 'success' || res.success) {
        setSantriList(res.data || [])
      }
    } catch (err) {
      console.error('Error loading santri:', err)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return

    const amt = Number(amount)
    if (!title.trim()) { toast.error('Judul harus diisi'); return }
    if (!amt || amt <= 0) { toast.error('Nominal tidak valid'); return }
    if (targetType === 'class' && !classId) { toast.error('Pilih kelas'); return }
    if (targetType === 'individual' && santriIds.length === 0) { toast.error('Pilih minimal 1 santri'); return }

    try {
      setIsSubmitting(true)
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
        await load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membuat tagihan')
    } finally {
      setIsSubmitting(false)
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

  async function handleCancel(id: number) {
    if (!confirm('Batalkan tagihan ini? Saldo yang sudah terpotong akan dikembalikan.')) return

    try {
      const res = await cancelCollectivePayment(id)
      if (res.success) {
        const refundedCount = res?.data?.refunded_count || 0
        toast.success(`Tagihan dibatalkan. ${refundedCount} saldo santri dikembalikan.`)
        await load()
        if (selectedPayment && selectedPayment.id === id) {
          await handlePreview({ id })
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal membatalkan tagihan')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus tagihan yang sudah dibatalkan ini?')) return

    try {
      const res = await deleteCollectivePayment(id)
      if (res.success) {
        toast.success(res.message || 'Tagihan berhasil dihapus')
        if (selectedPayment && selectedPayment.id === id) {
          setShowPreviewModal(false)
          setSelectedPayment(null)
        }
        await load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menghapus tagihan')
    }
  }

  const historyColumns = buildCollectivePaymentHistoryColumns({
    onPreview: handlePreview,
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tagihan Kolektif</h1>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'create'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Buat Tagihan
        </button>
      </div>

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
          <CollectivePaymentCreateForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            amount={amount}
            setAmount={setAmount}
            targetType={targetType}
            setTargetType={setTargetType}
            classId={classId}
            setClassId={setClassId}
            santriIds={santriIds}
            setSantriIds={setSantriIds}
            kelasList={kelasList}
            santriList={santriList}
            searchSantri={searchSantri}
            setSearchSantri={setSearchSantri}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
          />
        </Card>
      )}

      {showPreviewModal && (
        <CollectivePaymentPreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          selectedPayment={selectedPayment}
          detailLoading={detailLoading}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
