import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Toaster, toast } from 'sonner'
import { getPegawai, createPegawai, updatePegawai, deletePegawai, Pegawai } from '../../api/pegawai'

export default function DataPegawai() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Pegawai[]>([])
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  
  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Pegawai>>({
    nama_pegawai: '',
    jenis_pegawai: 'Guru',
    status_kepegawaian: 'Tetap',
    jenis_kelamin: 'L'
  })

  const fetchData = async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await getPegawai({ page, search })
      setData(result.data)
      setPagination({
        currentPage: result.current_page,
        lastPage: result.last_page,
        total: result.total
      })
    } catch (error) {
      toast.error('Gagal memuat data pegawai')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchData(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEditing && editId) {
        await updatePegawai(editId, formData)
        toast.success('Pegawai berhasil diperbarui')
      } else {
        await createPegawai(formData)
        toast.success('Pegawai berhasil ditambahkan')
      }
      setIsModalOpen(false)
      fetchData(pagination.currentPage)
      resetForm()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan'
      toast.error(msg)
      // Tampilkan error validasi jika ada
      if (error.response?.data?.errors) {
        console.error(error.response.data.errors)
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) return
    try {
      await deletePegawai(id)
      toast.success('Pegawai berhasil dihapus')
      fetchData(pagination.currentPage)
    } catch (error) {
      toast.error('Gagal menghapus pegawai')
    }
  }

  const handleEdit = (pegawai: Pegawai) => {
    setFormData(pegawai)
    setEditId(pegawai.id)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nama_pegawai: '',
      jenis_pegawai: 'Guru',
      status_kepegawaian: 'Tetap',
      jenis_kelamin: 'L'
    })
    setEditId(null)
    setIsEditing(false)
  }

  const columns = [
    { 
      header: 'Nama Pegawai', 
      key: 'nama_pegawai',
      render: (val: any, row: Pegawai) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.gelar_depan} {row.nama_pegawai} {row.gelar_belakang}
          </div>
          <div className="text-xs text-gray-500">{row.nip || 'NIP: -'}</div>
        </div>
      )
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (val: any, row: Pegawai) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        row.status_kepegawaian === 'Tetap' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {row.jenis_pegawai} - {row.status_kepegawaian}
      </span>
    )},
    { 
      header: 'Kontak', 
      key: 'kontak',
      render: (val: any, row: Pegawai) => (
      <div className="text-sm text-gray-500">
        <div>{row.no_hp || '-'}</div>
        <div>{row.email || '-'}</div>
      </div>
    )},
    { header: 'Jabatan', key: 'jabatan' },
    {
       header: 'Aksi',
       key: 'aksi',
       render: (val: any, row: Pegawai) => (
         <div className="flex items-center gap-2">
           <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
             <Pencil className="w-4 h-4" />
           </button>
           <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
             <Trash2 className="w-4 h-4" />
           </button>
         </div>
       )
    }
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pegawai</h1>
          <p className="text-sm text-gray-500">Manajemen data guru dan staf</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true) }}
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
        >
          <Plus className="w-4 h-4" />
          Tambah Pegawai
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 relative max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Cari nama, NIP..."
                className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <Table
          data={data}
          columns={columns}
        />
        
        {/* Pagination Simple */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => fetchData(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => fetchData(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Halaman <span className="font-medium">{pagination.currentPage}</span> dari <span className="font-medium">{pagination.lastPage}</span>
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => fetchData(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                             onClick={() => fetchData(pagination.currentPage + 1)}
                             disabled={pagination.currentPage === pagination.lastPage}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      </div>
      
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditing ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
      >
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Grup Identitas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Identitas Diri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.nama_pegawai || ''} 
                        onChange={e => setFormData({...formData, nama_pegawai: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                       <div>
                          <label className="block text-sm font-medium text-gray-700">Gelar Depan</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                            value={formData.gelar_depan || ''} 
                            onChange={e => setFormData({...formData, gelar_depan: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700">Gelar Belakang</label>
                          <input 
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                            value={formData.gelar_belakang || ''} 
                            onChange={e => setFormData({...formData, gelar_belakang: e.target.value})}
                          />
                       </div>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700">NIK (KTP)</label>
                      <input 
                        type="text" 
                        maxLength={16}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.nik || ''} 
                        onChange={e => setFormData({...formData, nik: e.target.value})}
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.jenis_kelamin || 'L'} 
                        onChange={e => setFormData({...formData, jenis_kelamin: e.target.value as 'L'|'P'})}
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                  </div>
                  
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                      <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.tempat_lahir || ''} 
                        onChange={e => setFormData({...formData, tempat_lahir: e.target.value})}
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.tanggal_lahir || ''} 
                        onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})}
                      />
                  </div>
                </div>
              </div>
              
              {/* Grup Kepegawaian */}
              <div>
                 <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Data Kepegawaian</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">NIP / NIPY</label>
                      <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.nip || ''} 
                        onChange={e => setFormData({...formData, nip: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">NUPTK (Optional)</label>
                      <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.nuptk || ''} 
                        onChange={e => setFormData({...formData, nuptk: e.target.value})}
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Jenis Pegawai</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.jenis_pegawai || 'Guru'} 
                        onChange={e => setFormData({...formData, jenis_pegawai: e.target.value})}
                      >
                        <option value="Guru">Guru</option>
                        <option value="Staff">Staff TU</option>
                        <option value="Security">Keamanan</option>
                        <option value="Kebersihan">Kebersihan</option>
                         <option value="Lainnya">Lainnya</option>
                      </select>
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Status Kepegawaian</label>
                      <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.status_kepegawaian || 'Tetap'} 
                        onChange={e => setFormData({...formData, status_kepegawaian: e.target.value})}
                      >
                        <option value="Tetap">Tetap</option>
                        <option value="Kontrak">Kontrak</option>
                        <option value="Honorer">Honorer</option>
                         <option value="Magang">Magang</option>
                      </select>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Jabatan Struktural</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Kepala Sekolah, Waka Kurikulum"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.jabatan || ''} 
                        onChange={e => setFormData({...formData, jabatan: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Tanggal Mulai Tugas</label>
                       <input 
                        type="date" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.tanggal_mulai_tugas || ''} 
                        onChange={e => setFormData({...formData, tanggal_mulai_tugas: e.target.value})}
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Pendidikan Terakhir</label>
                       <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.pendidikan_terakhir || ''} 
                        onChange={e => setFormData({...formData, pendidikan_terakhir: e.target.value})}
                      >
                         <option value="">- Pilih -</option>
                         <option value="SD">SD</option>
                         <option value="SMP">SMP</option>
                         <option value="SMA">SMA/SMK</option>
                         <option value="D3">D3</option>
                         <option value="S1">S1</option>
                         <option value="S2">S2</option>
                         <option value="S3">S3</option>
                      </select>
                  </div>
                 </div>
              </div>

               {/* Kontak & Lainnya */}
               <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Kontak & Lainnya</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">No. HP / WA</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                          value={formData.no_hp || ''} 
                          onChange={e => setFormData({...formData, no_hp: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                          type="email" 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                          value={formData.email || ''} 
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                       <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                        <textarea 
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                          value={formData.alamat || ''} 
                          onChange={e => setFormData({...formData, alamat: e.target.value})}
                        />
                      </div>
                       <div>
                        <label className="block text-sm font-medium text-gray-700">Status Pernikahan</label>
                        <select 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                          value={formData.status_pernikahan || ''} 
                          onChange={e => setFormData({...formData, status_pernikahan: e.target.value})}
                        >
                            <option value="">- Pilih -</option>
                            <option value="Belum Menikah">Belum Menikah</option>
                            <option value="Menikah">Menikah</option>
                            <option value="Janda/Duda">Janda/Duda</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Ibu Kandung</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                          value={formData.nama_ibu_kandung || ''} 
                          onChange={e => setFormData({...formData, nama_ibu_kandung: e.target.value})}
                        />
                      </div>
                   </div>
               </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 bg-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand/90"
                  >
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Pegawai'}
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  )
}
