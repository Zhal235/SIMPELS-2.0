import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'
import { useAuthStore } from '../stores/useAuthStore'
import { listUsers, updateUser, deleteUser } from '../api/users'
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
      <Card>
        <Table columns={columns as any} data={rows} loading={loading} />
      </Card>

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