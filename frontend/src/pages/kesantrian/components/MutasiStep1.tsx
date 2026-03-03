export default function Step1DataPribadi({ formData, setFormData }: any) {
  const inp = (field: string, value: any) => setFormData({ ...formData, [field]: value })
  const inpOT = (field: string, value: any) => setFormData({ ...formData, orang_tua: { ...formData.orang_tua, [field]: value } })
  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"

  const fields: Array<{ label: string; field: string; required?: boolean; type?: string; span?: boolean; placeholder?: string }> = [
    { label: 'Nama Lengkap', field: 'nama_santri', required: true, span: true },
    { label: 'Tempat Lahir', field: 'tempat_lahir', required: true },
    { label: 'Tanggal Lahir', field: 'tanggal_lahir', required: true, type: 'date' },
    { label: 'NISN', field: 'nisn' },
    { label: 'NIK Santri', field: 'nik_santri' },
    { label: 'Hobi', field: 'hobi' },
    { label: 'Cita-cita', field: 'cita_cita' },
    { label: 'Desa/Kelurahan', field: 'desa' },
    { label: 'Kecamatan', field: 'kecamatan' },
    { label: 'Kabupaten/Kota', field: 'kabupaten' },
    { label: 'Provinsi', field: 'provinsi' },
    { label: 'Kode Pos', field: 'kode_pos' },
  ]

  const otFields: Array<{ label: string; field: string; required?: boolean }> = [
    { label: 'No. KK', field: 'no_kk' },
    { label: 'Nama Ayah', field: 'nama_ayah', required: true },
    { label: 'NIK Ayah', field: 'nik_ayah' },
    { label: 'Pendidikan Ayah', field: 'pendidikan_ayah' },
    { label: 'Pekerjaan Ayah', field: 'pekerjaan_ayah' },
    { label: 'HP Ayah', field: 'hp_ayah' },
    { label: 'Nama Ibu', field: 'nama_ibu', required: true },
    { label: 'NIK Ibu', field: 'nik_ibu' },
    { label: 'Pendidikan Ibu', field: 'pendidikan_ibu' },
    { label: 'Pekerjaan Ibu', field: 'pekerjaan_ibu' },
    { label: 'HP Ibu', field: 'hp_ibu' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi Santri</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* NIS dengan tombol Auto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIS <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input type="text" value={formData.nis} onChange={e => inp('nis', e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Masukkan NIS unik" required />
            <button type="button" onClick={() => inp('nis', 'NIS' + Date.now().toString().slice(-8))} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">Auto</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">NIS harus unik</p>
        </div>

        {fields.map(({ label, field, required, type, span, placeholder }) => (
          <div key={field} className={span ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <input type={type || 'text'} value={(formData as any)[field] || ''} onChange={e => inp(field, e.target.value)} className={inputClass} placeholder={placeholder} required={required} />
          </div>
        ))}

        {/* Jenis Kelamin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
          <select value={formData.jenis_kelamin} onChange={e => inp('jenis_kelamin', e.target.value)} className={inputClass}>
            <option value="L">Laki-laki</option><option value="P">Perempuan</option>
          </select>
        </div>

        {/* Jumlah Saudara */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Saudara</label>
          <input type="number" value={formData.jumlah_saudara || ''} onChange={e => inp('jumlah_saudara', e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
        </div>

        {/* Asal Sekolah */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah/Pesantren <span className="text-red-500">*</span></label>
          <input type="text" value={formData.asal_sekolah} onChange={e => inp('asal_sekolah', e.target.value)} placeholder="Contoh: SMP Negeri 1 Jakarta" className={inputClass} required />
        </div>

        {/* Alamat */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <textarea value={formData.alamat} onChange={e => inp('alamat', e.target.value)} rows={3} className={inputClass} />
        </div>
      </div>

      {/* Data Orang Tua */}
      <div className="pt-4 border-t">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Data Orang Tua/Wali</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otFields.map(({ label, field, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
              <input type="text" value={(formData.orang_tua as any)[field] || ''} onChange={e => inpOT(field, e.target.value)} className={inputClass} required={required} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
