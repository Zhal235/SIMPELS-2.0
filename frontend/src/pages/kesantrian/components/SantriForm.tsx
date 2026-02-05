import { useEffect, useMemo, useState } from 'react'
import SantriTabs from './SantriTabs'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { createSantri, updateSantri } from '../../../api/santri'

export type OrangTua = {
  no_kk?: string
  nama_ayah: string
  nik_ayah?: string
  pendidikan_ayah?: string
  pekerjaan_ayah?: string
  hp_ayah?: string
  nama_ibu: string
  nik_ibu?: string
  pendidikan_ibu?: string
  pekerjaan_ibu?: string
  hp_ibu?: string
}

export type Santri = {
  id?: string
  nis: string
  nisn?: string
  nik_santri?: string
  nama_santri: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: 'L' | 'P'
  kelas?: string
  asrama?: string
  asal_sekolah?: string
  hobi?: string
  cita_cita?: string
  jumlah_saudara?: number
  alamat: string
  provinsi?: string
  kabupaten?: string
  kecamatan?: string
  desa?: string
  kode_pos?: string
  foto?: string | Blob
  orang_tua: OrangTua
}

type Props = {
  mode: 'create' | 'edit' | 'preview'
  initial?: Santri
  onSubmit: (data: Santri) => void
  onCancel: () => void
}

