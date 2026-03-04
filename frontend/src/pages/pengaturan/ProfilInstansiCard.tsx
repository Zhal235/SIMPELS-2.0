import { useState, useRef } from 'react'
import { Building2, Upload, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateInstansiSetting, uploadKopSurat, deleteKopSurat } from '../../api/instansi'
import type { InstansiSetting } from '../../api/instansi'

type Props = {
  setting: InstansiSetting
  onSaved: () => void
}

export default function ProfilInstansiCard({ setting, onSaved }: Props) {
  const [form, setForm] = useState({
    nama_yayasan: setting.nama_yayasan ?? '',
    nama_pesantren: setting.nama_pesantren ?? '',
    alamat: setting.alamat ?? '',
    telp: setting.telp ?? '',
    email: setting.email ?? '',
    website: setting.website ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [kopPreview, setKopPreview] = useState<string | null>(setting.kop_surat_url)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateInstansiSetting(form)
      toast.success('Profil instansi berhasil disimpan')
      onSaved()
    } catch {
      toast.error('Gagal menyimpan profil instansi')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadKopSurat(file)
      setKopPreview(res.data.kop_surat_url)
      toast.success('Kop surat berhasil diupload')
      onSaved()
    } catch {
      toast.error('Gagal mengupload kop surat')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm('Hapus kop surat?')) return
    setDeleting(true)
    try {
      await deleteKopSurat()
      setKopPreview(null)
      toast.success('Kop surat dihapus')
      onSaved()
    } catch {
      toast.error('Gagal menghapus kop surat')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Profil Instansi</h3>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Yayasan *</label>
            <input name="nama_yayasan" value={form.nama_yayasan} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Yayasan Pondok Pesantren ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pesantren *</label>
            <input name="nama_pesantren" value={form.nama_pesantren} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Pondok Pesantren ..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Jl. ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input name="telp" value={form.telp} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="(021) 000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="info@pesantren.id" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input name="website" value={form.website} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="www.pesantren.id" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>

      <div className="border-t mt-6 pt-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Kop Surat</p>
        <p className="text-xs text-gray-500 mb-4">
          Upload gambar kop surat (JPG/PNG, maks 2MB). Akan tampil otomatis di setiap kwitansi yang dicetak.
        </p>

        {kopPreview ? (
          <div className="mb-4">
            <div className="border rounded-lg overflow-hidden mb-3" style={{ maxHeight: '140px' }}>
              <img src={kopPreview} alt="Kop Surat" className="w-full object-contain object-top" style={{ maxHeight: '140px' }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengupload...' : 'Ganti Kop Surat'}
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">{uploading ? 'Mengupload...' : 'Klik untuk upload kop surat'}</span>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  )
}
