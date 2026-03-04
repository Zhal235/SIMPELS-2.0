import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import { createKategoriPengeluaran, deleteKategoriPengeluaran, updateKategoriPengeluaran } from '../../../api/kategoriPengeluaran'
import toast from 'react-hot-toast'

interface Kategori {
  id: number
  name: string
}

interface Props {
  categories: Kategori[]
  onClose: () => void
  onChange: (categories: Kategori[]) => void
}

export default function ModalKelolaKategori({ categories, onClose, onChange }: Props) {
  const [list, setList] = useState<Kategori[]>(categories)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const created = await createKategoriPengeluaran({ name: newName.trim() })
      if (created) {
        const updated = [...list, created]
        setList(updated)
        onChange(updated)
        setNewName('')
        toast.success('Kategori ditambahkan')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menambah kategori')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini? Transaksi yang sudah ada tidak akan terpengaruh.')) return
    try {
      await deleteKategoriPengeluaran(id)
      const updated = list.filter(c => c.id !== id)
      setList(updated)
      onChange(updated)
      toast.success('Kategori dihapus')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menghapus kategori')
    }
  }

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return
    try {
      await updateKategoriPengeluaran(id, { name: editName.trim() })
      const updated = list.map(c => c.id === id ? { ...c, name: editName.trim() } : c)
      setList(updated)
      onChange(updated)
      setEditId(null)
      toast.success('Kategori diperbarui')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memperbarui kategori')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Kelola Kategori Pengeluaran</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Nama kategori baru..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {list.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Belum ada kategori</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map(cat => (
                <li key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  {editId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                        autoFocus
                        className="flex-1 px-3 py-1.5 border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button onClick={() => handleSaveEdit(cat.id)} className="text-green-600 hover:text-green-800 p-1">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                      <button
                        onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
