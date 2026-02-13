import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Building2, Users } from 'lucide-react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Toaster, toast } from 'sonner'
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getJabatan,
  createJabatan,
  updateJabatan, 
  deleteJabatan,
  Department,
  Jabatan
} from '../../api/struktur'

export default function StrukturJabatan() {
  // States
  const [activeTab, setActiveTab] = useState<'departments' | 'jabatan'>('departments')
  const [departments, setDepartments] = useState<Department[]>([])
  const [jabatan, setJabatan] = useState<Jabatan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentModal, setDepartmentModal] = useState({ open: false, mode: 'create' as 'create' | 'edit', data: null as Department | null })
  const [jabatanModal, setJabatanModal] = useState({ open: false, mode: 'create' as 'create' | 'edit', data: null as Jabatan | null })
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [departmentResponse, jabatanResponse] = await Promise.all([
        getDepartments(),
        getJabatan()
      ])
      
      // Handle response structure - check if data is in .data property or direct
      const departmentData = departmentResponse.data || departmentResponse
      const jabatanData = jabatanResponse.data || jabatanResponse
      
      setDepartments(departmentData)
      
      // Process jabatan data to include relations (backend should already include this)
      setJabatan(jabatanData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      const message = error?.response?.data?.message || 'Gagal memuat data'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Department handlers
  const handleSaveDepartment = async (formData: FormData) => {
    try {
      const data = {
        nama: formData.get('nama') as string,
        kode: formData.get('kode') as string,
        deskripsi: formData.get('deskripsi') as string,
      }

      if (departmentModal.mode === 'create') {
        await createDepartment(data)
        toast.success('Department berhasil ditambahkan')
      } else {
        await updateDepartment(departmentModal.data!.id, data)
        toast.success('Department berhasil diperbarui')
      }

      setDepartmentModal({ open: false, mode: 'create', data: null })
      loadData()
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal menyimpan department'
      toast.error(message)
    }
  }

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus department ini?')) return
    
    try {
      await deleteDepartment(id)
      toast.success('Department berhasil dihapus')
      loadData()
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal menghapus department'
      toast.error(message)
    }
  }

  // Jabatan handlers  
  const handleSaveJabatan = async (formData: FormData) => {
    try {
      const data = {
        nama: formData.get('nama') as string,
        kode: formData.get('kode') as string,
        level: parseInt(formData.get('level') as string),
        department_id: formData.get('department_id') ? parseInt(formData.get('department_id') as string) : null,
        parent_id: formData.get('parent_id') ? parseInt(formData.get('parent_id') as string) : undefined,
        deskripsi: formData.get('deskripsi') as string,
      }

      if (jabatanModal.mode === 'create') {
        await createJabatan(data)
        toast.success('Jabatan berhasil ditambahkan')
      } else {
        await updateJabatan(jabatanModal.data!.id, data)
        toast.success('Jabatan berhasil diperbarui')
      }

      setJabatanModal({ open: false, mode: 'create', data: null })
      loadData()
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal menyimpan jabatan'
      toast.error(message)
    }
  }

  const handleDeleteJabatan = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) return
    
    try {
      await deleteJabatan(id)
      toast.success('Jabatan berhasil dihapus')
      loadData()
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal menghapus jabatan'
      toast.error(message)
    }
  }

  // Filtered data
  const filteredDepartments = departments.filter(dept =>
    dept.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.kode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredJabatan = jabatan.filter(jab =>
    jab.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jab.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jab.department?.nama.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Department columns
  const departmentColumns = [
    { key: 'nama', header: 'Nama Department', accessor: 'nama' as keyof Department },
    { key: 'kode', header: 'Kode', accessor: 'kode' as keyof Department },
    { 
      key: 'deskripsi',
      header: 'Deskripsi', 
      accessor: 'deskripsi' as keyof Department,
      render: (value: string) => value || '-'
    },
    {
      key: 'actions',
      header: 'Aksi',
      accessor: 'id' as keyof Department,
      render: (_: any, item: Department) => (
        <div className="flex gap-2">
          <button
            onClick={() => setDepartmentModal({ open: true, mode: 'edit', data: item })}
            className="text-blue-600 hover:text-blue-800"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteDepartment(item.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  // Jabatan columns
  const jabatanColumns = [
    { key: 'nama', header: 'Nama Jabatan', accessor: 'nama' as keyof Jabatan },
    { key: 'kode', header: 'Kode', accessor: 'kode' as keyof Jabatan },
    { key: 'level', header: 'Level', accessor: 'level' as keyof Jabatan },
    { 
      key: 'department',
      header: 'Department', 
      accessor: 'department' as keyof Jabatan,
      render: (dep: Department, item: Jabatan) => dep?.nama || (item.level === 0 ? 'Pimpinan Pesantren' : '-')
    },
    { 
      key: 'parent',
      header: 'Parent Jabatan', 
      accessor: 'parent' as keyof Jabatan,
      render: (parent: Jabatan) => parent?.nama || '-'
    },
    {
      key: 'actions',
      header: 'Aksi',
      accessor: 'id' as keyof Jabatan,
      render: (_: any, item: Jabatan) => (
        <div className="flex gap-2">
          <button
            onClick={() => setJabatanModal({ open: true, mode: 'edit', data: item })}
            className="text-blue-600 hover:text-blue-800"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteJabatan(item.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Struktur dan Jabatan</h1>
          <p className="text-gray-600">Kelola department dan struktur jabatan organisasi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'departments'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Department
          </button>
          <button
            onClick={() => setActiveTab('jabatan')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'jabatan'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Jabatan
          </button>
        </nav>
      </div>

      {/* Department Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari department..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setDepartmentModal({ open: true, mode: 'create', data: null })}
              className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Department
            </button>
          </div>

          {/* Department Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <Table
              data={filteredDepartments}
              columns={departmentColumns}
            />
          )}
        </div>
      )}

      {/* Jabatan Tab */}
      {activeTab === 'jabatan' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari jabatan..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setJabatanModal({ open: true, mode: 'create', data: null })}
              className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Jabatan
            </button>
          </div>

          {/* Jabatan Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <Table
              data={filteredJabatan}
              columns={jabatanColumns}
            />
          )}
        </div>
      )}

      {/* Department Modal */}
      <Modal
        open={departmentModal.open}
        onClose={() => setDepartmentModal({ open: false, mode: 'create', data: null })}
        title={departmentModal.mode === 'create' ? 'Tambah Department' : 'Edit Department'}
        footer={""}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSaveDepartment(new FormData(e.currentTarget))
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Department
            </label>
            <input
              type="text"
              name="nama"
              required
              defaultValue={departmentModal.data?.nama || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Department
            </label>
            <input
              type="text"
              name="kode"
              required
              defaultValue={departmentModal.data?.kode || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="deskripsi"
              rows={3}
              defaultValue={departmentModal.data?.deskripsi || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDepartmentModal({ open: false, mode: 'create', data: null })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand/90"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Jabatan Modal */}
      <Modal
        open={jabatanModal.open}
        onClose={() => setJabatanModal({ open: false, mode: 'create', data: null })}
        title={jabatanModal.mode === 'create' ? 'Tambah Jabatan' : 'Edit Jabatan'}
        footer={""}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSaveJabatan(new FormData(e.currentTarget))
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Jabatan
            </label>
            <input
              type="text"
              name="nama"
              required
              defaultValue={jabatanModal.data?.nama || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Jabatan
            </label>
            <input
              type="text"
              name="kode"
              required
              defaultValue={jabatanModal.data?.kode || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level (0 = Pimpinan Pesantren, 1 = tertinggi)
            </label>
            <input
              type="number"
              name="level"
              min="0"
              max="10"
              required
              defaultValue={jabatanModal.data?.level || 1}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department (Kosongkan untuk Pimpinan Pesantren)
            </label>
            <select
              name="department_id"
              defaultValue={jabatanModal.data?.department_id || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tidak ada department (Pimpinan Pesantren)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Jabatan (Opsional)
            </label>
            <select
              name="parent_id"
              defaultValue={jabatanModal.data?.parent_id || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Tidak ada parent</option>
              {jabatan
                .filter(j => j.id !== jabatanModal.data?.id) // Prevent self-reference
                .map((jab) => (
                <option key={jab.id} value={jab.id}>
                  {jab.nama} {jab.department ? `(${jab.department.nama})` : '(Pimpinan Pesantren)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="deskripsi"
              rows={3}
              defaultValue={jabatanModal.data?.deskripsi || ''}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setJabatanModal({ open: false, mode: 'create', data: null })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand/90"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}