import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Edit2, Trash2, UserRoundPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/api'
import { listAsrama, createAsrama, updateAsrama, deleteAsrama, tambahAnggotaAsrama, keluarkanAnggotaAsrama } from '@/api/asrama'
import { listSantri } from '@/api/santri'

type Asrama = {
  id?: number
  nama_asrama: string
  wali_asrama?: string | null
  santri_count?: number
}

type Santri = {
  id: string
  nama_santri: string
  asrama?: string | null
}

export default function KesantrianAsrama() {
  const [items, setItems] = useState<Asrama[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [editItem, setEditItem] = useState<Asrama | null>(null)
  const [memberAsrama, setMemberAsrama] = useState<Asrama | null>(null)
  const [namaAsrama, setNamaAsrama] = useState('')
  const [waliAsrama, setWaliAsrama] = useState('')
  const [availableSantri, setAvailableSantri] = useState<Santri[]>([])
  const [selectedSantriId, setSelectedSantriId] = useState<string>('')

  async function fetchAsrama() {
    try {
      setLoading(true)
      const res = await listAsrama()
      const list: Asrama[] = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
      setItems(list)
    } catch (err) {
      console.error('Gagal memuat asrama', err)
      toast.error('Gagal memuat daftar asrama')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAsrama() }, [])

  const columns = useMemo(() => ([
    { key: 'no' as any, header: 'No', render: (_: any, __: Asrama, idx: number) => String(idx + 1) },
    { key: 'nama_asrama', header: 'Nama Asrama' },
    { key: 'santri_count', header: 'Jumlah Anggota', render: (v: number) => String(v ?? 0) },
    { key: 'wali_asrama', header: 'Wali Asrama', render: (v: string) => v || '—' },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (_: any, row: Asrama) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Edit"
            className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
            onClick={() => { setEditItem(row); setNamaAsrama(row.nama_asrama); setWaliAsrama(row.wali_asrama || ''); setModalOpen(true) }}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Tambah Anggota"
            className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
            onClick={() => openMembers(row)}
          >
            <UserRoundPlus size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Hapus"
            className="border-gray-200 text-gray-700 hover:text-red-500 hover:border-red-300 transition-all duration-150 rounded-lg shadow-sm bg-white"
            onClick={() => deleteRow(row)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]), [])

  async function deleteRow(item: Asrama) {
    const ok = confirm(`Hapus asrama "${item.nama_asrama}"?`)
    if (!ok) return
    try {
      await deleteAsrama(item.id!)
      await fetchAsrama()
      toast.success('Asrama dihapus')
    } catch (err) {
      console.error('Gagal hapus asrama', err)
      toast.error('Gagal menghapus asrama')
    }
  }

  async function saveRow() {
    try {
      const payload = { nama_asrama: namaAsrama.trim(), wali_asrama: waliAsrama.trim() || null }
      if (!payload.nama_asrama) {
        toast.error('Nama asrama wajib diisi')
        return
      }
      if (editItem?.id) {
        await updateAsrama(editItem.id, payload)
        toast.success('Asrama diperbarui')
      } else {
        await createAsrama(payload)
        toast.success('Asrama ditambahkan')
      }
      setModalOpen(false)
      setEditItem(null)
      setNamaAsrama('')
      setWaliAsrama('')
      await fetchAsrama()
    } catch (err) {
      console.error('Simpan asrama gagal', err)
      toast.error('Gagal menyimpan asrama')
    }
  }

  async function openMembers(row: Asrama) {
    try {
      setMemberAsrama(row)
      setMembersOpen(true)
      setSelectedSantriId('')
      // ambil santri tanpa asrama
      const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000, withoutAsrama: 1 } })
      const list: any[] = Array.isArray(res?.data?.data) ? res.data.data : []
      const mapped: Santri[] = list.map((s: any) => ({ id: s.id, nama_santri: s.nama_santri, asrama: s.asrama || s.asrama_nama || null }))
      setAvailableSantri(mapped)
    } catch (err) {
      console.error('Gagal memuat santri tanpa asrama', err)
      toast.error('Tidak bisa memuat santri tanpa asrama')
    }
  }

  async function addMember() {
    if (!memberAsrama?.id || !selectedSantriId) {
      toast.error('Pilih santri terlebih dahulu')
      return
    }
    try {
      await tambahAnggotaAsrama(memberAsrama.id, selectedSantriId)
      toast.success('Anggota asrama ditambahkan')
      await fetchAsrama()
      // refresh available santri list
      await openMembers(memberAsrama)
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Gagal menambah anggota'
      toast.error(message)
    }
  }

  async function removeMember(s: Santri) {
    if (!memberAsrama?.id || !s?.id) return
    try {
      await keluarkanAnggotaAsrama(memberAsrama.id, s.id)
      toast.success('Anggota asrama dikeluarkan')
      await fetchAsrama()
      // refresh available santri list
      await openMembers(memberAsrama)
    } catch (err) {
      console.error('Gagal keluarkan anggota', err)
      toast.error('Gagal mengeluarkan anggota')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Asrama</h1>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setNamaAsrama(''); setWaliAsrama(''); setModalOpen(true) }}>Tambah Asrama</button>
      </div>

      <Card>
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Memuat data…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Belum ada data asrama.</div>
        ) : (
          <Table columns={columns as any} data={items} getRowKey={(row: Asrama, idx: number) => String(row?.id ?? idx)} />
        )}
      </Card>

      {/* Modal Create/Edit Asrama */}
      <Modal open={modalOpen} title={editItem?.id ? 'Edit Asrama' : 'Tambah Asrama'} onClose={() => setModalOpen(false)} footer={null}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Asrama</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={namaAsrama} onChange={(e) => setNamaAsrama(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Wali Asrama</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={waliAsrama} onChange={(e) => setWaliAsrama(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn btn-primary" onClick={saveRow}>Simpan</button>
          </div>
        </div>
      </Modal>

      {/* Modal Anggota Asrama */}
      <Modal open={membersOpen} title={`Anggota Asrama${memberAsrama ? `: ${memberAsrama.nama_asrama}` : ''}`} onClose={() => setMembersOpen(false)} footer={null}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Pilih Santri (tanpa asrama)</label>
              <select className="mt-1 w-full rounded-md border px-3 py-2" value={selectedSantriId} onChange={(e) => setSelectedSantriId(e.target.value)}>
                <option value="">— pilih santri —</option>
                {availableSantri.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama_santri}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn btn-primary w-full" onClick={addMember}>Tambah Anggota</button>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-medium text-gray-700">Daftar Anggota Saat Ini</h3>
            <div className="mt-2 space-y-2">
              {(memberAsrama?.santri_count ?? 0) === 0 ? (
                <div className="text-sm text-gray-500">Belum ada anggota.</div>
              ) : (
                <MembersTable asrama={memberAsrama!} onRemove={removeMember} />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MembersTable({ asrama, onRemove }: { asrama: Asrama; onRemove: (s: Santri) => void }) {
  const [members, setMembers] = useState<Santri[]>([])
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await api.get(`/v1/kesantrian/asrama/${asrama.id}`)
        const list: any[] = Array.isArray(res?.data?.data?.santri) ? res.data.data.santri : []
        const mapped: Santri[] = list.map((s: any) => ({ id: s.id, nama_santri: s.nama_santri, asrama: s.asrama || s.asrama_nama || null }))
        setMembers(mapped)
      } catch (err) {
        console.error('Gagal memuat anggota asrama', err)
        toast.error('Gagal memuat anggota asrama')
      }
    }
    fetchMembers()
  }, [asrama?.id])
  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 text-xs font-medium text-gray-600">
        <div className="col-span-1">No</div>
        <div className="col-span-7">Nama Santri</div>
        <div className="col-span-3">Asrama</div>
        <div className="col-span-1">Aksi</div>
      </div>
      {members.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">Belum ada anggota.</div>
      ) : members.map((m, idx) => (
        <div key={m.id} className="grid grid-cols-12 gap-2 p-2 border-t text-sm">
          <div className="col-span-1">{idx + 1}</div>
          <div className="col-span-7">{m.nama_santri}</div>
          <div className="col-span-3">{m.asrama || '—'}</div>
          <div className="col-span-1">
            <button className="btn" title="Keluarkan" onClick={() => onRemove(m)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}