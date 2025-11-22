import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'
import { useAuthStore } from '../stores/useAuthStore'
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

  const availableMenus = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'kesantrian.santri', label: 'Kesantrian • Data Santri' },
    { key: 'keuangan.pembayaran', label: 'Keuangan • Pembayaran Santri' },
    { key: 'dompet.dompet-santri', label: 'Dompet • Dompet Santri' },
    { key: 'dompet.manage', label: 'Dompet • Manage (Edit/Delete transaksi)' },
    { key: 'dompet.rfid', label: 'Dompet • RFID' },
    { key: 'dompet.history', label: 'Dompet • History' },
    { key: 'dompet.withdrawals', label: 'Dompet • Penarikan (ePOS)' },
    { key: 'pengguna', label: 'Pengguna' },
    { key: 'pengaturan', label: 'Pengaturan' },
  ]

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
    setShowRoleModal(true)
  }

  function openEditRole(role:any) {
    setEditingRoleObj(role)
    setRoleName(role.name)
    setRoleMenus(role.menus ?? [])
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
  if (currentUser?.role === 'admin') {
    columns.push({ key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={() => { setEditing(r); setNewRole(r.role); setNewPassword(''); setShowEdit(true) }}>Edit</button>
        <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={() => { setDeleting(r); setShowDelete(true) }}>Hapus</button>
      </div>
    ) })
  }


  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pengguna</h2>
      <div className="flex items-center justify-between mb-3">
        <div />
        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => setShowCreateUser(true)}>Tambah User</button>
            <button className="btn btn-primary" onClick={openCreateRole}>Tambah Role</button>
          </div>
        )}
      </div>

      <Card>
        <Table columns={columns as any} data={rows} loading={loading} />
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
      {currentUser?.role === 'admin' && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold mt-6">Kelola Role</h2>
            <div>
              <button className="btn btn-primary" onClick={openCreateRole}>Tambah Role</button>
            </div>
          </div>
          <Card>
            <Table columns={[{ key: 'name', header: 'Nama' }, { key: 'menus', header: 'Menus', render: (_v:any, r:any) => (r.menus?.length ? r.menus.join(', ') : '-') }, { key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (<div className="flex gap-2"><button className="btn btn-sm" onClick={() => openEditRole(r)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => removeRole(r)}>Hapus</button></div>) }]} data={rolesList} loading={rolesLoading} />
          </Card>

          <Modal open={showRoleModal} title={editingRoleObj ? `Edit Role: ${editingRoleObj.name}` : 'Tambah Role'} onClose={() => setShowRoleModal(false)} footer={(
            <>
              <button className="btn" onClick={() => setShowRoleModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={saveRole}>Simpan</button>
            </>
          )}>
            <div className="grid gap-3">
              <label className="block text-sm">Nama Role</label>
              <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="rounded border px-3 py-2" />

              <label className="block text-sm">Izin Menu</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableMenus.map(m => (
                  <label className="flex items-center gap-2" key={m.key}>
                    <input type="checkbox" checked={roleMenus.includes(m.key)} onChange={(e) => setRoleMenus(prev => e.target.checked ? [...prev, m.key] : prev.filter(k => k !== m.key))} />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
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
            <option value="user">user</option>
            <option value="admin">admin</option>
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