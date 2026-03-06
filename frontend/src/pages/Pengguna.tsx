import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'
import { useAuthStore, hasAccess } from '../stores/useAuthStore'
import { listUsers, updateUser, deleteUser, createUser } from '../api/users'
import { listRoles, createRole, updateRole, deleteRole } from '../api/roles'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

type UserRow = { name: string; role: string; email: string }

export default function Pengguna() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const currentRole = roles?.find((r: any) => r.slug === currentUser?.role)

  // edit modal
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  // delete confirm
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const payload = await listUsers()
        if (payload?.success) setRows(payload.data || [])
      } catch (e) {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function reload() {
    try {
      setLoading(true)
      const payload = await listUsers()
      if (payload?.success) setRows(payload.data || [])
    } catch (e) {
      toast.error('Gagal memuat pengguna')
    } finally { setLoading(false) }
  }

  async function handleSave() {
    if (!editing) return
    try {
      const payload: any = { role: newRole }
      if (newPassword && newPassword.trim().length > 0) payload.password = newPassword
      const res = await updateUser(editing.id, payload)
      if (res.success) {
        toast.success('Perubahan user tersimpan')
        setShowEdit(false)
        setEditing(null)
        await reload()
      } else {
        toast.error(res.message || 'Gagal menyimpan perubahan')
      }
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan perubahan')
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    try {
      const res = await deleteUser(deleting.id)
      if (res.success) {
        toast.success('User dihapus')
        setShowDelete(false)
        setDeleting(null)
        await reload()
      } else {
        toast.error(res.message || 'Gagal menghapus user')
      }
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus user')
    }
  }

  // create user
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('user')

  async function handleCreateUser() {
    try {
      const payload: any = { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }
      const res = await createUser(payload)
      if (res.success) {
        toast.success('User dibuat')
        setShowCreateUser(false)
        setNewUserName('')
        setNewUserEmail('')
        setNewUserPassword('')
        await reload()
      }
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Gagal membuat user')
    }
  }

  // Roles management
  const [rolesList, setRolesList] = useState<any[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRoleObj, setEditingRoleObj] = useState<any | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleMenus, setRoleMenus] = useState<string[]>([])

  // Type definition untuk menu
  type MenuItemType = {
    key: string
    label: string
    permissions?: string[]
  }

  type MenuCategoryType = {
    title: string
    menus: MenuItemType[]
  }

  const menuCategories: Record<string, MenuCategoryType> = {
    dashboard: {
      title: 'Dashboard',
      menus: [
        { key: 'dashboard', label: 'Akses Dashboard' }
      ]
    },
    pengumuman: {
      title: 'Pengumuman',
      menus: [
        { key: 'pengumuman', label: 'Pengumuman', permissions: ['edit', 'delete'] }
      ]
    },
    kesantrian: {
      title: 'Kesantrian',
      menus: [
        { key: 'kesantrian.santri', label: 'Data Santri', permissions: ['edit', 'delete'] },
        { key: 'kesantrian.kelas', label: 'Kelas', permissions: ['edit', 'delete'] },
        { key: 'kesantrian.asrama', label: 'Asrama', permissions: ['edit', 'delete'] },
        { key: 'kesantrian.koreksi_data', label: 'Koreksi Data' },
        { key: 'kesantrian.mutasi.masuk', label: 'Mutasi Masuk' },
        { key: 'kesantrian.mutasi.keluar', label: 'Mutasi Keluar' },
        { key: 'kesantrian.alumni', label: 'Alumni' }
      ]
    },
    keuangan: {
      title: 'Keuangan',
      menus: [
        { key: 'keuangan.pembayaran', label: 'Pembayaran Santri', permissions: ['edit', 'delete'] },
        { key: 'keuangan.transaksi-kas', label: 'Transaksi Kas', permissions: ['edit', 'delete'] },
        { key: 'keuangan.buku-kas', label: 'Buku Kas', permissions: ['edit', 'delete'] },
        { key: 'keuangan.laporan', label: 'Laporan' },
        { key: 'keuangan.tagihan', label: 'Tagihan Santri', permissions: ['edit', 'delete'] },
        { key: 'keuangan.bukti-transfer', label: 'Bukti Transfer', permissions: ['edit', 'delete'] },
        { key: 'keuangan.rekening-bank', label: 'Rekening Bank', permissions: ['edit', 'delete'] },
        { key: 'keuangan.tabungan', label: 'Tabungan Santri', permissions: ['edit', 'delete'] },
        { key: 'keuangan.tunggakan', label: 'Tunggakan Santri' },
        { key: 'keuangan.pengaturan', label: 'Pengaturan Tagihan', permissions: ['edit', 'delete'] }
      ]
    },
    dompet: {
      title: 'Dompet Digital',
      menus: [
        { key: 'dompet.dompet-santri', label: 'Dompet Santri', permissions: ['edit', 'delete'] },
        { key: 'dompet.manajemen-keuangan', label: 'Manajemen Keuangan' },
        { key: 'dompet.history', label: 'History Transaksi' },
        { key: 'dompet.laporan', label: 'Laporan Keuangan' },
        { key: 'dompet.tagihan', label: 'Tagihan Kolektif', permissions: ['edit', 'delete'] },
        { key: 'dompet.rfid', label: 'Kelola RFID', permissions: ['edit', 'delete'] },
        { key: 'dompet.settings', label: 'Pengaturan Dompet', permissions: ['edit'] },
        { key: 'dompet.manage', label: 'Manage Transaksi', permissions: ['edit', 'delete'] },
        { key: 'dompet.withdrawals', label: 'Penarikan (ePOS)', permissions: ['edit', 'delete'] }
      ]
    },
    akademik: {
      title: 'Akademik',
      menus: [
        { key: 'akademik.tahun-ajaran', label: 'Tahun Ajaran', permissions: ['edit', 'delete'] }
      ]
    },
    kepegawaian: {
      title: 'Guru & Kepegawaian',
      menus: [
        { key: 'kepegawaian.data-pegawai', label: 'Data Pegawai', permissions: ['edit', 'delete'] },
        { key: 'kepegawaian.struktur-jabatan', label: 'Struktur & Jabatan', permissions: ['edit', 'delete'] }
      ]
    },
    system: {
      title: 'System',
      menus: [
        { key: 'pengguna', label: 'Manajemen Pengguna', permissions: ['edit', 'delete'] },
        { key: 'pengguna.roles', label: 'Kelola Role' },
        { key: 'pengaturan', label: 'Pengaturan Sistem' }
      ]
    }
  }

  // State untuk collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(k => k !== categoryKey)
        : [...prev, categoryKey]
    )
  }

  const getPermissionKey = (menuKey: string, permission?: string) => {
    return permission ? `${menuKey}.${permission}` : menuKey
  }

  const isPermissionChecked = (menuKey: string, permission?: string) => {
    const key = getPermissionKey(menuKey, permission)
    return roleMenus.includes(key)
  }

  const togglePermission = (menuKey: string, permission?: string) => {
    const key = getPermissionKey(menuKey, permission)
    setRoleMenus(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }



  async function loadRoles() {
    try {
      setRolesLoading(true)
      const res = await listRoles()
      if (res?.success) setRolesList(res.data || [])
    } catch (e) {
      toast.error('Gagal memuat roles')
    } finally { setRolesLoading(false) }
  }

  useEffect(() => { loadRoles() }, [])

  function openCreateRole() {
    setEditingRoleObj(null)
    setRoleName('')
    setRoleMenus([])
    setCollapsedCategories([]) // Expand all categories by default
    setShowRoleModal(true)
  }

  function openEditRole(role:any) {
    setEditingRoleObj(role)
    setRoleName(role.name)
    setRoleMenus(role.menus ?? [])
    setCollapsedCategories([]) // Expand all categories by default
    setShowRoleModal(true)
  }

  async function saveRole() {
    if (!roleName.trim()) { toast.error('Nama role harus diisi'); return }
    try {
      if (editingRoleObj) {
        const res = await updateRole(editingRoleObj.id, { name: roleName, menus: roleMenus })
        if (res.success) {
          toast.success('Role diperbarui')
          setShowRoleModal(false)
          await loadRoles()
        }
      } else {
        const res = await createRole({ name: roleName, menus: roleMenus })
        if (res.success) {
          toast.success('Role dibuat')
          setShowRoleModal(false)
          await loadRoles()
        }
      }
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan role')
    }
  }

  async function removeRole(role:any) {
    if (!confirm(`Hapus role ${role.name}?`)) return
    try {
      const res = await deleteRole(role.id)
      if (res.success) {
        toast.success('Role dihapus')
        await loadRoles()
      }
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus role')
    }
  }

  const columns: any[] = [
    { key: 'name', header: 'Nama' },
    { key: 'role', header: 'Role' },
    { key: 'email', header: 'Email' },
  ]

  // add actions column for admins
  if (hasAccess('pengguna.edit') || hasAccess('pengguna.delete')) {
    columns.push({ key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
      <div className="flex gap-2">
        {hasAccess('pengguna.edit') && (
        <button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={() => { setEditing(r); setNewRole(r.role); setNewPassword(''); setShowEdit(true) }}>Edit</button>)}
        {hasAccess('pengguna.delete') && (
        <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={() => { setDeleting(r); setShowDelete(true) }}>Hapus</button>)}
      </div>
    ) })
  }


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pengguna</h2>
      <div className="flex items-center justify-between mb-3">
        <div />
        {(hasAccess('pengguna.edit') || hasAccess('pengguna.roles') || currentUser?.role === 'admin') && (
          <div className="flex items-center gap-2">
            {(hasAccess('pengguna.edit') || currentUser?.role === 'admin') && (
            <button className="btn" onClick={() => setShowCreateUser(true)}>Tambah User</button>)}
            {(hasAccess('pengguna.roles') || currentUser?.role === 'admin') && (
            <button className="btn btn-primary" onClick={openCreateRole}>Tambah Role</button>)}
          </div>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table columns={columns as any} data={rows} />
        )}
      </Card>

      {/* Create user modal */}
      <Modal open={showCreateUser} title="Tambah User" onClose={() => setShowCreateUser(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowCreateUser(false)}>Batal</button>
          <button className="btn btn-primary" onClick={handleCreateUser}>Buat User</button>
        </>
      )}>
        <div className="grid gap-3">
          <label className="block text-sm">Nama</label>
          <input className="rounded border px-3 py-2" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />

          <label className="block text-sm">Email</label>
          <input className="rounded border px-3 py-2" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />

          <label className="block text-sm">Password</label>
          <input type="password" className="rounded border px-3 py-2" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />

          <label className="block text-sm">Role</label>
          <select 
            value={newUserRole} 
            onChange={(e) => setNewUserRole(e.target.value)} 
            className="rounded border px-3 py-2 w-full"
            disabled={rolesLoading}
          >
            <option value="user">User (Default)</option>
            <option value="admin">Super Admin</option>
            {rolesList.map(r => <option value={r.slug} key={r.id}>{r.name}</option>)}
          </select>
        </div>
      </Modal>

      {/* Roles management — admin only */}
      {(currentUser?.role === 'admin' || hasAccess('pengguna.roles')) && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mt-6">Kelola Role</h2>
            <div>
              <button className="btn btn-primary" onClick={openCreateRole}>Tambah Role</button>
            </div>
          </div>
          <Card>
            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
                <Table columns={[
                  { key: 'name', header: 'Nama' }, 
                  {
                    key: 'menus',
                    header: 'Akses Menu',
                    render: (_v:any, r:any) => {
                      if (!r.menus?.length) return <span className="text-gray-400 text-xs">Tidak ada akses</span>
                      const PERM_SUFFIXES = ['edit','delete','view','create','update']
                      const baseMenus = r.menus.filter((m: string) => !PERM_SUFFIXES.includes(m.split('.').pop()!))
                      return (
                        <div className="flex flex-wrap gap-1">
                          {baseMenus.slice(0, 5).map((m: string) => (
                            <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{m.split('.').pop()}</span>
                          ))}
                          {baseMenus.length > 5 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{baseMenus.length - 5}</span>
                          )}
                        </div>
                      )
                    }
                  },
                  { 
                    key: 'actions', 
                    header: 'Aksi', 
                    render: (_v:any, r:any) => (
                      <div className="flex gap-2">
                        {(hasAccess('pengguna.roles') || currentUser?.role === 'admin') && (
                          <button className="btn btn-sm" onClick={() => openEditRole(r)}>Edit</button>
                        )}
                        {(hasAccess('pengguna.roles') || currentUser?.role === 'admin') && (
                          <button className="btn btn-danger btn-sm" onClick={() => removeRole(r)}>Hapus</button>
                        )}
                      </div>
                    )
                  }
                ]} data={rolesList} />
            )}
          </Card>

          <Modal open={showRoleModal} title={editingRoleObj ? `Edit Role: ${editingRoleObj.name}` : 'Tambah Role'} onClose={() => setShowRoleModal(false)} footer={(
            <>
              <button className="btn" onClick={() => setShowRoleModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={saveRole}>Simpan</button>
            </>
          )}>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Role</label>
                <input 
                  type="text" 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value)} 
                  className="w-full rounded border px-3 py-2" 
                  placeholder="Masukkan nama role..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Izin Menu</label>
                  <div className="text-xs text-gray-500">
                    {roleMenus.length} permission{roleMenus.length !== 1 ? 's' : ''} dipilih
                  </div>
                </div>
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {Object.entries(menuCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="border-b last:border-0">
                    <div
                      className="flex items-center justify-between cursor-pointer px-4 py-2.5 bg-gray-50 hover:bg-gray-100"
                      onClick={() => toggleCategory(categoryKey)}
                    >
                      <h4 className="font-semibold text-gray-700 text-sm">{category.title}</h4>
                      <span className="text-gray-400 text-xs">{collapsedCategories.includes(categoryKey) ? '▼' : '▲'}</span>
                    </div>
                    {!collapsedCategories.includes(categoryKey) && (
                      <div className="divide-y divide-gray-50">
                        {category.menus.map(menu => (
                          <div key={menu.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isPermissionChecked(menu.key)}
                                onChange={() => togglePermission(menu.key)}
                                className="w-4 h-4 rounded accent-blue-600"
                              />
                              <span className="text-sm text-gray-800">{menu.label}</span>
                            </label>
                            {menu.permissions && (
                              <div className="flex gap-1.5 ml-3">
                                {menu.permissions.map(perm => (
                                  <button
                                    key={perm}
                                    type="button"
                                    onClick={() => togglePermission(menu.key, perm)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                      isPermissionChecked(menu.key, perm)
                                        ? perm === 'delete' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                  >
                                    {perm === 'edit' ? '✎ Tambah & Ubah' : '✕ Hapus'}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={showEdit} title={`Edit Pengguna: ${editing?.name || ''}`} onClose={() => setShowEdit(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowEdit(false)}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
        </>
      )}>
        <div className="grid gap-3">
          <label className="block text-sm">Role {rolesLoading && <span className="text-xs text-gray-400">(Memuat...)</span>}</label>
          <select 
            value={newRole} 
            onChange={(e) => setNewRole(e.target.value)} 
            className="rounded border px-3 py-2 w-full"
            disabled={rolesLoading}
          >
            <option value="user">User (Default)</option>
            <option value="admin">Super Admin</option>
            {rolesList.map(role => (
              <option value={role.slug} key={role.id}>{role.name}</option>
            ))}
          </select>

          <label className="block text-sm">Password baru (kosongkan kalau tidak ingin mengganti)</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded border px-3 py-2" />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={showDelete} title={`Hapus User: ${deleting?.name || ''}`} onClose={() => setShowDelete(false)} footer={(
        <>
          <button className="btn" onClick={() => setShowDelete(false)}>Batal</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Konfirmasi Hapus</button>
        </>
      )}>
        <div>Anda yakin ingin menghapus user <strong>{deleting?.email}</strong>? Aksi ini tidak bisa di-undo.</div>
      </Modal>
    </div>
  )
}