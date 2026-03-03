import { useState, useEffect } from 'react'
import { Plus, ArrowRight, ArrowLeft, Check, User, MapPin, DollarSign, FileCheck, Trash2 } from 'lucide-react'
import { createSantri, listSantri, deleteSantri } from '../../api/santri'
import { listKelas } from '../../api/kelas'
import { listAsrama } from '../../api/asrama'
import { listJenisTagihan } from '../../api/jenisTagihan'
import { createTunggakan } from '../../api/tagihanSantri'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'
import Step1DataPribadi from './components/MutasiStep1'
import { Step2Penempatan, Step3Tagihan, Step4Review } from './components/MutasiSteps'

interface SelectedTagihan { jenis_tagihan_id: number; nama_tagihan: string; nominal: number; jatuh_tempo: string; is_custom_nominal?: boolean; kelas_id?: number; tipe_nominal?: string }

const INIT_STEP1 = { nis: '', nisn: '', nik_santri: '', nama_santri: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'L' as const, asal_sekolah: '', hobi: '', cita_cita: '', jumlah_saudara: undefined as number|undefined, alamat: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '', kode_pos: '', foto: undefined as any, status: 'aktif' as const, orang_tua: { no_kk: '', nama_ayah: '', nik_ayah: '', pendidikan_ayah: '', pekerjaan_ayah: '', hp_ayah: '', nama_ibu: '', nik_ibu: '', pendidikan_ibu: '', pekerjaan_ibu: '', hp_ibu: '' } }

const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const getBulanNamaFromDate = (s: string) => { if (!s) return ''; const d = new Date(s); return BULAN_NAMA[d.getMonth()] || '' }

