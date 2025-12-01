import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import api from '../../api'
import { handleError } from '../../utils/handleError'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, UserRoundPlus } from 'lucide-react'

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
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)

  const santriInKelas = useMemo(() => {
    // Pastikan kedua ID dibandingkan dalam tipe yang sama (number)
    const filtered = santriList.filter(s => {
      const santriKelasId = s.kelas_id ? Number(s.kelas_id) : null
      const currentKelasId = memberKelas?.id ? Number(memberKelas.id) : null
      return santriKelasId === currentKelasId && currentKelasId !== null
    })
    return filtered
  }, [santriList, memberKelas])
  
  const santriTanpaKelas = useMemo(() => {
    const filtered = santriList.filter(s => !s.kelas_id)
    if (!searchTerm) return filtered
    return filtered.filter(s => s.nama_santri.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [santriList, searchTerm])

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
    setSelectedSantriIds([])
    setSearchTerm('')
    setShowAddForm(false)
    setSelectedSantriId('')
    try {
      // Ambil semua santri termasuk yang sudah punya kelas untuk refresh tampilan
      const res = await api.get('/v1/kesantrian/santri', { params: { page: 1, perPage: 1000 } })
      const raw = res?.data
      const dataArr: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : []
      
      // Filter hanya santri aktif (bukan mutasi/alumni)
      const santriAktif = dataArr.filter((s: any) => {
        const status = s.status || 'aktif'
        return !['mutasi', 'keluar', 'mutasi_keluar', 'alumni', 'lulus'].includes(status)
      })
      
      // Map dengan benar, pastikan kelas_id ada
      const mapped = santriAktif.map((s: any) => ({
        id: s.id,
        nama_santri: s.nama_santri,
        kelas_id: s.kelas_id || null
      }))
      
      setSantriList(mapped as SantriItem[])
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

  async function addMultipleMembers() {
    if (!memberKelas || selectedSantriIds.length === 0) {
      toast.error('Pilih minimal satu santri')
      return
    }
    
    try {
      const res = await api.post(`/v1/kesantrian/kelas/${memberKelas.id}/anggota`, { 
        santri_ids: selectedSantriIds 
      })
      
      if (res.data.success) {
        toast.success(res.data.message)
        setSelectedSantriIds([])
        setShowAddForm(false)
        // Refresh santri list & kelas table
        await openMembers(memberKelas)
        await fetchData()
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
    if (selectedSantriIds.length === santriTanpaKelas.length) {
      setSelectedSantriIds([])
    } else {
      setSelectedSantriIds(santriTanpaKelas.map(s => s.id))
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
                    <Button
                      variant="outline"
                      size="icon"
                      title="Edit"
                      className="border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-all duration-150 rounded-lg shadow-sm bg-white"
                      onClick={() => openEdit(row)}
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
                      onClick={() => deleteKelas(row)}
                    >
                      <Trash2 size={16} />
                    </Button>
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
                    {santriTanpaKelas.length > 0 && (
                      <button 
                        className="text-sm text-brand hover:underline"
                        onClick={toggleSelectAll}
                      >
                        {selectedSantriIds.length === santriTanpaKelas.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {santriTanpaKelas.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {searchTerm ? 'Tidak ada santri yang sesuai pencarian' : 'Semua santri sudah memiliki kelas'}
                      </p>
                    ) : (
                      santriTanpaKelas.map((s) => (
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
                        Tambahkan {selectedSantriIds.length} Santri ke Kelas
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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