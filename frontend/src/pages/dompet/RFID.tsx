import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { listRFID, bindRFID, unbindRFID } from '../../api/wallet'
import { listSantri } from '../../api/santri'
import toast from 'react-hot-toast'

export default function RFID() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [uid, setUid] = useState('')
  const [santriId, setSantriId] = useState('')
  const [label, setLabel] = useState('')
  const [santriList, setSantriList] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [resTags, resSantri] = await Promise.all([listRFID(), listSantri(1, 9999)])
      if (resTags.success) setTags(resTags.data || [])
      if (resSantri.status === 'success') setSantriList(resSantri.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data RFID')
    } finally { setLoading(false) }
  }

  async function handleBind(e?: React.FormEvent) {
    e?.preventDefault()
    if (!uid) { toast.error('UID harus diisi'); return }
    try {
      const res = await bindRFID(uid, santriId || null)
      if (res.success) {
        toast.success('Tag RFID ditambahkan')
        setShowAdd(false)
        load()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menambahkan RFID')
    }
  }

  async function handleUnbind(id: number) {
    if (!confirm('Unbind tag ini?')) return
    try {
      const res = await unbindRFID(id)
      if (res.success) {
        toast.success('Tag dihapus')
        load()
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal menghapus tag')
    }
  }

  const columns = [
    { key: 'no', header: 'No', render: (_v: any, _r: any, idx: number) => idx + 1 },
    { key: 'uid', header: 'UID' },
    { key: 'santri', header: 'Santri', render: (_v: any, r: any) => r?.santri?.nama_santri ?? '-' },
    { key: 'label', header: 'Label' },
    { key: 'active', header: 'Status', render: (v: any) => v ? 'Aktif' : 'Nonaktif' },
    { key: 'actions', header: 'Actions', render: (_v: any, r: any) => (
      <div className="flex gap-2">
        <button onClick={() => handleUnbind(r.id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Unbind</button>
      </div>
    ) }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">RFID</h2>
        <div className="flex gap-2"><button className="btn btn-primary" onClick={() => setShowAdd(true)}>Tambah Tag</button></div>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat...</div>
        ) : (
          <Table columns={columns} data={tags} getRowKey={(r) => r.id} />
        )}
      </Card>

      <Modal open={showAdd} title="Tambah Tag RFID" onClose={() => setShowAdd(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowAdd(false)}>Batal</button>
          <button className="btn btn-primary" onClick={(e) => handleBind(e as any)}>Simpan</button>
        </>
      )}>
        <form onSubmit={handleBind} className="space-y-3">
          <label className="block text-sm">UID</label>
          <input value={uid} onChange={(e) => setUid(e.target.value)} className="rounded-md border px-3 py-2 w-full" />
          <label className="block text-sm">Santri (opsional)</label>
          <select value={santriId} onChange={(e) => setSantriId(e.target.value)} className="rounded-md border px-3 py-2 w-full">
            <option value="">-- Pilih Santri (opsional) --</option>
            {santriList.map(s => <option key={s.id} value={s.id}>{s.nama_santri} ({s.nis})</option>)}
          </select>
          <label className="block text-sm">Label (opsional)</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-md border px-3 py-2 w-full" />
        </form>
      </Modal>
    </div>
  )
}