export default function MutasiMasuk() {
  const [showWizard, setShowWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [santriList, setSantriList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [formStep1, setFormStep1] = useState(INIT_STEP1)
  const [formStep2, setFormStep2] = useState({ kelas_id: '', asrama_id: '' })
  const [selectedTagihan, setSelectedTagihan] = useState<SelectedTagihan[]>([])
  const [showKelasModal, setShowKelasModal] = useState(false)
  const [pendingTagihan, setPendingTagihan] = useState<any>(null)
  const [kelasList, setKelasList] = useState<any[]>([])
  const [asramaList, setAsramaList] = useState<any[]>([])
  const [jenisTagihanList, setJenisTagihanList] = useState<any[]>([])

  useEffect(() => { loadMasterData(); fetchSantri() }, [])

  const fetchSantri = async () => {
    try {
      setLoadingList(true)
      const res: any = await listSantri(1, 100)
      const all = res?.data?.data || res?.data || (Array.isArray(res) ? res : [])
      const filtered = (Array.isArray(all) ? all : []).filter((s: any) => s.jenis_penerimaan === 'mutasi_masuk')
      filtered.sort((a: any, b: any) => new Date(b.created_at||0).getTime() - new Date(a.created_at||0).getTime())
      setSantriList(filtered)
    } catch { toast.error('Gagal memuat data santri') }
    finally { setLoadingList(false) }
  }

  const loadMasterData = async () => {
    try {
      const [k, a, t] = await Promise.all([listKelas(), listAsrama(), listJenisTagihan()])
      const parse = (r: any) => Array.isArray(r) ? r : (r?.data ? (Array.isArray(r.data) ? r.data : r.data.data || []) : [])
      setKelasList(parse(k)); setAsramaList(parse(a)); setJenisTagihanList(parse(t))
    } catch { toast.error('Gagal memuat data master') }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formStep1.nama_santri || !formStep1.tempat_lahir || !formStep1.tanggal_lahir || !formStep1.nis) { toast.error('Mohon lengkapi data pribadi yang wajib diisi'); return }
      if (!formStep1.orang_tua.nama_ayah || !formStep1.orang_tua.nama_ibu) { toast.error('Nama ayah dan ibu wajib diisi'); return }
    } else if (currentStep === 2) {
      if (!formStep2.kelas_id || !formStep2.asrama_id) { toast.error('Mohon pilih kelas dan asrama'); return }
    } else if (currentStep === 3) {
      if (!selectedTagihan.length) { toast.error('Mohon pilih minimal 1 tagihan'); return }
    }
    setCurrentStep(s => s + 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const fd = new FormData()
      const s1 = formStep1
      const strFields = ['nis','nisn','nik_santri','nama_santri','tempat_lahir','tanggal_lahir','jenis_kelamin','alamat','asal_sekolah','hobi','cita_cita','desa','kecamatan','kabupaten','provinsi','kode_pos']
      strFields.forEach(f => { const v = (s1 as any)[f]; if (v) fd.append(f, String(v)) })
      if (s1.jumlah_saudara) fd.append('jumlah_saudara', String(s1.jumlah_saudara))
      fd.append('status', 'aktif'); fd.append('jenis_penerimaan', 'mutasi_masuk')
      fd.append('kelas_id', String(formStep2.kelas_id)); fd.append('asrama_id', String(formStep2.asrama_id))
      const ot = s1.orang_tua
      const otFields = ['no_kk','nama_ayah','nik_ayah','pendidikan_ayah','pekerjaan_ayah','hp_ayah','nama_ibu','nik_ibu','pendidikan_ibu','pekerjaan_ibu','hp_ibu']
      otFields.forEach(f => { const v = (ot as any)[f]; if (v) fd.append(f, v) })
      const res: any = await createSantri(fd)
      const newId = res?.data?.id || res?.id || res?.santri?.id
      if (!newId) throw new Error('Gagal menyimpan data santri')
      const tunggakan = selectedTagihan.map(t => ({ santri_id: newId, jenis_tagihan_id: t.jenis_tagihan_id, bulan: getBulanNamaFromDate(t.jatuh_tempo), nominal: Number(t.nominal) || 0 }))
      if (tunggakan.length) await createTunggakan(tunggakan)
      toast.success('Mutasi masuk berhasil!')
      setFormStep1(INIT_STEP1); setFormStep2({ kelas_id:'', asrama_id:'' }); setSelectedTagihan([])
      setCurrentStep(1); setShowWizard(false); fetchSantri()
    } catch (e: any) {
      const ed = e.response?.data; const errors = ed?.errors
      if (errors?.nis?.[0]?.includes('unique') || errors?.nis?.[0]?.includes('already')) { toast.error('NIS sudah terdaftar!'); return }
      toast.error(ed?.message || e?.message || 'Gagal menyimpan data')
    } finally { setLoading(false) }
  }

  const addTagihan = (jenisTagihan: any) => {
    if (selectedTagihan.find(t => t.jenis_tagihan_id === jenisTagihan.id)) { toast.error('Tagihan sudah ditambahkan'); return }
    const tipe = jenisTagihan.tipeNominal || jenisTagihan.tipe_nominal
    let nominal = 0
    if (tipe === 'sama') nominal = jenisTagihan.nominalSama || jenisTagihan.nominal_sama || 0
    const jt = jenisTagihan.jatuhTempo || jenisTagihan.jatuh_tempo || ''
    const defaultDay = Math.min(Math.max(Number(String(jt).match(/(\d{1,2})/)?.[1] || 10), 1), 28)
    let jatuhTempo = toLocalDateStr(new Date())
    if (jenisTagihan.kategori === 'Rutin' && jenisTagihan.bulan) {
      const bulanRaw = jenisTagihan.bulan; let bulanList: string[] = Array.isArray(bulanRaw) ? bulanRaw : (() => { try { const p = JSON.parse(bulanRaw); return Array.isArray(p) ? p : bulanRaw.split(',').map((b:string)=>b.trim()) } catch { return String(bulanRaw).split(',').map((b:string)=>b.trim()) } })()
      const today = new Date()
      const monthMap: Record<string,number> = {Januari:0,Februari:1,Maret:2,April:3,Mei:4,Juni:5,Juli:6,Agustus:7,September:8,Oktober:9,November:10,Desember:11}
      for (let i = 0; i < 24; i++) { const cd = new Date(today.getFullYear(), today.getMonth()+i, 1); const mn = Object.keys(monthMap).find(k => monthMap[k] === cd.getMonth()); if (!mn) continue; if (bulanList.includes(mn)) { const cand = new Date(cd.getFullYear(), cd.getMonth(), defaultDay); if (cand >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) { jatuhTempo = toLocalDateStr(cand); break } } }
    }
    if (jenisTagihan.kategori === 'Non Rutin' && jt) jatuhTempo = jt
    if (['per_kelas','beda_perkelas'].includes(tipe)) {
      const nama = (jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || '').toUpperCase()
      if (nama !== 'BERAS') { setPendingTagihan({ jenis_tagihan: jenisTagihan, jatuh_tempo: jatuhTempo }); setShowKelasModal(true); return }
    }
    setSelectedTagihan(prev => [...prev, { jenis_tagihan_id: jenisTagihan.id, nama_tagihan: jenisTagihan.namaTagihan || jenisTagihan.nama_tagihan || 'Tagihan', nominal, jatuh_tempo: jatuhTempo, is_custom_nominal: false, tipe_nominal: tipe }])
    toast.success('Tagihan ditambahkan')
  }

  const removeTagihan = (id: number) => setSelectedTagihan(prev => prev.filter(t => t.jenis_tagihan_id !== id))
  const updateTagihanJatuhTempo = (id: number, jt: string) => setSelectedTagihan(prev => prev.map(t => t.jenis_tagihan_id === id ? {...t, jatuh_tempo: jt} : t))
  const updateTagihanNominal = (id: number, n: number) => setSelectedTagihan(prev => prev.map(t => t.jenis_tagihan_id === id ? {...t, nominal: n, is_custom_nominal: true} : t))

  const handlePilihNominalKelas = (kelasId: number) => {
    if (!pendingTagihan) return
    const jt = pendingTagihan.jenis_tagihan
    const np = jt.nominalPerkelas || jt.nominal_perkelas || []
    const found = np.find((n: any) => n.kelas_id === kelasId || n.kelasId === kelasId)
    setSelectedTagihan(prev => [...prev, { jenis_tagihan_id: jt.id, nama_tagihan: jt.namaTagihan || jt.nama_tagihan || 'Tagihan', nominal: found?.nominal || 0, jatuh_tempo: pendingTagihan.jatuh_tempo, is_custom_nominal: false, kelas_id: kelasId, tipe_nominal: jt.tipeNominal || jt.tipe_nominal }])
    toast.success('Tagihan ditambahkan')
    setShowKelasModal(false); setPendingTagihan(null)
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus santri "${nama}"?`)) return
    try { await deleteSantri(id); toast.success('Santri berhasil dihapus'); fetchSantri() }
    catch { toast.error('Gagal menghapus santri') }
  }

  const steps = [{ num:1, label:'Data Pribadi', icon:User }, { num:2, label:'Penempatan', icon:MapPin }, { num:3, label:'Tagihan', icon:DollarSign }, { num:4, label:'Review', icon:FileCheck }]

  return (
    <div className="p-6">
      {!showWizard ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div><h1 className="text-2xl font-bold text-gray-900">Mutasi Masuk</h1><p className="text-gray-600 mt-1">Daftar santri yang masuk melalui mutasi dari sekolah/pesantren lain</p></div>
            {hasAccess('kesantrian.mutasi.masuk') && <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"><Plus className="w-5 h-5" />Tambah Mutasi Masuk</button>}
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b"><tr>{['No','Nama Santri','NIS','Asal Sekolah','Tanggal Lahir','Kelas','Aksi'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y">
                  {loadingList ? <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr> : santriList.length === 0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada data santri mutasi masuk</td></tr> : santriList.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{i+1}</td>
                      <td className="px-6 py-4 font-medium">{s.nama_santri}</td>
                      <td className="px-6 py-4 text-gray-600">{s.nis}</td>
                      <td className="px-6 py-4 text-gray-600">{s.asal_sekolah}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(s.tanggal_lahir).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</td>
                      <td className="px-6 py-4 text-gray-600">{s.kelas?.nama_kelas || '-'}</td>
                      <td className="px-6 py-4">{hasAccess('kesantrian.mutasi.masuk') && <button onClick={() => handleDelete(s.id, s.nama_santri)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div><h1 className="text-2xl font-bold text-gray-900">Mutasi Masuk - Santri Baru</h1><p className="text-gray-600 mt-1">Daftarkan santri baru yang masuk ke pesantren</p></div>
            <button onClick={() => { if (confirm('Batalkan proses mutasi masuk?')) { setShowWizard(false); setFormStep1(INIT_STEP1); setFormStep2({kelas_id:'',asrama_id:''}); setSelectedTagihan([]); setCurrentStep(1) } }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          </div>
          <div className="mb-8 flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${currentStep >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {currentStep > step.num ? <Check className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${currentStep >= step.num ? 'text-blue-600' : 'text-gray-500'}`}>{step.label}</span>
                </div>
                {idx < 3 && <div className={`h-1 flex-1 mx-2 ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              {currentStep === 1 && <Step1DataPribadi formData={formStep1} setFormData={setFormStep1} />}
              {currentStep === 2 && <Step2Penempatan formData={formStep2} setFormData={setFormStep2} kelasList={kelasList} asramaList={asramaList} />}
              {currentStep === 3 && <Step3Tagihan jenisTagihanList={jenisTagihanList} kelasList={kelasList} selectedTagihan={selectedTagihan} addTagihan={addTagihan} removeTagihan={removeTagihan} updateTagihanJatuhTempo={updateTagihanJatuhTempo} updateTagihanNominal={updateTagihanNominal} />}
              {currentStep === 4 && <Step4Review formStep1={formStep1} formStep2={formStep2} selectedTagihan={selectedTagihan} kelasList={kelasList} asramaList={asramaList} />}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button onClick={() => setCurrentStep(s=>s-1)} disabled={currentStep===1} className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft className="w-5 h-5" />Kembali</button>
                {currentStep < 4 ? <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lanjut<ArrowRight className="w-5 h-5" /></button>
                : <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan & Selesai'}<Check className="w-5 h-5" /></button>}
              </div>
            </div>
          </div>
          {showKelasModal && pendingTagihan && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Pilih Nominal Berdasarkan Tingkat</h3>
                <p className="text-sm text-gray-600 mb-4">Tagihan <strong>{pendingTagihan.jenis_tagihan.namaTagihan}</strong> memiliki nominal berbeda per tingkat.</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(pendingTagihan.jenis_tagihan.nominalPerkelas || pendingTagihan.jenis_tagihan.nominal_perkelas || []).map((item: any) => {
                    const kelas = kelasList.find((k: any) => k.id === (item.kelas_id || item.kelasId))
                    return <button key={item.kelas_id || item.kelasId} onClick={() => handlePilihNominalKelas(item.kelas_id || item.kelasId)} className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"><div className="flex justify-between items-center"><div><p className="font-medium">{kelas?.nama_kelas || `Kelas ${item.kelas_id}`}</p><p className="text-xs text-gray-500">Tingkat {kelas?.tingkat || '-'}</p></div><p className="text-lg font-semibold text-blue-600">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(item.nominal||0)}</p></div></button>
                  })}
                </div>
                <button onClick={() => { setShowKelasModal(false); setPendingTagihan(null) }} className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}