import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save, School, UserCheck, Wallet } from 'lucide-react'
import { getGraduationPreview, getPromotionPreview, processGraduationWithDate, processPromotion } from '../../api/pindahTahunAjaran'
import { listTahunAjaran, updateTahunAjaran } from '../../api/tahunAjaran'
import { ActivationStep, CompletionSummary, FinanceStep, GraduationStep, PromotionStep, StepIndicator } from './components/TransitionWizardContent'
import type { GraduationPreview, PromotionMappingItem, TahunAjaranOption, TransitionSummary } from './types/transitionWizard'

const today = new Date().toISOString().split('T')[0]

export default function PindahTahunAjaran() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [gradPreview, setGradPreview] = useState<GraduationPreview | null>(null)
  const [promoMapping, setPromoMapping] = useState<PromotionMappingItem[]>([])
  const [tahuns, setTahuns] = useState<TahunAjaranOption[]>([])
  const [newYearId, setNewYearId] = useState('')
  const [tanggalKelulusan, setTanggalKelulusan] = useState(today)
  const [showSuccessSummary, setShowSuccessSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<TransitionSummary>({ graduated: 0, promoted: 0, createdClasses: 0 })

  useEffect(() => {
    const loadStepData = async () => {
      setLoading(true)
      try {
        if (step === 1) {
          const response = await getGraduationPreview()
          setGradPreview(response)
          return
        }
        if (step === 2) {
          const response = await getPromotionPreview()
          setPromoMapping(response.mapping || [])
          return
        }
        if (step === 4) {
          const response = await listTahunAjaran()
          setTahuns(response.data || response || [])
        }
      } catch (err: any) {
        toast.error(`Gagal memuat data: ${err.response?.data?.message || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadStepData()
  }, [step])

  const handleGraduate = async () => {
    const count = gradPreview?.jumlah_santri || 0
    if (count === 0) {
      setStep(2)
      return
    }
    if (!window.confirm(`Yakin meluluskan ${count} santri dengan tanggal kelulusan ${tanggalKelulusan}?`)) return

    setLoading(true)
    try {
      const response = await processGraduationWithDate({ tanggal_kelulusan: tanggalKelulusan })
      setSummaryData((current) => ({ ...current, graduated: response.jumlah_lulus || 0 }))
      toast.success('Kelulusan berhasil diproses')
      setStep(2)
    } catch (err: any) {
      toast.error(`Gagal: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoChange = (index: number, field: 'target_id' | 'target_nama', value: string) => {
    setPromoMapping((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      if (field === 'target_id') {
        const targetId = value ? Number(value) : null
        const selected = item.target_options.find((option) => option.id === targetId)
        return { ...item, target_id: targetId, target_nama: selected?.nama_kelas || item.target_nama, target_exists: Boolean(selected) }
      }
      return { ...item, target_id: null, target_nama: value, target_exists: false }
    }))
  }

  const handlePromote = async () => {
    if (promoMapping.length === 0) {
      setStep(3)
      return
    }
    if (!window.confirm('Proses kenaikan tingkat untuk semua santri aktif sesuai tingkat berikutnya?')) return

    setLoading(true)
    try {
      const response = await processPromotion(promoMapping)
      setSummaryData((current) => ({ ...current, promoted: response.moved_count || 0, createdClasses: response.created_classes || 0 }))
      toast.success('Kenaikan tingkat berhasil diproses')
      setStep(3)
    } catch (err: any) {
      toast.error(`Gagal: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateYear = async () => {
    if (!newYearId) {
      toast.error('Pilih tahun ajaran baru')
      return
    }

    setLoading(true)
    try {
      const target = tahuns.find((item) => item.id === Number(newYearId))
      if (!target) {
        toast.error('Tahun ajaran tidak ditemukan')
        return
      }
      await updateTahunAjaran(target.id, { ...target, status: 'aktif' })
      setShowSuccessSummary(true)
    } catch (err: any) {
      toast.error(`Gagal mengaktifkan: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (showSuccessSummary) {
    return (
      <CompletionSummary
        tahunNama={tahuns.find((item) => item.id === Number(newYearId))?.nama_tahun_ajaran || '-'}
        summaryData={summaryData}
        onDone={() => { window.location.href = '/akademik/tahun-ajaran' }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wizard Pindah Tahun Ajaran</h1>
        <p className="text-gray-600">Pergantian tahun ajaran berbasis tingkat: 7 ke 8, 8 ke 9, 9 ke 10, 10 ke 11, 11 ke 12, dan 12 ke alumni.</p>
      </div>
      <div className="mb-6 flex flex-wrap justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <StepIndicator current={step} step={1} title="Kelulusan" icon={UserCheck} />
        <StepIndicator current={step} step={2} title="Kenaikan Tingkat" icon={School} />
        <StepIndicator current={step} step={3} title="Keuangan" icon={Wallet} />
        <StepIndicator current={step} step={4} title="Aktivasi" icon={Save} />
      </div>
      <div className="min-h-[400px] rounded-lg bg-white p-6 shadow">
        {loading && <div className="py-10 text-center">Memuat data...</div>}
        {!loading && step === 1 && <GraduationStep gradPreview={gradPreview} tanggalKelulusan={tanggalKelulusan} onTanggalKelulusanChange={setTanggalKelulusan} onSubmit={handleGraduate} loading={loading} />}
        {!loading && step === 2 && <PromotionStep promoMapping={promoMapping} onPromoChange={handlePromoChange} onBack={() => setStep(1)} onSubmit={handlePromote} />}
        {!loading && step === 3 && <FinanceStep onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {!loading && step === 4 && <ActivationStep tahuns={tahuns} newYearId={newYearId} onChange={setNewYearId} onBack={() => setStep(3)} onSubmit={handleActivateYear} />}
      </div>
    </div>
  )
}
