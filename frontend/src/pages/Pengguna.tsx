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
        console.error('Failed to fetch users', e)
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
      console.error('Failed to fetch users', e)
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
      console.error(e)
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
      console.error(e)
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
      console.error(e)
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
    kesantrian: {
      title: 'Kesantrian',
      menus: [
        { key: 'kesantrian.santri', label: 'Data Santri', permissions: ['view', 'edit', 'delete'] },
        { key: 'kesantrian.kelas', label: 'Kelas', permissions: ['view', 'edit', 'delete'] },
        { key: 'kesantrian.asrama', label: 'Asrama', permissions: ['view', 'edit', 'delete'] },
        { key: 'kesantrian.koreksi_data', label: 'Koreksi Data' },
        { key: 'kesantrian.mutasi.masuk', label: 'Mutasi Masuk' },
        { key: 'kesantrian.mutasi.keluar', label: 'Mutasi Keluar' },
        { key: 'kesantrian.alumni', label: 'Alumni' }
      ]
    },
    keuangan: {
      title: 'Keuangan',
      menus: [
        { key: 'keuangan.pembayaran', label: 'Pembayaran Santri' },
        { key: 'keuangan.transaksi-kas', label: 'Transaksi Kas', permissions: ['view', 'edit', 'delete'] },
        { key: 'keuangan.buku-kas', label: 'Buku Kas', permissions: ['view', 'edit', 'delete'] },
        { key: 'keuangan.laporan', label: 'Laporan' },
        { key: 'keuangan.tagihan', label: 'Tagihan Santri', permissions: ['view', 'edit', 'delete'] },
        { key: 'keuangan.bukti-transfer', label: 'Bukti Transfer' },
        { key: 'keuangan.rekening-bank', label: 'Rekening Bank', permissions: ['view', 'edit', 'delete'] },
        { key: 'keuangan.tunggakan', label: 'Tunggakan Santri' },
        { key: 'keuangan.pengaturan', label: 'Pengaturan' }
      ]
    },
    dompet: {
      title: 'Dompet Digital',
      menus: [
        { key: 'dompet.dompet-santri', label: 'Dompet Santri' },
        { key: 'dompet.manajemen-keuangan', label: 'Manajemen Keuangan' },
        { key: 'dompet.history', label: 'History Transaksi' },
        { key: 'dompet.laporan', label: 'Laporan Keuangan' },
        { key: 'dompet.tagihan', label: 'Tagihan Kolektif' },
        { key: 'dompet.rfid', label: 'Kelola RFID' },
        { key: 'dompet.settings', label: 'Pengaturan Dompet', permissions: ['view', 'edit'] },
        { key: 'dompet.manage', label: 'Manage Transaksi' },
        { key: 'dompet.withdrawals', label: 'Penarikan (ePOS)' }
      ]
    },
    akademik: {
      title: 'Akademik',
      menus: [
        { key: 'akademik.tahun-ajaran', label: 'Tahun Ajaran', permissions: ['view', 'edit', 'delete'] }
      ]
    },
    system: {
      title: 'System',
      menus: [
        { key: 'pengguna', label: 'Pengguna', permissions: ['view', 'edit', 'delete'] },
        { key: 'pengguna.roles', label: 'Kelola Role' },
        { key: 'pengumuman', label: 'Pengumuman', permissions: ['view', 'edit', 'delete'] },
        { key: 'pengaturan', label: 'Pengaturan' }
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

  // Helper function untuk select all permissions untuk suatu menu
  const toggleAllMenuPermissions = (menuKey: string, permissions: string[]) => {
    const allChecked = permissions.every(perm => isPermissionChecked(menuKey, perm))
    
    if (allChecked) {
      // Uncheck all permissions for this menu
      const keysToRemove = permissions.map(perm => getPermissionKey(menuKey, perm))
      setRoleMenus(prev => prev.filter(k => !keysToRemove.includes(k)))
    } else {
      // Check all permissions for this menu
      const keysToAdd = permissions.map(perm => getPermissionKey(menuKey, perm))
      setRoleMenus(prev => [...new Set([...prev, ...keysToAdd])])
    }
  }

  async function loadRoles() {
    try {
      setRolesLoading(true)
      const res = await listRoles()
      if (res?.success) setRolesList(res.data || [])
    } catch (e) {
      console.error(e)
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
      console.error(e)
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
      console.error(e)
      toast.error(e?.response?.data?.message || 'Gagal menghapus role')
    }
  }

  const columns: any[] = [
    { key: 'name', header: 'Nama' },
    { key: 'role', header: 'Role' },
    { key: 'email', header: 'Email' },
  ]

  // add actions column for admins
  if (hasAccess('pengguna.edit') || hasAccess('pengguna.delete') || hasAccess('pengguna')) {
    columns.push({ key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
      <div className="flex gap-2">
        {(hasAccess('pengguna.edit') || hasAccess('pengguna')) && (
        <button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={() => { setEditing(r); setNewRole(r.role); setNewPassword(''); setShowEdit(true) }}>Edit</button>)}
        {(hasAccess('pengguna.delete') || hasAccess('pengguna')) && (
        <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={() => { setDeleting(r); setShowDelete(true) }}>Hapus</button>)}
      </div>
    ) })
  }


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pengguna</h2>
      <div className="flex items-center justify-between mb-3">
        <div />
        {(hasAccess('pengguna') || hasAccess('pengguna.roles') || currentUser?.role === 'admin') && (
          <div className="flex items-center gap-2">
            {(hasAccess('pengguna') || currentUser?.role === 'admin') && (
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
          <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="rounded border px-3 py-2">
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
                    header: 'Permissions', 
                    render: (_v:any, r:any) => {
                      if (!r.menus?.length) return <span className="text-gray-500">Tidak ada akses</span>
                      
                      const permissionGroups: {[key: string]: {base: boolean, permissions: string[]}} = {}
                      
                      r.menus.forEach((menu: string) => {
                        const parts = menu.split('.')
                        if (parts.length >= 3 && ['edit', 'delete', 'view'].includes(parts[parts.length - 1])) {
                          // This is a permission like 'kesantrian.santri.edit'
                          const baseKey = parts.slice(0, -1).join('.')
                          const permission = parts[parts.length - 1]
                          if (!permissionGroups[baseKey]) {
                            permissionGroups[baseKey] = { base: false, permissions: [] }
                          }
                          permissionGroups[baseKey].permissions.push(permission)
                        } else {
                          // This is a base menu access
                          if (!permissionGroups[menu]) {
                            permissionGroups[menu] = { base: true, permissions: [] }
                          } else {
                            permissionGroups[menu].base = true
                          }
                        }
                      })
                      
                      return (
                        <div className="space-y-1 max-w-sm">
                          {Object.entries(permissionGroups).slice(0, 3).map(([menu, access]) => (
                            <div key={menu} className="text-xs">
                              <span className="font-medium">{menu.split('.').pop()}</span>
                              {access.permissions.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {access.permissions.map(perm => (
                                    <span key={perm} className={`px-1 py-0.5 rounded text-white text-xs ${
                                      perm === 'edit' ? 'bg-yellow-400' :
                                      perm === 'delete' ? 'bg-red-400' : 'bg-blue-400'
                                    }`}>
                                      {perm === 'edit' ? 'E' : perm === 'delete' ? 'D' : 'V'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {Object.keys(permissionGroups).length > 3 && (
                            <span className="text-gray-500">+{Object.keys(permissionGroups).length - 3} lainnya</span>
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
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {Object.entries(menuCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="mb-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer p-2 bg-gray-50 rounded-md mb-2"
                      onClick={() => toggleCategory(categoryKey)}
                    >
                      <h4 className="font-medium text-gray-700">{category.title}</h4>
                      <span className="text-gray-500">
                        {collapsedCategories.includes(categoryKey) ? '▼' : '▲'}
                      </span>
                    </div>
                    
                    {!collapsedCategories.includes(categoryKey) && (
                      <div className="ml-4 space-y-3">
                        {category.menus.map(menu => (
                          <div key={menu.key} className="border-l-2 border-gray-200 pl-4 py-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <input 
                                    type="checkbox" 
                                    id={`${menu.key}-view`}
                                    checked={isPermissionChecked(menu.key)} 
                                    onChange={() => togglePermission(menu.key)}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor={`${menu.key}-view`} className="font-medium text-sm text-gray-800 cursor-pointer">
                                    {menu.label}
                                  </label>
                                  {menu.permissions && (
                                    <button
                                      type="button"
                                      onClick={() => toggleAllMenuPermissions(menu.key, menu.permissions!)}
                                      className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
                                    >
                                      {menu.permissions.every(perm => isPermissionChecked(menu.key, perm)) ? 'Uncheck All' : 'Check All'}
                                    </button>
                                  )}
                                </div>
                                
                                {menu.permissions && (
                                  <div className="ml-6 grid grid-cols-3 gap-2">
                                    {menu.permissions.map(permission => (
                                      <label key={`${menu.key}-${permission}`} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isPermissionChecked(menu.key, permission)}
                                          onChange={() => togglePermission(menu.key, permission)}
                                          className="w-3 h-3"
                                        />
                                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                                          permission === 'edit' ? 'bg-yellow-500' :
                                          permission === 'delete' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}>
                                          {permission === 'view' ? 'Lihat' :
                                           permission === 'edit' ? 'Edit' : 'Hapus'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
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
          <label className="block text-sm">Role</label>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded border px-3 py-2">
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