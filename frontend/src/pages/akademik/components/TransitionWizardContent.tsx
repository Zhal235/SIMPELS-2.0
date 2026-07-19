import { AlertCircle, ArrowRight, CheckCircle, Save, School, UserCheck, Wallet } from 'lucide-react'
import type { GraduationPreview, PromotionMappingItem, TahunAjaranOption, TransitionSummary } from '../types/transitionWizard'

export function StepIndicator({ current, step, title, icon: Icon }: { current: number; step: number; title: string; icon: typeof UserCheck }) {
  const isActive = current === step
  const isDone = current > step

  return (
    <div className={`flex items-center gap-2 ${isActive ? 'font-bold text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isActive ? 'border-blue-600 bg-blue-50' : isDone ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
        {isDone ? <CheckCircle size={16} /> : <span className="text-sm">{step}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="hidden md:inline">{title}</span>
      </div>
      {step < 4 && <div className="mx-2 h-[2px] w-8 bg-gray-300" />}
    </div>
  )
}

export function GraduationStep({
  gradPreview,
  tanggalKelulusan,
  onTanggalKelulusanChange,
  onSubmit,
  onSkip,
  loading,
}: {
  gradPreview: GraduationPreview | null
  tanggalKelulusan: string
  onTanggalKelulusanChange: (value: string) => void
  onSubmit: () => void
  onSkip: () => void
  loading: boolean
}) {
  const count = gradPreview?.jumlah_santri || 0
  const year = tanggalKelulusan ? new Date(tanggalKelulusan).getFullYear() : ''

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><UserCheck className="text-blue-600" />Langkah 1: Proses Kelulusan</h2>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">Langkah ini opsional. Santri tingkat 12 hanya akan jadi alumni jika Anda klik Proses Kelulusan.</div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-gray-50 p-4 text-center"><div className="mb-1 text-sm text-gray-500">Tingkat Akhir</div><div className="text-3xl font-bold">12</div></div>
        <div className="rounded-lg border bg-gray-50 p-4 text-center"><div className="mb-1 text-sm text-gray-500">Jumlah Kelas</div><div className="text-3xl font-bold">{gradPreview?.daftar_kelas?.length || 0}</div></div>
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-center"><div className="mb-1 text-sm text-indigo-600">Siswa Akan Lulus</div><div className="text-4xl font-bold text-indigo-700">{count}</div></div>
      </div>
      <div className="grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tanggal Kelulusan</label>
          <input type="date" value={tanggalKelulusan} onChange={(e) => onTanggalKelulusanChange(e.target.value)} className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tahun Lulus</label>
          <input type="text" value={year || '-'} readOnly className="w-full rounded-lg border bg-gray-100 px-3 py-2 text-gray-600" />
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t pt-6">
        <button onClick={onSkip} disabled={loading} className="rounded border px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Lewati Dulu</button>
        <button onClick={onSubmit} disabled={loading || !tanggalKelulusan} className={`flex items-center gap-2 rounded-lg px-6 py-2 text-white shadow ${count > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} disabled:cursor-not-allowed disabled:opacity-60`}>
          {count > 0 ? 'Proses Kelulusan' : 'Lanjut'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function PromotionStep({
  promoMapping,
  onPromoChange,
  onBack,
  onSubmit,
}: {
  promoMapping: PromotionMappingItem[]
  onPromoChange: (index: number, field: 'target_id' | 'target_nama', value: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><School className="text-blue-600" />Langkah 2: Proses Kenaikan Tingkat</h2>
      <p className="text-gray-600">Acuan utama adalah tingkat: 7 ke 8, 8 ke 9, 9 ke 10, 10 ke 11, dan 11 ke 12. Pilih kelas tujuan pada tingkat berikutnya bila tersedia.</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Kelas Asal</th>
              <th className="px-4 py-3">Jumlah Santri</th>
              <th className="px-4 py-3">Tingkat Tujuan</th>
              <th className="px-4 py-3">Kelas Tujuan</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {promoMapping.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Tidak ada kelas aktif yang perlu dinaikkan.</td></tr>}
            {promoMapping.map((item, idx) => (
              <tr key={item.source_id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.source_nama} <span className="text-xs text-gray-500">(Tingkat {item.source_tingkat})</span></td>
                <td className="px-4 py-3">{item.jumlah_santri}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">{item.target_tingkat}</td>
                <td className="px-4 py-3">
                  {item.target_options.length > 0 ? (
                    <select value={item.target_id ?? ''} onChange={(e) => onPromoChange(idx, 'target_id', e.target.value)} className="w-full max-w-[220px] rounded border px-2 py-1">
                      <option value="">Pilih kelas tujuan</option>
                      {item.target_options.map((option) => <option key={option.id} value={option.id}>{option.nama_kelas}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={item.target_nama} onChange={(e) => onPromoChange(idx, 'target_nama', e.target.value)} className="w-full max-w-[220px] rounded border px-2 py-1" />
                  )}
                </td>
                <td className="px-4 py-3">{item.target_exists ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} />Sudah ada</span> : <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={14} />Akan dibuat</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-3 border-t pt-6">
        <button onClick={onBack} className="rounded border px-4 py-2 hover:bg-gray-50">Kembali</button>
        <button onClick={onSubmit} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700">Proses Kenaikan Tingkat<ArrowRight size={18} /></button>
      </div>
    </div>
  )
}

export function FinanceStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Wallet className="text-blue-600" />Langkah 3: Informasi Keuangan</h2>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="mb-2 text-lg font-bold text-yellow-800">Penting</h3>
        <p className="mb-4 text-yellow-800">Saat tahun ajaran baru diaktifkan, daftar jenis tagihan akan di-reset untuk tahun ajaran baru.</p>
        <ul className="list-inside list-disc space-y-2 text-yellow-800">
          <li>Tagihan yang sudah ter-generate di tahun lalu tidak hilang.</li>
          <li>Laporan keuangan lama tetap bisa diakses dengan filter tahun ajaran sebelumnya.</li>
          <li>Jenis tagihan baru perlu dibuat ulang setelah tahun ajaran baru aktif.</li>
        </ul>
      </div>
      <div className="flex justify-end gap-3 border-t pt-6">
        <button onClick={onBack} className="rounded border px-4 py-2 hover:bg-gray-50">Kembali</button>
        <button onClick={onNext} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700">Saya Mengerti, Lanjut<ArrowRight size={18} /></button>
      </div>
    </div>
  )
}

export function ActivationStep({
  tahuns,
  newYearId,
  onChange,
  onBack,
  onSubmit,
}: {
  tahuns: TahunAjaranOption[]
  newYearId: string
  onChange: (value: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Save className="text-blue-600" />Langkah 4: Finalisasi & Aktivasi</h2>
      <p className="text-gray-600">Pilih tahun ajaran yang akan diaktifkan. Tahun ajaran aktif saat ini akan otomatis dinonaktifkan.</p>
      <div className="mx-auto max-w-md rounded-lg border bg-gray-50 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Pilih Tahun Ajaran Baru</label>
        <select className="w-full rounded-lg border px-3 py-2" value={newYearId} onChange={(e) => onChange(e.target.value)}>
          <option value="">-- Pilih --</option>
          {tahuns.filter((t) => t.status !== 'aktif').map((t) => <option key={t.id} value={t.id}>{t.nama_tahun_ajaran} (Saat ini Non-Aktif)</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-3 border-t pt-6">
        <button onClick={onBack} className="rounded border px-4 py-2 hover:bg-gray-50">Kembali</button>
        <button onClick={onSubmit} disabled={!newYearId} className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white shadow hover:bg-green-700 disabled:opacity-50"><CheckCircle size={18} />Aktifkan & Selesai</button>
      </div>
    </div>
  )
}

export function CompletionSummary({
  tahunNama,
  summaryData,
  onDone,
}: {
  tahunNama: string
  summaryData: TransitionSummary
  onDone: () => void
}) {
  return (
    <div className="mx-auto mt-10 max-w-2xl space-y-6 rounded-lg bg-white p-6 text-center shadow-lg">
      <div className="flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-10 w-10 text-green-600" /></div></div>
      <h2 className="text-2xl font-bold text-gray-900">Pergantian Tahun Ajaran Selesai</h2>
      <div className="space-y-3 rounded-lg bg-gray-50 p-6 text-left">
        <div className="flex justify-between border-b pb-2"><span>Tahun Ajaran Baru</span><span className="font-bold">{tahunNama}</span></div>
        <div className="flex justify-between border-b pb-2"><span>Siswa Lulus</span><span className="font-bold">{summaryData.graduated} Siswa</span></div>
        <div className="flex justify-between border-b pb-2"><span>Siswa Naik Tingkat</span><span className="font-bold">{summaryData.promoted} Siswa</span></div>
        <div className="flex justify-between border-b pb-2"><span>Kelas Baru Dibuat</span><span className="font-bold">{summaryData.createdClasses} Kelas</span></div>
      </div>
      <button onClick={onDone} className="w-full rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">Kembali ke Menu Akademik</button>
    </div>
  )
}