export default function SantriForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<string>('Data Santri')
  console.log(activeTab)
  const [data, setData] = useState<Santri>(() =>
    initial ?? {
      nis: '',
      nisn: '',
      nik_santri: '',
      nama_santri: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: 'L',
      kelas: undefined,
      asrama: undefined,
      asal_sekolah: '',
      hobi: '',
      cita_cita: '',
      jumlah_saudara: undefined,
      alamat: '',
      provinsi: '',
      kabupaten: '',
      kecamatan: '',
      desa: '',
      kode_pos: '',
      foto: undefined,
      orang_tua: {
        no_kk: '',
        nama_ayah: '',
        nik_ayah: '',
        pendidikan_ayah: '',
        pekerjaan_ayah: '',
        hp_ayah: '',
        nama_ibu: '',
        nik_ibu: '',
        pendidikan_ibu: '',
        pekerjaan_ibu: '',
        hp_ibu: '',
      },
    }
  )

  useEffect(() => {
    if (initial) {
      setData((d) => {
        const i: any = initial
        return {
          ...d,
          ...initial,
          orang_tua: {
            no_kk: i?.no_kk ?? d.orang_tua?.no_kk ?? '',
            nama_ayah: i?.nama_ayah ?? d.orang_tua?.nama_ayah ?? '',
            nik_ayah: i?.nik_ayah ?? d.orang_tua?.nik_ayah ?? '',
            pendidikan_ayah: i?.pendidikan_ayah ?? d.orang_tua?.pendidikan_ayah ?? '',
            pekerjaan_ayah: i?.pekerjaan_ayah ?? d.orang_tua?.pekerjaan_ayah ?? '',
            hp_ayah: i?.hp_ayah ?? d.orang_tua?.hp_ayah ?? '',
            nama_ibu: i?.nama_ibu ?? d.orang_tua?.nama_ibu ?? '',
            nik_ibu: i?.nik_ibu ?? d.orang_tua?.nik_ibu ?? '',
            pendidikan_ibu: i?.pendidikan_ibu ?? d.orang_tua?.pendidikan_ibu ?? '',
            pekerjaan_ibu: i?.pekerjaan_ibu ?? d.orang_tua?.pekerjaan_ibu ?? '',
            hp_ibu: i?.hp_ibu ?? d.orang_tua?.hp_ibu ?? '',
          },
        }
      })
    }
  }, [initial])

  // noop effect to observe tab changes if needed
  useEffect(() => {}, [activeTab])

  const readOnly = mode === 'preview'

  const [errors, setErrors] = useState<Record<string, string>>({})
  const requiredErrors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!data.nis?.trim()) e['nis'] = 'Wajib diisi'
    if (!data.nama_santri?.trim()) e['nama_santri'] = 'Wajib diisi'
    if (!data.tempat_lahir?.trim()) e['tempat_lahir'] = 'Wajib diisi'
    if (!data.tanggal_lahir?.trim()) e['tanggal_lahir'] = 'Wajib diisi'
    if (!data.alamat?.trim()) e['alamat'] = 'Wajib diisi'
    if (!data.orang_tua?.nama_ayah?.trim()) e['orang_tua.nama_ayah'] = 'Wajib diisi'
    if (!data.orang_tua?.nama_ibu?.trim()) e['orang_tua.nama_ibu'] = 'Wajib diisi'
  return e
  }, [data])

  // Allow user to click Simpan and surface validation via toast; disable only in preview mode
  const canSubmit = mode !== 'preview'
  const [saving, setSaving] = useState(false)

  const handleChange = (field: keyof Santri, value: any) => setData((d) => ({ ...d, [field]: value }))
  const handleOrtuChange = (field: keyof OrangTua, value: any) => setData((d) => ({ ...d, orang_tua: { ...d.orang_tua, [field]: value } }))

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    handleChange('foto', compressed)
  }

  // If preview mode, render a compact profile card instead of readonly form
  if (mode === 'preview') {
    return <SantriPreview data={data} onCancel={onCancel} />
  }

  function focusField(fieldName: string) {
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${fieldName}"]`)
    el?.focus()
  }

  function scrollToTop() {
    document.querySelector('.santri-form-scroll')?.scrollTo(0, 0)
  }

  async function handleSubmit() {
    if (saving) return
    const missing = requiredErrors
    if (Object.keys(missing).length > 0) {
      setErrors((prev) => ({ ...prev, ...missing }))
      const firstKey = Object.keys(missing)[0]
      const isOrtu = firstKey.startsWith('orang_tua.')
      setActiveTab(isOrtu ? 'Data Orang Tua' : 'Data Santri')
      scrollToTop()
      focusField(firstKey)
      toast.error('Beberapa data wajib belum diisi')
      return
    }
    try {
      setSaving(true)
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          if (key === 'orang_tua') {
            // Flatten orang_tua fields to match backend expected keys
            const ortu = val as any
            const mapping: Record<string, string> = {
              no_kk: 'no_kk',
              nama_ayah: 'nama_ayah',
              nik_ayah: 'nik_ayah',
              pendidikan_ayah: 'pendidikan_ayah',
              pekerjaan_ayah: 'pekerjaan_ayah',
              hp_ayah: 'hp_ayah',
              nama_ibu: 'nama_ibu',
              nik_ibu: 'nik_ibu',
              pendidikan_ibu: 'pendidikan_ibu',
              pekerjaan_ibu: 'pekerjaan_ibu',
              hp_ibu: 'hp_ibu',
            }
            Object.entries(mapping).forEach(([src, dst]) => {
              const v = ortu?.[src]
              if (v !== undefined && v !== null) formData.append(dst, String(v))
            })
          } else if (key === 'foto') {
            if (val instanceof Blob) {
              formData.append('foto', val)
            } else if (typeof val === 'string') {
              if (val.startsWith('data:')) {
                // convert dataURL to Blob
                const blob = dataUrlToBlob(val)
                formData.append('foto', blob)
              } else {
                // Jika string path/URL (contoh: "/storage/..."), JANGAN kirim saat edit
                // Backend memvalidasi 'foto' sebagai file image; mengirim string akan memicu 422
                // Biarkan kosong agar backend mempertahankan foto lama
              }
            }
          } else {
            formData.append(key, String(val))
          }
        }
      })
      if (mode === 'preview') return
      const confirmSave = window.confirm('Apakah Anda yakin ingin menyimpan data ini?')
      if (!confirmSave) return
      const promise = mode === 'create'
        ? createSantri(formData)
        : initial?.id
          ? updateSantri(initial.id!, formData)
          : createSantri(formData)

      await toast.promise(
        promise,
        {
          loading: '⏳ Menyimpan data santri...',
          success: '✅ Data santri berhasil disimpan!',
          error: (err) => {
            const status = (err as any)?.response?.status
            if (status === 422) return '❌ Validasi gagal. Periksa isian form.'
            const msg = String((err as any)?.message || '')
            if (msg.includes('Network')) return '🌐 Tidak dapat terhubung ke server backend.'
            return '⚠️ Terjadi kesalahan tak terduga.'
          },
        }
      )

      onCancel()
      // notify parent to refetch table
      onSubmit(data)
    } catch (err: any) {
      console.error('❌ Gagal menyimpan santri:', err)
      const status = err?.response?.status
      if (status === 422) {
        const apiErrors = err?.response?.data?.errors || {}
        const flatErrors: Record<string, string> = {}
        // Map backend field names to UI field names for orang_tua
        const ortuFields = new Set([
          'no_kk', 'nama_ayah', 'nik_ayah', 'pendidikan_ayah', 'pekerjaan_ayah', 'hp_ayah',
          'nama_ibu', 'nik_ibu', 'pendidikan_ibu', 'pekerjaan_ibu', 'hp_ibu',
        ])
        Object.entries(apiErrors).forEach(([field, messages]: any) => {
          if (Array.isArray(messages) && messages.length) {
            const msg = messages[0]
            const uiField = ortuFields.has(field) ? `orang_tua.${field}` : field
            flatErrors[uiField] = msg
          }
        })
        setErrors((prev) => ({ ...prev, ...flatErrors }))
        const firstKey = Object.keys(flatErrors)[0]
        if (firstKey) {
          const isOrtu = firstKey.startsWith('orang_tua.')
          setActiveTab(isOrtu ? 'Data Orang Tua' : 'Data Santri')
          scrollToTop()
          focusField(firstKey)
        }
      } else if (String(err?.message || '').toLowerCase().includes('network')) {
        toast.error('🌐 Tidak dapat terhubung ke server backend.')
      } else {
        const serverMsg = String(err?.response?.data?.message || err?.message || 'Terjadi kesalahan tak terduga.')
        toast.error(`Gagal menyimpan data: ${serverMsg}`)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SantriTabs tabs={["Data Santri", "Data Orang Tua"]} active={activeTab} onChange={(tab) => setActiveTab(tab)} />
      <div className="santri-form-scroll">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'Data Santri' ? (
              <DataSantriFormSection
                data={data}
                handleChange={handleChange}
                handleOrtuChange={handleOrtuChange}
                readOnly={readOnly}
                errors={errors}
                handleFile={handleFile}
              />
            ) : (
              <DataOrangTuaFormSection
                data={data}
                handleChange={handleChange}
                handleOrtuChange={handleOrtuChange}
                readOnly={readOnly}
                errors={errors}
                handleFile={handleFile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Batal</button>
        <button
          type="button"
          disabled={!canSubmit || saving}
          className={`btn btn-primary ${(!canSubmit || saving) ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={handleSubmit}
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

function DataSantriFormSection({ data, handleChange, readOnly, errors, handleFile }: {
  data: Santri
  handleChange: (field: keyof Santri, value: any) => void
  handleOrtuChange: (field: keyof OrangTua, value: any) => void
  readOnly: boolean
  errors: Record<string, string>
  handleFile: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>
}) {
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput name="nis" label="NIS" required value={data.nis} onChange={(v) => handleChange('nis', v)} readOnly={readOnly} error={errors.nis} />
          <TextInput label="NISN" value={data.nisn ?? ''} onChange={(v) => handleChange('nisn', v)} readOnly={readOnly} />
          <TextInput label="NIK Santri" value={data.nik_santri ?? ''} onChange={(v) => handleChange('nik_santri', v)} readOnly={readOnly} />
          <TextInput name="nama_santri" label="Nama Santri" required value={data.nama_santri} onChange={(v) => handleChange('nama_santri', v)} readOnly={readOnly} error={errors.nama_santri} />
          <TextInput name="tempat_lahir" label="Tempat Lahir" required value={data.tempat_lahir} onChange={(v) => handleChange('tempat_lahir', v)} readOnly={readOnly} error={errors.tempat_lahir} />
          <TextInput name="tanggal_lahir" type="date" label="Tanggal Lahir" required value={data.tanggal_lahir} onChange={(v) => handleChange('tanggal_lahir', v)} readOnly={readOnly} error={errors.tanggal_lahir} />
          <Select name="jenis_kelamin" label="Jenis Kelamin" value={data.jenis_kelamin} onChange={(v) => handleChange('jenis_kelamin', v as 'L' | 'P')} readOnly={readOnly} options={[{ label: 'L', value: 'L' }, { label: 'P', value: 'P' }]} />
          <ReadOnly label="Kelas" value={data.kelas ?? '– belum ditentukan –'} />
          <ReadOnly label="Asrama" value={data.asrama ?? '– belum ditentukan –'} />
          <TextInput label="Asal Sekolah" value={data.asal_sekolah ?? ''} onChange={(v) => handleChange('asal_sekolah', v)} readOnly={readOnly} />
          <TextInput label="Hobi" value={data.hobi ?? ''} onChange={(v) => handleChange('hobi', v)} readOnly={readOnly} />
          <TextInput label="Cita-cita" value={data.cita_cita ?? ''} onChange={(v) => handleChange('cita_cita', v)} readOnly={readOnly} />
          <NumberInput label="Jumlah Saudara" value={data.jumlah_saudara ?? 0} onChange={(v) => handleChange('jumlah_saudara', v)} readOnly={readOnly} />
          <TextArea name="alamat" label="Alamat" required value={data.alamat} onChange={(v) => handleChange('alamat', v)} readOnly={readOnly} error={errors.alamat} />
          <TextInput label="Provinsi" value={data.provinsi ?? ''} onChange={(v) => handleChange('provinsi', v)} readOnly={readOnly} />
          <TextInput label="Kabupaten" value={data.kabupaten ?? ''} onChange={(v) => handleChange('kabupaten', v)} readOnly={readOnly} />
          <TextInput label="Kecamatan" value={data.kecamatan ?? ''} onChange={(v) => handleChange('kecamatan', v)} readOnly={readOnly} />
          <TextInput label="Desa" value={data.desa ?? ''} onChange={(v) => handleChange('desa', v)} readOnly={readOnly} />
          <TextInput label="Kode Pos" value={data.kode_pos ?? ''} onChange={(v) => handleChange('kode_pos', v)} readOnly={readOnly} />
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Foto</label>
            <input type="file" accept="image/*" className="mt-1 w-full rounded-md border px-3 py-2" onChange={handleFile} disabled={readOnly} />
            {data.foto && (
              <img
                className="mt-2 h-24 w-24 rounded-md object-cover border"
                src={getFotoSrc(data.foto) || ''}
                alt="Foto Santri"
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function DataOrangTuaFormSection({ data, handleOrtuChange, readOnly, errors }: {
  data: Santri
  handleChange: (field: keyof Santri, value: any) => void
  handleOrtuChange: (field: keyof OrangTua, value: any) => void
  readOnly: boolean
  errors: Record<string, string>
  handleFile: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <TextInput label="No KK" value={data.orang_tua?.no_kk ?? ''} onChange={(v) => handleOrtuChange('no_kk', v)} readOnly={readOnly} />
      <TextInput name="orang_tua.nama_ayah" label="Nama Ayah" required value={data.orang_tua?.nama_ayah ?? ''} onChange={(v) => handleOrtuChange('nama_ayah', v)} readOnly={readOnly} error={errors['orang_tua.nama_ayah']} />
      <TextInput label="NIK Ayah" value={data.orang_tua?.nik_ayah ?? ''} onChange={(v) => handleOrtuChange('nik_ayah', v)} readOnly={readOnly} />
      <TextInput label="Pendidikan Ayah" value={data.orang_tua?.pendidikan_ayah ?? ''} onChange={(v) => handleOrtuChange('pendidikan_ayah', v)} readOnly={readOnly} />
      <TextInput label="Pekerjaan Ayah" value={data.orang_tua?.pekerjaan_ayah ?? ''} onChange={(v) => handleOrtuChange('pekerjaan_ayah', v)} readOnly={readOnly} />
      <TextInput label="HP Ayah" value={data.orang_tua?.hp_ayah ?? ''} onChange={(v) => handleOrtuChange('hp_ayah', v)} readOnly={readOnly} />
      <TextInput name="orang_tua.nama_ibu" label="Nama Ibu" required value={data.orang_tua?.nama_ibu ?? ''} onChange={(v) => handleOrtuChange('nama_ibu', v)} readOnly={readOnly} error={errors['orang_tua.nama_ibu']} />
      <TextInput label="NIK Ibu" value={data.orang_tua?.nik_ibu ?? ''} onChange={(v) => handleOrtuChange('nik_ibu', v)} readOnly={readOnly} />
      <TextInput label="Pendidikan Ibu" value={data.orang_tua?.pendidikan_ibu ?? ''} onChange={(v) => handleOrtuChange('pendidikan_ibu', v)} readOnly={readOnly} />
      <TextInput label="Pekerjaan Ibu" value={data.orang_tua?.pekerjaan_ibu ?? ''} onChange={(v) => handleOrtuChange('pekerjaan_ibu', v)} readOnly={readOnly} />
      <TextInput label="HP Ibu" value={data.orang_tua?.hp_ibu ?? ''} onChange={(v) => handleOrtuChange('hp_ibu', v)} readOnly={readOnly} />
    </div>
  )
}

function TextInput({ name, label, value, onChange, required, readOnly, type = 'text', error }: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  readOnly?: boolean
  type?: string
  error?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        className={`mt-1 w-full rounded-md border px-3 py-2 ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function NumberInput({ label, value, onChange, readOnly }: {
  label: string
  value: number
  onChange: (v: number) => void
  readOnly?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        className={`mt-1 w-full rounded-md border px-3 py-2 ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        readOnly={readOnly}
      />
    </div>
  )
}

function TextArea({ name, label, value, onChange, required, readOnly, error }: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  readOnly?: boolean
  error?: string
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        className={`mt-1 w-full rounded-md border px-3 py-2 ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Select({ name, label, value, onChange, options, readOnly }: {
  name?: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  readOnly?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        className={`mt-1 w-full rounded-md border px-3 py-2 ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-100 text-gray-600">{value}</div>
    </div>
  )
}

async function compressImage(file: File): Promise<Blob> {
  // compress if > 1MB and clamp width to 1024px using canvas
  const MAX_SIZE = 1024 * 1024
  const img = await fileToImage(file)

  const scale = img.width > 1024 ? 1024 / img.width : 1
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, targetW, targetH)

  let quality = 0.9
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  // If original larger than 1MB, compress further
  if (file.size > MAX_SIZE) {
    quality = 0.7
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  // convert to Blob to send as multipart/form-data
  const blob = await (await fetch(dataUrl)).blob()
  return blob
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*);base64/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mime })
}

// Resolve foto to a displayable src. Accepts:
// - Blob (from file input) -> object URL
// - absolute http(s) URL -> as-is
// - data URL -> as-is
// - Laravel storage relative paths (e.g., "/storage/..." or "storage/...") -> prefix with backend origin
function getFotoSrc(foto: string | Blob): string | null {
  try {
    if (foto instanceof Blob) return URL.createObjectURL(foto)
    const s = String(foto || '')
    if (!s) return null
    if (/^data:/i.test(s)) return s
    const origin = getBackendOrigin()
    if (/^https?:\/\//i.test(s)) {
      // Jika URL absolut mengarah ke localhost:8000, ubah ke origin backend saat ini (mis. 8001)
      try {
        const u = new URL(s)
        const o = new URL(origin)
        const isLocalHost = ['localhost', '127.0.0.1'].includes(u.hostname)
        if (isLocalHost && u.port && o.port && u.port !== o.port) {
          u.protocol = o.protocol
          u.hostname = o.hostname
          u.port = o.port
          return u.toString()
        }
      } catch {}
      return s
    }
    if (s.startsWith('/')) return origin + s
    if (s.startsWith('storage') || s.startsWith('uploads')) return `${origin}/${s}`
    return s
  } catch {
    return null
  }
}

function getBackendOrigin(): string {
  const fallback = `http://${window.location.hostname}:8001`
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    if (base) {
      // If base is a relative path (/api), use current origin
      if (base.startsWith('/')) {
        return window.location.origin
      }
      const u = new URL(base)
      return u.origin
    }
  } catch {}
  // Attempt heuristic based on current origin (e.g. Vite dev server on 5173)
  try {
    const loc = window.location.origin
    if (loc.includes(':5173')) return loc.replace(':5173', ':8001')
  } catch {}
  return fallback
}

// ---------- Preview Component ----------
type SantriPreviewProps = {
  data: Santri
  onCancel: () => void
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  const v = value === undefined || value === null || String(value).trim() === '' ? '–' : String(value)
  return (
    <div>
      <dt className="text-sm text-gray-500 font-medium">{label}</dt>
      <dd className="text-gray-800 font-semibold">{v}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h3 className="text-base font-semibold mb-3 text-gray-700">{title}</h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </dl>
    </div>
  )
}

function formatTTL(tempat?: string, tanggal?: string) {
  const tgl = tanggal && tanggal.trim() ? tanggal : ''
  const tmp = tempat && tempat.trim() ? tempat : ''
  if (!tmp && !tgl) return '–'
  return `${tmp}${tmp && tgl ? ', ' : ''}${tgl}`
}

function SantriPreview({ data, onCancel }: SantriPreviewProps) {
  const fotoSrc = getFotoSrc(data.foto ?? '') || (typeof data.foto === 'string' ? data.foto : '/default-photo.png')
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Preview Data Santri</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kiri: Biodata */}
        <div className="space-y-4">
          <Section title="Data Santri">
            <Field label="NIS" value={data.nis} />
            <Field label="Nama" value={data.nama_santri} />
            <Field label="TTL" value={formatTTL(data.tempat_lahir, data.tanggal_lahir)} />
            <Field label="Jenis Kelamin" value={data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <Field label="Alamat" value={data.alamat} />
            <Field label="Asal Sekolah" value={data.asal_sekolah} />
            <Field label="Hobi" value={data.hobi} />
            <Field label="Cita-cita" value={data.cita_cita} />
            <Field label="Jumlah Saudara" value={data.jumlah_saudara} />
            <Field label="Kelas" value={data.kelas} />
            <Field label="Asrama" value={data.asrama} />
          </Section>

          <Section title="Data Orang Tua">
            <div>
              <h4 className="text-sm font-semibold text-gray-600">Data Ayah</h4>
              <div className="mt-2 space-y-2">
                <Field label="Nama Ayah" value={data.orang_tua?.nama_ayah} />
                <Field label="Pekerjaan Ayah" value={data.orang_tua?.pekerjaan_ayah} />
                <Field label="HP Ayah" value={data.orang_tua?.hp_ayah} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-600">Data Ibu</h4>
              <div className="mt-2 space-y-2">
                <Field label="Nama Ibu" value={data.orang_tua?.nama_ibu} />
                <Field label="Pekerjaan Ibu" value={data.orang_tua?.pekerjaan_ibu} />
                <Field label="HP Ibu" value={data.orang_tua?.hp_ibu} />
              </div>
            </div>
          </Section>
        </div>

        {/* Kanan: Foto */}
        <div className="flex justify-center items-start">
          <img
            src={fotoSrc}
            alt="Foto Santri"
            className="w-40 h-48 rounded-lg border object-cover shadow-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onCancel} className="btn">Tutup</button>
      </div>
    </div>
  )
}