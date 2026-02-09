import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, ArrowRight, UserCheck, School, Wallet, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getGraduationPreview, processGraduation, getPromotionPreview, processPromotion } from '../../api/pindahTahunAjaran'
import { listTahunAjaran, updateTahunAjaran } from '../../api/tahunAjaran'

// Components
const StepIndicator = ({ current, step, title, icon: Icon }: any) => {
  const isActive = current === step
  const isDone = current > step
  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600 font-bold' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
        ${isActive ? 'border-blue-600 bg-blue-50' : isDone ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
        {isDone ? <CheckCircle size={16} /> : <span className="text-sm">{step}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <span className="hidden md:inline">{title}</span>
      </div>
      {step < 4 && <div className="w-8 h-[2px] bg-gray-300 mx-2" />}
    </div>
  )
}

export default function PindahTahunAjaran() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Data State
  const [gradPreview, setGradPreview] = useState<any>(null)
  const [promoPreview, setPromoPreview] = useState<any[]>([])
  const [promoMapping, setPromoMapping] = useState<any[]>([])
  const [tahuns, setTahuns] = useState<any[]>([])
  const [newYearId, setNewYearId] = useState<string>('')

  useEffect(() => {
    loadStepData()
  }, [step])

  const loadStepData = async () => {
    setLoading(true)
    try {
      if (step === 1) {
        const res = await getGraduationPreview()
        setGradPreview(res)
      } else if (step === 2) {
        const res = await getPromotionPreview()
        setPromoPreview(res.mapping || [])
        setPromoMapping(res.mapping || [])
      } else if (step === 4) {
        const res = await listTahunAjaran()
        setTahuns(res.data || res || [])
      }
    } catch (err: any) {
      toast.error('Gagal memuat data: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleGraduate = async () => {
    // Check if undefined, treat as 0
    const count = gradPreview?.jumlah_santri || 0
    if (count === 0) {
      setStep(2)
      return
    }
    if (!confirm(`Yakin meluluskan ${count} santri? Status mereka akan menjadi Alumni.`)) return
    
    setLoading(true)
    try {
      const res = await processGraduation()
      setSummaryData((prev: any) => ({ ...prev, graduated: res.jumlah_lulus || 0 }))
      toast.success('Kelulusan berhasil diproses')
      setStep(2)
    } catch (err: any) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // STEP 2 HOOKS
  const handlePromoChange = (index: number, field: string, value: any) => {
    const newMap = [...promoMapping]
    newMap[index] = { ...newMap[index], [field]: value }
    setPromoMapping(newMap)
  }

  const handlePromote = async () => {
    if (promoMapping.length === 0) {
      setStep(3)
      return
    }
    if (!confirm('Proses kenaikan kelas untuk semua kelas? Kelas baru akan dibuat otomatis jika belum ada.')) return

    setLoading(true)
    try {
      const res = await processPromotion(promoMapping)
      setSummaryData((prev: any) => ({ 
        ...prev, 
        promoted: res.moved_count || 0,
        createdClasses: res.created_classes || 0
      }))
      toast.success('Kenaikan kelas berhasil diproses')
      setStep(3)
    } catch (err: any) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // STEP 4 HOOKS + Summary Logic
  const [summaryData, setSummaryData] = useState<any>({
    graduated: 0,
    promoted: 0,
    createdClasses: 0
  })

  // STEP 4: Activation
  const handleActivateYear = async () => {
    if (!newYearId) {
      toast.error('Pilih tahun ajaran baru')
      return
    }
    setLoading(true)
    try {
      const target = tahuns.find(t => t.id === Number(newYearId))
      if (target) {
        await updateTahunAjaran(target.id, { ...target, status: 'aktif' })
        // Show success modal content
        setShowSuccessSummary(true)
      }
    } catch (err: any) {
      toast.error('Gagal mengaktifkan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const [showSuccessSummary, setShowSuccessSummary] = useState(false)

  if (showSuccessSummary) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg text-center space-y-6 mt-10">
        <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Pergantian Tahun Ajaran Selesai!</h2>
        <div className="bg-gray-50 p-6 rounded-lg text-left space-y-3">
             <div className="flex justify-between border-b pb-2">
                 <span>Tahun Ajaran Baru</span>
                 <span className="font-bold">{tahuns.find(t => t.id === Number(newYearId))?.nama_tahun_ajaran}</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span>Siswa Lulus (Alumni)</span>
                 <span className="font-bold">{summaryData.graduated} Siswa</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span>Siswa Naik Kelas</span>
                 <span className="font-bold">{summaryData.promoted} Siswa</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span>Kelas Baru Dibuat</span>
                 <span className="font-bold">{summaryData.createdClasses} Kelas</span>
             </div>
        </div>
        <p className="text-gray-600">
            Sistem Keuangan telah di-reset untuk tahun ajaran baru. Silakan atur Jenis Tagihan baru di menu Keuangan.
        </p>
        <button 
           onClick={() => window.location.href = '/akademik/tahun-ajaran'}
           className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 w-full"
        >
            Kembali ke Menu Akademik
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wizard Pindah Tahun Ajaran</h1>
        <p className="text-gray-600">Panduan bertahap untuk pergantian tahun ajaran, kelulusan, dan kenaikan kelas.</p>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 justify-between border">
        <StepIndicator current={step} step={1} title="Kelulusan" icon={UserCheck} />
        <StepIndicator current={step} step={2} title="Kenaikan Kelas" icon={School} />
        <StepIndicator current={step} step={3} title="Keuangan" icon={Wallet} />
        <StepIndicator current={step} step={4} title="Aktivasi & Selesai" icon={Save} />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow min-h-[400px] p-6">
        {loading && <div className="text-center py-10">Memuat data...</div>}
        
        {!loading && step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="text-blue-600" />
              Langkah 1: Proses Kelulusan (Tingkat Akhir)
            </h2>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800">
              Sistem mendeteksi siswa tingkat akhir (Kelas 12) yang harus diluluskan menjadi Alumni.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4 text-center bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Tingkat Akhir</div>
                <div className="text-3xl font-bold">12</div>
              </div>
              <div className="border rounded-lg p-4 text-center bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Jumlah Kelas</div>
                <div className="text-3xl font-bold">{gradPreview?.daftar_kelas?.length || 0}</div>
              </div>
              <div className="border rounded-lg p-4 text-center bg-indigo-50 border-indigo-200">
                <div className="text-sm text-indigo-600 mb-1">Siswa Akan Lulus</div>
                <div className="text-4xl font-bold text-indigo-700">{gradPreview?.jumlah_santri || 0}</div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <button 
                onClick={handleGraduate}
                disabled={loading} 
                className={`px-6 py-2 rounded-lg flex items-center gap-2 shadow text-white
                  ${(gradPreview?.jumlah_santri || 0) > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}
                `}
              >
                {(gradPreview?.jumlah_santri || 0) > 0 ? 'Proses Kelulusan' : 'Lanjut (Tidak ada siswa)' }
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {!loading && step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <School className="text-blue-600" />
              Langkah 2: Proses Kenaikan Kelas
            </h2>
            <p className="text-gray-600">Review pemetaan kelas. Sistem otomatis menyarankan kelas tujuan (Contoh: 7A &rarr; 8A).</p>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Kelas Asal</th>
                    <th className="px-4 py-3">Jml Santri</th>
                    <th className="px-4 py-3 text-center">&rarr;</th>
                    <th className="px-4 py-3">Kelas Tujuan (Saran)</th>
                    <th className="px-4 py-3">Status Kelas Tujuan</th>
                  </tr>
                </thead>
                <tbody>
                  {promoMapping.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">Tidak ada kelas untuk dinaikkan.</td></tr>
                  )}
                  {promoMapping.map((item, idx) => (
                    <tr key={item.source_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.source_nama} (Tingkat {item.source_tingkat})</td>
                      <td className="px-4 py-3">{item.jumlah_santri}</td>
                      <td className="px-4 py-3 text-center text-gray-400">&rarr;</td>
                      <td className="px-4 py-3">
                        <input 
                          type="text" 
                          className="border rounded px-2 py-1 w-full max-w-[150px]"
                          value={item.target_nama}
                          onChange={(e) => handlePromoChange(idx, 'target_nama', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.target_exists ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Ada</span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={14}/> Akan Dibuat</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
               <button onClick={() => setStep(1)} className="px-4 py-2 border rounded hover:bg-gray-50">Kembali</button>
               <button 
                onClick={handlePromote}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                Proses Kenaikan Kelas
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {!loading && step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="text-blue-600" />
              Langkah 3: Informasi Keuangan
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Penting!</h3>
              <p className="text-yellow-800 mb-4">
                Saat Tahun Ajaran baru diaktifkan, <strong>Daftar Jenis Tagihan akan dikosongkan (Reset)</strong> untuk tahun ajaran baru.
              </p>
              <ul className="list-disc list-inside text-yellow-800 space-y-2">
                <li>Tagihan santri yang sudah ter-generate di tahun lalu <strong>TIDAK AKAN HILANG</strong>.</li>
                <li>Laporan Keuangan tetap dapat diakses dengan memfilter Tahun Ajaran lama.</li>
                <li>Anda perlu membuat Jenis Tagihan baru (SPP, Makan, dll) setelah Tahun Ajaran baru aktif, karena nominal biasanya berubah.</li>
              </ul>
            </div>
            
            <p className="text-gray-600">
              Silakan lanjutkan ke langkah berikutnya untuk mengaktifkan Tahun Ajaran Baru.
            </p>

            <div className="flex justify-end gap-3 pt-6 border-t">
               <button onClick={() => setStep(2)} className="px-4 py-2 border rounded hover:bg-gray-50">Kembali</button>
               <button 
                onClick={() => setStep(4)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                Saya Mengerti, Lanjut
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {!loading && step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Save className="text-blue-600" />
              Langkah 4: Finalisasi & Aktivasi
            </h2>
            <p className="text-gray-600">Pilih Tahun Ajaran yang akan diaktifkan. Tahun Ajaran saat ini akan otomatis dinonaktifkan.</p>

            <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun Ajaran Baru</label>
              <select 
                className="w-full border rounded-lg px-3 py-2"
                value={newYearId}
                onChange={(e) => setNewYearId(e.target.value)}
              >
                <option value="">-- Pilih --</option>
                {tahuns.filter(t => t.status !== 'aktif').map((t) => (
                   <option key={t.id} value={t.id}>{t.nama_tahun_ajaran} (Saat ini Non-Aktif)</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Hanya menampilkan tahun ajaran yang belum aktif. Jika belum ada, silakan buat dulu di menu Akademik.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
               <button onClick={() => setStep(3)} className="px-4 py-2 border rounded hover:bg-gray-50">Kembali</button>
               <button 
                onClick={handleActivateYear}
                disabled={!newYearId}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow disbaled:opacity-50"
              >
                Aktifkan & Selesai
                <CheckCircle size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
