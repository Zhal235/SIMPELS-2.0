import { Upload, Trash2 } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
const getFotoSrc = (foto: string | Blob | undefined) => {
  if (!foto) return ''
  if (typeof foto === 'string') return `${BASE_URL}/storage/${foto}`
  return URL.createObjectURL(foto)
}

interface Props {
  formData: any
  setFormData: (d: any) => void
  jabatan: any[]
  departments: any[]
  isEditing: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onCompressImage: (file: File) => Promise<Blob>
}

const ic = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm border p-2"
const Label = ({ children }: any) => <label className="block text-sm font-medium text-gray-700">{children}</label>
const Field = ({ label, children }: any) => <div><Label>{label}</Label>{children}</div>

export default function PegawaiForm({ formData, setFormData, jabatan, departments, isEditing, isSubmitting, onClose, onSubmit, onCompressImage }: Props) {
  const set = (key: string, val: any) => setFormData({ ...formData, [key]: val })

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Identitas Diri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Lengkap *"><input type="text" required className={ic} value={formData.nama_pegawai||''} onChange={e=>set('nama_pegawai',e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Gelar Depan"><input type="text" className={ic} value={formData.gelar_depan||''} onChange={e=>set('gelar_depan',e.target.value)} /></Field>
            <Field label="Gelar Belakang"><input type="text" className={ic} value={formData.gelar_belakang||''} onChange={e=>set('gelar_belakang',e.target.value)} /></Field>
          </div>
          <Field label="NIK (KTP)"><input type="text" maxLength={16} className={ic} value={formData.nik||''} onChange={e=>set('nik',e.target.value)} /></Field>
          <Field label="Jenis Kelamin"><select className={ic} value={formData.jenis_kelamin||'L'} onChange={e=>set('jenis_kelamin',e.target.value)}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></Field>
          <Field label="Tempat Lahir"><input type="text" className={ic} value={formData.tempat_lahir||''} onChange={e=>set('tempat_lahir',e.target.value)} /></Field>
          <Field label="Tanggal Lahir"><input type="date" className={ic} value={formData.tanggal_lahir||''} onChange={e=>set('tanggal_lahir',e.target.value)} /></Field>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Data Kepegawaian</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="NIP / NIPY"><input type="text" className={ic} value={formData.nip||''} onChange={e=>set('nip',e.target.value)} /></Field>
          <Field label="NUPTK (Optional)"><input type="text" className={ic} value={formData.nuptk||''} onChange={e=>set('nuptk',e.target.value)} /></Field>
          <Field label="Jenis Pegawai"><select className={ic} value={formData.jenis_pegawai||'Pendidik'} onChange={e=>set('jenis_pegawai',e.target.value)}><option value="Pendidik">Pendidik</option><option value="Tenaga Kependidikan">Tenaga Kependidikan</option></select></Field>
          <Field label="Status Kepegawaian"><select className={ic} value={formData.status_kepegawaian||'Tetap'} onChange={e=>set('status_kepegawaian',e.target.value)}><option value="Tetap">Tetap</option><option value="Kontrak">Kontrak</option><option value="Honorer">Honorer</option><option value="Magang">Magang</option></select></Field>
          <div className="md:col-span-2">
            <Label>Jabatan Struktural</Label>
            {(formData.selectedJabatan||[]).length > 0 && (
              <div className="mb-4 mt-3 space-y-2">
                {(formData.selectedJabatan||[]).map((jid: number, idx: number) => {
                  const jab = jabatan.find(j => j.id === jid)
                  if (!jab) return null
                  return (
                    <div key={jid} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${idx===0?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-800'}`}>{idx===0?'Utama':'Tambahan'}</span>
                        <div><div className="font-medium text-gray-900">{jab.nama}</div><div className="text-sm text-gray-500">{jab.department?.nama||'Pimpinan'} • Level {jab.level}</div></div>
                      </div>
                      <button type="button" onClick={() => set('selectedJabatan',(formData.selectedJabatan||[]).filter((id:number)=>id!==jid))} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )
                })}
              </div>
            )}
            <select className={`flex-1 mt-1 ${ic}`} value="" onChange={e => { if(!e.target.value) return; const jid=parseInt(e.target.value); const curr=formData.selectedJabatan||[]; if(!curr.includes(jid)) set('selectedJabatan',[...curr,jid]); e.target.value='' }}>
              <option value="">+ Tambah Jabatan</option>
              {departments.map((dept:any) => (
                <optgroup key={dept.id} label={dept.nama}>{jabatan.filter(j=>j.department_id===dept.id&&!(formData.selectedJabatan||[]).includes(j.id)).sort((a:any,b:any)=>a.level-b.level).map((jab:any)=><option key={jab.id} value={jab.id}>{jab.nama} (Level {jab.level})</option>)}</optgroup>
              ))}
              {jabatan.filter(j=>!j.department_id&&!(formData.selectedJabatan||[]).includes(j.id)).length > 0 && (
                <optgroup label="Pimpinan">{jabatan.filter(j=>!j.department_id&&!(formData.selectedJabatan||[]).includes(j.id)).sort((a:any,b:any)=>a.level-b.level).map((jab:any)=><option key={jab.id} value={jab.id}>{jab.nama} (Level {jab.level})</option>)}</optgroup>
              )}
            </select>
            {!(formData.selectedJabatan||[]).length && <p className="text-sm text-gray-500 mt-2">Belum ada jabatan yang dipilih</p>}
          </div>
          <Field label="Tanggal Mulai Tugas"><input type="date" className={ic} value={formData.tanggal_mulai_tugas||''} onChange={e=>set('tanggal_mulai_tugas',e.target.value)} /></Field>
          <Field label="Pendidikan Terakhir"><select className={ic} value={formData.pendidikan_terakhir||''} onChange={e=>set('pendidikan_terakhir',e.target.value)}><option value="">- Pilih -</option>{['SD','SMP','SMA','D3','S1','S2','S3'].map(v=><option key={v} value={v}>{v==='SMA'?'SMA/SMK':v}</option>)}</select></Field>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Kontak & Lainnya</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="No. HP / WA"><input type="text" className={ic} value={formData.no_hp||''} onChange={e=>set('no_hp',e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={ic} value={formData.email||''} onChange={e=>set('email',e.target.value)} /></Field>
          <div className="md:col-span-2"><Label>Alamat Lengkap</Label><textarea rows={3} className={ic} value={formData.alamat||''} onChange={e=>set('alamat',e.target.value)} /></div>
          <Field label="Status Pernikahan"><select className={ic} value={formData.status_pernikahan||''} onChange={e=>set('status_pernikahan',e.target.value)}><option value="">- Pilih -</option><option value="Belum Menikah">Belum Menikah</option><option value="Menikah">Menikah</option><option value="Janda/Duda">Janda/Duda</option></select></Field>
          <Field label="Nama Ibu Kandung"><input type="text" className={ic} value={formData.nama_ibu_kandung||''} onChange={e=>set('nama_ibu_kandung',e.target.value)} /></Field>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Foto Pegawai</h3>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-1/2">
            <Label>Upload Foto</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer" onClick={() => document.getElementById('foto-upload')?.click()}>
              <input id="foto-upload" type="file" className="hidden" accept="image/*" onChange={async e => { const f=e.target.files?.[0]; if(f){ try { const compressed=await onCompressImage(f); set('foto_profil',compressed) } catch { } } }} />
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Klik untuk upload foto</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB</p>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <Label>Preview Foto</Label>
            <div className="w-32 h-40 bg-gray-100 border rounded-lg overflow-hidden flex items-center justify-center shadow-sm mt-2">
              {formData.foto_profil ? <img src={getFotoSrc(formData.foto_profil)} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-xs">No Photo</span></div>}
            </div>
            {formData.foto_profil && <button type="button" onClick={() => set('foto_profil',undefined)} className="mt-2 text-xs text-red-600 hover:text-red-800">Hapus Foto</button>}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 sticky bottom-0 bg-white pb-6 pt-4 border-t mt-6">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50">Batal</button>
        <button type="submit" disabled={isSubmitting} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 flex items-center gap-2">
          {isSubmitting ? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menyimpan...</>) : (isEditing ? 'Simpan Perubahan' : 'Tambah Pegawai')}
        </button>
      </div>
    </form>
  )
}
