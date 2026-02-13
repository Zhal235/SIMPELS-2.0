import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Toaster, toast } from 'sonner'
import { getPegawai, createPegawai, updatePegawai, deletePegawai, Pegawai } from '../../api/pegawai'
import { getJabatan, getDepartments, Jabatan, Department } from '../../api/struktur'

// Helper untuk kompresi gambar
async function compressImage(file: File): Promise<Blob> {
  const MAX_SIZE = 1024 * 1024
  const img = await fileToImage(file)

  const scale = img.width > 1024 ? 1024 / img.width : 1
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, targetW, targetH)

  let quality = 0.9
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  if (file.size > MAX_SIZE) {
    quality = 0.7
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  const blob = await (await fetch(dataUrl)).blob()
  return blob
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper untuk menampilkan foto
const getFotoSrc = (fotoPath: string | Blob | undefined) => {
  if (!fotoPath) return undefined
  if (fotoPath instanceof Blob) {
    return URL.createObjectURL(fotoPath)
  }
  if (typeof fotoPath === 'string' && fotoPath.startsWith('http')) return fotoPath
  // Assuming backend returns relative path stored in storage/app/public
  // Adjust base URL based on your backend config
  return `http://localhost:8001/storage/${fotoPath}`
}

export default function DataPegawai() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Pegawai[]>([])
  const [jabatan, setJabatan] = useState<Jabatan[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  
  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Omit<Pegawai, 'foto_profil'>> & { foto_profil?: string | Blob }>({
    nama_pegawai: '',
    jenis_pegawai: 'Pendidik',
    status_kepegawaian: 'Tetap',
    jenis_kelamin: 'L'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async (page = 1) => {
    setIsLoading(true)
    try {
      const [result, jabatanData, departmentData] = await Promise.all([
        getPegawai({ page, search }),
        getJabatan(),
        getDepartments()
      ])
      
      setData(result.data)
      setJabatan(jabatanData.data || jabatanData) 
      setDepartments(departmentData.data || departmentData)
      
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
    setIsSubmitting(true)
    try {
      // Buat FormData baru dari awal
      const form = new FormData()
      
      // Append semua field kecuali foto_profil dulu
      const fields = ['nama_pegawai', 'nip', 'nuptk', 'nik', 'gelar_depan', 'gelar_belakang', 
                      'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'alamat', 'no_hp', 
                      'email', 'jenis_pegawai', 'status_kepegawaian', 'tanggal_mulai_tugas', 
                      'jabatan', 'pendidikan_terakhir', 'status_pernikahan', 'nama_ibu_kandung']
      
      fields.forEach(field => {
        const value = formData[field as keyof Pegawai]
        if (value !== undefined && value !== null && value !== '') {
          form.append(field, String(value))
        }
      })
      
      // Handle foto_profil secara terpisah dan hati-hati
      if (formData.foto_profil && typeof formData.foto_profil === 'object' && (formData.foto_profil as any) instanceof Blob) {
        console.log('Adding foto_profil:', formData.foto_profil)
        form.append('foto_profil', formData.foto_profil as Blob, 'profile.jpg')
      }

      console.log('Final FormData entries:')
      for (let pair of form.entries()) {
        console.log(pair[0], typeof pair[1] === 'object' ? 'Blob/File' : pair[1])
      }

      if (isEditing && editId) {
        await updatePegawai(editId, form)
      } else {
        await createPegawai(form)
      }
      
      toast.success(isEditing ? 'DATA BERHASIL DISIMPAN!' : 'PEGAWAI BARU DITAMBAHKAN', {
         description: isEditing ? 'Perubahan data pegawai telah diperbarui di database.' : 'Data pegawai baru berhasil disimpan.',
         duration: 4000,
      })
      
      setIsModalOpen(false)
      setTimeout(() => fetchData(pagination.currentPage), 300)
      resetForm()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal menyimpan data'
      toast.error('GAGAL MENYIMPAN', { description: msg })
      if (error.response?.data?.errors) {
        console.error('Backend validation errors:', error.response.data.errors)
        if (error.response.data.errors.foto_profil) {
          console.error('Foto error details:', error.response.data.errors.foto_profil)
          toast.error('Error foto: ' + error.response.data.errors.foto_profil.join(', '))
        }
      }
    } finally {
      setIsSubmitting(false)
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
    // Clean foto_profil nilai supaya tidak jadi array
    const cleanedPegawai = { 
      ...pegawai, 
      foto_profil: typeof pegawai.foto_profil === 'string' ? pegawai.foto_profil : undefined 
    }
    setFormData(cleanedPegawai)
    setEditId(pegawai.id)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nama_pegawai: '',
      jenis_pegawai: 'Pendidik', 
      status_kepegawaian: 'Tetap',
      jenis_kelamin: 'L',
      foto_profil: undefined
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
        footer={null}
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
                        value={formData.jenis_pegawai || 'Pendidik'} 
                        onChange={e => setFormData({...formData, jenis_pegawai: e.target.value})}
                      >
                        <option value="Pendidik">Pendidik</option>
                        <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
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
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
                        value={formData.jabatan || ''} 
                        onChange={e => {
                          const selectedJabatan = jabatan.find(j => j.id === parseInt(e.target.value))
                          setFormData({
                            ...formData, 
                            jabatan: selectedJabatan?.nama || ''
                          })
                        }}
                      >
                        <option value="">- Pilih Jabatan -</option>
                        {departments.map(dept => (
                          <optgroup key={dept.id} label={dept.nama}>
                            {jabatan
                              .filter(j => j.department_id === dept.id)
                              .sort((a, b) => a.level - b.level)
                              .map(jab => (
                                <option key={jab.id} value={jab.id}>
                                  {jab.nama} (Level {jab.level})
                                </option>
                              ))
                            }
                          </optgroup>
                        ))}
                        {/* Jabatan tanpa department (Pimpinan Pesantren) */}
                        {jabatan.filter(j => !j.department_id).length > 0 && (
                          <optgroup label="Pimpinan">
                            {jabatan
                              .filter(j => !j.department_id)
                              .sort((a, b) => a.level - b.level)
                              .map(jab => (
                                <option key={jab.id} value={jab.id}>
                                  {jab.nama} (Level {jab.level})
                                </option>
                              ))
                            }
                          </optgroup>
                        )}
                      </select>
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

               {/* Foto Pegawai */}
               <div>
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Foto Pegawai</h3>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                     <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Foto</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
                             onClick={() => document.getElementById('foto-upload')?.click()}
                        >
                           <input 
                              id="foto-upload"
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                 const file = e.target.files?.[0]
                                 if (file) {
                                    try {
                                       const compressed = await compressImage(file)
                                       // Langsung simpan Blob hasil kompresi seperti di SantriForm.tsx
                                       setFormData({...formData, foto_profil: compressed})
                                    } catch (err) {
                                       toast.error('Gagal memproses gambar')
                                    }
                                 }
                              }}
                           />
                           <Upload className="h-10 w-10 text-gray-400 mb-2" />
                           <p className="text-sm text-gray-600 font-medium">Klik untuk upload foto</p>
                           <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
                        </div>
                     </div>
                     <div className="w-full md:w-1/2 flex flex-col items-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview Foto</label>
                         <div className="w-32 h-40 bg-gray-100 border rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                           {formData.foto_profil ? (
                              <img 
                                 src={getFotoSrc(formData.foto_profil)} 
                                 alt="Preview" 
                                 className="w-full h-full object-cover"
                              />
                           ) : (
                              <div className="text-gray-400 flex flex-col items-center">
                                 <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                 </svg>
                                 <span className="text-xs">No Photo</span>
                              </div>
                           )}
                        </div>
                        {formData.foto_profil && (
                           <button 
                             type="button"
                             onClick={() => setFormData({...formData, foto_profil: undefined})}
                             className="mt-2 text-xs text-red-600 hover:text-red-800"
                           >
                             Hapus Foto
                           </button>
                        )}
                     </div>
                  </div>
               </div>

              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pb-6 pt-4 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 bg-white disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-70 disabled:cursor-wait"
                  >
                     {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                     ) : (
                        isEditing ? 'Simpan Perubahan' : 'Tambah Pegawai'
                     )}
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  )
}
