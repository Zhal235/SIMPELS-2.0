import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import api from '../../api'
import { handleError } from '../../utils/handleError'
import { toast } from 'react-hot-toast'

type KelasItem = {
  id: number
  nama_kelas: string
  tingkat: number
  wali_kelas_id?: number | null
  santri_count?: number
  wali_kelas?: { id: number; nama_pegawai?: string; nama?: string; name?: string } | null
}

type SantriItem = {
  id: string
  nama_santri: string
  kelas_id?: number | null
}

const TINGKAT_OPTIONS = [7, 8, 9, 10, 11, 12]

export default function KesantrianKelas() {
  const [items, setItems] = useState<KelasItem[]>([])
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<KelasItem | null>(null)
  const [form, setForm] = useState<{ nama_kelas: string; tingkat: number | '' ; wali_kelas_id: number | '' | null }>({ nama_kelas: '', tingkat: '', wali_kelas_id: null })

  const [memberOpen, setMemberOpen] = useState(false)
  const [memberKelas, setMemberKelas] = useState<KelasItem | null>(null)
  const [santriList, setSantriList] = useState<SantriItem[]>([])
  const [santriLoading, setSantriLoading] = useState(false)
  const [selectedSantriId, setSelectedSantriId] = useState<string>('')

  const santriInKelas = useMemo(() => santriList.filter(s => s.kelas_id === memberKelas?.id), [santriList, memberKelas])
  const santriTanpaKelas = useMemo(() => santriList.filter(s => !s.kelas_id), [santriList])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await api.get('/v1/kesantrian/kelas')
      const raw = res?.data
      // Aman: jika res.data punya properti data ambil itu; jika tidak, cek apakah array langsung; selain itu fallback []
      const hasil: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : []
      setItems(hasil as KelasItem[])
    } catch (err) {
      handleError(err)
      // Pastikan state tetap array ketika gagal fetch
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditItem(null)
    setForm({ nama_kelas: '', tingkat: '', wali_kelas_id: null })
    setModalOpen(true)
  }

  function openEdit(item: KelasItem) {
    setEditItem(item)
    setForm({ nama_kelas: item.nama_kelas ?? '', tingkat: item.tingkat ?? '', wali_kelas_id: item.wali_kelas_id ?? null })
    setModalOpen(true)
  }

  async function saveKelas() {
    // Validasi
    if (!form.nama_kelas || form.nama_kelas.trim() === '') {
      toast.error('Nama kelas wajib diisi')
      return
    }
    if (!form.tingkat || typeof form.tingkat !== 'number') {
      toast.error('Tingkat wajib diisi')
      return
    }

    try {
      const payload = { nama_kelas: form.nama_kelas.trim(), tingkat: form.tingkat, wali_kelas_id: form.wali_kelas_id || null }
      if (editItem) {
        await api.put(`/v1/kesantrian/kelas/${editItem.id}`, payload)
        toast.success('Kelas berhasil diperbarui')
      } else {
        await api.post('/v1/kesantrian/kelas', payload)
        toast.success('Kelas berhasil dibuat')
      }
      setModalOpen(false)
      await fetchData()
    } catch (err) {
      handleError(err)
    }
  }

  async function deleteKelas(item: KelasItem) {
    if (!window.confirm('Apakah Anda yakin?')) return
    try {
      await api.delete(`/v1/kesantrian/kelas/${item.id}`)
      toast.success('Kelas berhasil dihapus')
      await fetchData()
    } catch (err) {
      handleError(err)
    }
  }

  async function openMembers(item: KelasItem) {
    setMemberKelas(item)
    setMemberOpen(true)
    setSantriLoading(true)
    try {
      // Ambil santri (gunakan perPage besar agar cukup)
      const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000 } })
      const raw = res?.data
      const dataArr: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : []
      setSantriList(dataArr as SantriItem[])
    } catch (err) {
      handleError(err)
    } finally {
      setSantriLoading(false)
    }
  }

  async function addMember() {
    if (!memberKelas || !selectedSantriId) return
    // Validasi di frontend: cegah jika santri sudah punya kelas (double safety)
    const selectedSantri = santriList.find(s => s.id === selectedSantriId)
    if (selectedSantri && selectedSantri.kelas_id && selectedSantri.kelas_id !== memberKelas.id) {
      toast.error('Santri sudah terdaftar di kelas lain.')
      return
    }
    try {
      await api.post(`/v1/kesantrian/kelas/${memberKelas.id}/anggota`, { santri_id: selectedSantriId })
      toast.success('Anggota kelas berhasil diperbarui')
      // Refresh santri list & kelas table
      await openMembers(memberKelas)
      await fetchData()
    } catch (err) {
      handleError(err)
    }
  }

  async function removeMember(s: SantriItem) {
    if (!memberKelas) return
    if (!window.confirm('Apakah Anda yakin?')) return
    try {
      await api.delete(`/v1/kesantrian/kelas/${memberKelas.id}/anggota/${s.id}`)
      toast.success('Anggota kelas berhasil diperbarui')
      await openMembers(memberKelas)
      await fetchData()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Kelas</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Kelas</button>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-gray-600">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-600">Belum ada data kelas.</div>
        ) : (
          <Table<KelasItem>
            columns={[
              { key: 'no', header: 'No', render: (_v, _row, idx) => idx + 1 },
              { key: 'nama_kelas', header: 'Nama Kelas' },
              { key: 'tingkat', header: 'Tingkat' },
              { key: 'santri_count', header: 'Jumlah Santri', render: (v) => v ?? 0 },
              { key: 'wali_kelas_id', header: 'Wali Kelas', render: (_v, row) => {
                const nm = row.wali_kelas?.nama_pegawai ?? row.wali_kelas?.nama ?? row.wali_kelas?.name
                return nm ? nm : (row.wali_kelas_id ? `#${row.wali_kelas_id}` : '—')
              } },
              {
                key: 'actions',
                header: 'Aksi',
                render: (_v, row) => (
                  <div className="flex gap-2">
                    <button className="btn" onClick={() => openEdit(row)}>✏️ Edit</button>
                    <button className="btn" onClick={() => openMembers(row)}>👥 Anggota</button>
                    <button className="btn btn-danger" onClick={() => deleteKelas(row)}>🗑️ Hapus</button>
                  </div>
                ),
              },
            ]}
            data={Array.isArray(items) ? items : []}
            getRowKey={(row, idx) => (row as any)?.id ?? idx}
          />
        )}
      </Card>

      {/* Modal Tambah/Edit Kelas */}
      <Modal
        open={modalOpen}
        title={editItem ? 'Edit Kelas' : 'Tambah Kelas'}
        onClose={() => setModalOpen(false)}
        footer={(
          <>
            <button className="btn" onClick={() => setModalOpen(false)}>Tutup</button>
            <button className="btn btn-primary" onClick={saveKelas}>Simpan</button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.nama_kelas}
              onChange={(e) => setForm((f) => ({ ...f, nama_kelas: e.target.value }))}
              placeholder="Misal: VII A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tingkat</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.tingkat === '' ? '' : String(form.tingkat)}
              onChange={(e) => setForm((f) => ({ ...f, tingkat: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">Pilih tingkat</option>
              {TINGKAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Wali Kelas (opsional)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.wali_kelas_id === null ? '' : String(form.wali_kelas_id)}
              onChange={(e) => {
                const v = e.target.value
                setForm((f) => ({ ...f, wali_kelas_id: v === '' ? null : Number(v) }))
              }}
              placeholder="ID pegawai wali kelas"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Anggota Kelas */}
      <Modal
        open={memberOpen}
        title={`Anggota Kelas ${memberKelas?.nama_kelas ?? ''}`}
        onClose={() => setMemberOpen(false)}
        footer={(
          <button className="btn" onClick={() => setMemberOpen(false)}>Tutup</button>
        )}
      >
        {santriLoading ? (
          <div className="p-4 text-gray-600">Memuat data santri...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Tambah Anggota</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={selectedSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                >
                  <option value="">Pilih santri tanpa kelas</option>
                  {santriTanpaKelas.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama_santri}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={addMember} disabled={!selectedSantriId}>Tambah Anggota</button>
            </div>

            <Card title="Daftar Anggota">
              <Table<SantriItem>
                columns={[
                  { key: 'no', header: 'No', render: (_v, _row, idx) => idx + 1 },
                  { key: 'nama_santri', header: 'Nama Santri' },
                  { key: 'kelas_id', header: 'Kelas', render: () => memberKelas?.nama_kelas ?? '—' },
                  {
                    key: 'actions', header: 'Aksi', render: (_v, row) => (
                      <button className="btn btn-danger" onClick={() => removeMember(row)}>Keluarkan</button>
                    )
                  }
                ]}
                data={Array.isArray(santriInKelas) ? santriInKelas : []}
                getRowKey={(row, idx) => (row as any)?.id ?? idx}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}