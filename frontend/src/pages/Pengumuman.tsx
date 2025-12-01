import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getKelasOptions,
  getSantriOptions,
  type Announcement,
  type CreateAnnouncementPayload,
} from '../api/announcements'

export default function Pengumuman() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [kelasOptions, setKelasOptions] = useState<any[]>([])
  const [santriOptions, setSantriOptions] = useState<any[]>([])

  const [formData, setFormData] = useState<CreateAnnouncementPayload>({
    title: '',
    content: '',
    priority: 'normal',
    target_type: 'all',
    target_ids: [],
    push_notification: false,
  })

  useEffect(() => {
    fetchAnnouncements()
    fetchKelasOptions()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await getAnnouncements()
      if (response.success) {
        setAnnouncements(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat pengumuman')
    } finally {
      setLoading(false)
    }
  }

  const fetchKelasOptions = async () => {
    try {
      const response = await getKelasOptions()
      if (response.success) {
        setKelasOptions(response.data)
      }
    } catch (error) {
      console.error('Gagal memuat kelas options:', error)
    }
  }

  const fetchSantriOptions = async (kelasId?: number) => {
    try {
      const response = await getSantriOptions({ kelas_id: kelasId })
      if (response.success) {
        setSantriOptions(response.data)
      }
    } catch (error) {
      console.error('Gagal memuat santri options:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        await updateAnnouncement(editingId, formData)
        toast.success('Pengumuman berhasil diupdate')
      } else {
        await createAnnouncement(formData)
        toast.success('Pengumuman berhasil dibuat')
      }
      setShowModal(false)
      resetForm()
      fetchAnnouncements()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengumuman')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return

    try {
      await deleteAnnouncement(id)
      toast.success('Pengumuman berhasil dihapus')
      fetchAnnouncements()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus pengumuman')
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_type: announcement.target_type,
      target_ids: announcement.target_ids || [],
      push_notification: announcement.push_notification,
    })
    setShowModal(true)

    if (announcement.target_type === 'santri') {
      fetchSantriOptions()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      target_type: 'all',
      target_ids: [],
      push_notification: false,
    })
    setEditingId(null)
  }

  const handleTargetTypeChange = (targetType: 'all' | 'class' | 'santri') => {
    setFormData({ ...formData, target_type: targetType, target_ids: [] })
    if (targetType === 'santri') {
      fetchSantriOptions()
    }
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      urgent: 'bg-red-100 text-red-800',
      important: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
    }
    return badges[priority as keyof typeof badges] || badges.normal
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Mendesak',
      important: 'Penting',
      normal: 'Normal',
    }
    return labels[priority as keyof typeof labels] || 'Normal'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pengumuman untuk wali santri</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Buat Pengumuman
        </button>
      </div>

      {/* List Pengumuman */}
      <div className="bg-white rounded-lg shadow">
        {loading && announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada pengumuman</div>
        ) : (
          <div className="divide-y">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(announcement.priority)}`}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                      {announcement.push_notification && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          🔔 Push
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Target: {announcement.target_type === 'all' ? 'Semua' : announcement.target_type === 'class' ? 'Per Kelas' : 'Per Santri'}</span>
                      <span>Dibuat: {new Date(announcement.created_at).toLocaleDateString('id-ID')}</span>
                      {announcement.created_by && <span>Oleh: {announcement.created_by}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Judul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Pengumuman *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Konten */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Pengumuman *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritas *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Penting</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>

                {/* Target Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kirim Ke *
                  </label>
                  <select
                    value={formData.target_type}
                    onChange={(e) => handleTargetTypeChange(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Semua Wali Santri</option>
                    <option value="class">Kelas Tertentu</option>
                    <option value="santri">Santri Tertentu</option>
                  </select>
                </div>

                {/* Kelas Selection */}
                {formData.target_type === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Kelas *
                    </label>
                    <select
                      multiple
                      value={formData.target_ids?.map(String) || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setFormData({ ...formData, target_ids: selected })
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      size={5}
                    >
                      {kelasOptions.map((kelas) => (
                        <option key={kelas.id} value={kelas.id}>
                          {kelas.nama_kelas} - Tingkat {kelas.tingkat}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Tekan Ctrl/Cmd untuk pilih multiple</p>
                  </div>
                )}

                {/* Santri Selection */}
                {formData.target_type === 'santri' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Santri *
                    </label>
                    <select
                      multiple
                      value={formData.target_ids?.map(String) || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setFormData({ ...formData, target_ids: selected })
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      size={8}
                    >
                      {santriOptions.map((santri) => (
                        <option key={santri.id} value={santri.id}>
                          {santri.nis} - {santri.nama_santri}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Tekan Ctrl/Cmd untuk pilih multiple</p>
                  </div>
                )}

                {/* Push Notification */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="push_notification"
                    checked={formData.push_notification}
                    onChange={(e) => setFormData({ ...formData, push_notification: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="push_notification" className="text-sm text-gray-700">
                    Kirim sebagai Push Notification (akan muncul bahkan saat browser ditutup)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
