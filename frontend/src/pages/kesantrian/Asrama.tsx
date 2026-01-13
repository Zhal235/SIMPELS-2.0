import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Edit2, Trash2, UserRoundPlus, X } from 'lucide-react'
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
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)

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
      setSelectedSantriIds([])
      setSearchTerm('')
      setShowAddForm(false)
      // ambil santri tanpa asrama
      const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000, withoutAsrama: 1 } })
      const list: any[] = Array.isArray(res?.data?.data) ? res.data.data : []
      
      // Filter hanya santri aktif (bukan mutasi/alumni)
      const santriAktif = list.filter((s: any) => {
        const status = s.status || 'aktif'
        return !['mutasi', 'keluar', 'mutasi_keluar', 'alumni', 'lulus'].includes(status)
      })
      
      const mapped: Santri[] = santriAktif.map((s: any) => ({ id: s.id, nama_santri: s.nama_santri, asrama: s.asrama || s.asrama_nama || null }))
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

  async function addMultipleMembers() {
    if (!memberAsrama?.id || selectedSantriIds.length === 0) {
      toast.error('Pilih minimal satu santri')
      return
    }
    
    try {
      const res = await api.post(`/v1/kesantrian/asrama/${memberAsrama.id}/anggota`, { 
        santri_ids: selectedSantriIds 
      })
      
      if (res.data.status === 'success') {
        toast.success(res.data.message)
        setSelectedSantriIds([])
        setShowAddForm(false)
        await fetchAsrama()
        await openMembers(memberAsrama)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Gagal menambahkan anggota'
      toast.error(message)
    }
  }

  function toggleSantriSelection(santriId: string) {
    setSelectedSantriIds(prev => {
      if (prev.includes(santriId)) {
        return prev.filter(id => id !== santriId)
      } else {
        return [...prev, santriId]
      }
    })
  }

  function toggleSelectAll() {
    const filteredSantri = searchTerm 
      ? availableSantri.filter(s => s.nama_santri.toLowerCase().includes(searchTerm.toLowerCase()))
      : availableSantri
    
    if (selectedSantriIds.length === filteredSantri.length) {
      setSelectedSantriIds([])
    } else {
      setSelectedSantriIds(filteredSantri.map(s => s.id))
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
      <Modal
        open={membersOpen}
        title={`Anggota Asrama${memberAsrama ? `: ${memberAsrama.nama_asrama}` : ''}`}
        onClose={() => setMembersOpen(false)}
        footer={<button className="btn" onClick={() => setMembersOpen(false)}>Tutup</button>}
      >
        <div className="space-y-4">
          {/* Tombol Tambah Anggota */}
          {!showAddForm && (
            <button 
              className="btn btn-primary w-full" 
              onClick={() => setShowAddForm(true)}
            >
              + Tambah Anggota
            </button>
          )}

          {/* Form Tambah Anggota - Hanya tampil jika showAddForm true */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Tambah Anggota Baru</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowAddForm(false)
                    setSelectedSantriIds([])
                    setSearchTerm('')
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Search Box */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cari Santri</label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Ketik nama santri..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Checkbox Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Pilih Santri ({selectedSantriIds.length} dipilih)
                  </label>
                  {availableSantri.length > 0 && (
                    <button 
                      className="text-sm text-brand hover:underline"
                      onClick={toggleSelectAll}
                    >
                      {selectedSantriIds.length === availableSantri.filter(s => !searchTerm || s.nama_santri.toLowerCase().includes(searchTerm.toLowerCase())).length 
                        ? 'Batal Pilih Semua' 
                        : 'Pilih Semua'}
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableSantri.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Semua santri sudah memiliki asrama
                    </p>
                  ) : (
                    availableSantri
                      .filter(s => !searchTerm || s.nama_santri.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSantriIds.includes(s.id)}
                            onChange={() => toggleSantriSelection(s.id)}
                            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                          />
                          <span className="text-sm text-gray-700">{s.nama_santri}</span>
                        </label>
                      ))
                  )}
                </div>

                {selectedSantriIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <button 
                      className="btn btn-primary w-full" 
                      onClick={addMultipleMembers}
                    >
                      Tambahkan {selectedSantriIds.length} Santri ke Asrama
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Card title="Daftar Anggota">
            <MembersTable asrama={memberAsrama!} onRemove={removeMember} />
          </Card>
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

  // Tiru UI anggota kelas: gunakan Table dengan tombol "Keluarkan"
  return (
    <Table<Santri>
      columns={[
        { key: 'no' as any, header: 'No', render: (_v, _row, idx) => idx + 1 },
        { key: 'nama_santri', header: 'Nama Santri' },
        { key: 'asrama', header: 'Asrama', render: () => asrama?.nama_asrama ?? '—' },
        { key: 'aksi' as any, header: 'Aksi', render: (_v, row) => (
          <button className="btn btn-danger" onClick={() => onRemove(row)}>Keluarkan</button>
        ) },
      ]}
      data={Array.isArray(members) ? members : []}
      getRowKey={(row, idx) => (row as any)?.id ?? idx}
    />
  )
}