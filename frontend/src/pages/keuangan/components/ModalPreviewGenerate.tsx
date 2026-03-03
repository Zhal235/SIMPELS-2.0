import { useState } from 'react'
import { Play } from 'lucide-react'
import toast from 'react-hot-toast'
import type { JenisTagihanItem } from '../../../types/jenisTagihan.types'
import { generateTagihanSantri } from '../../../api/tagihanSantri'

interface Props {
  tagihan: JenisTagihanItem
  santriList: any[]
  onClose: () => void
}

function ModalSuccessGenerate({ totalTagihan, totalSantri, onClose }: { totalTagihan: number; totalSantri: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
        <h3 className="font-bold text-xl text-gray-900 mb-2">Generate Tagihan Berhasil!</h3>
        <div className="text-gray-600 space-y-1 mb-6"><p>Berhasil men-generate <strong className="text-green-600">{totalTagihan} tagihan</strong></p><p>untuk <strong className="text-green-600">{totalSantri} santri</strong></p></div>
        <button onClick={onClose} className="w-full px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">OK</button>
      </div>
    </div>
  )
}

export default function ModalPreviewGenerate({ tagihan, santriList, onClose }: Props) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedSantri, setGeneratedSantri] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const getDaftarSantri = () => {
    if (tagihan.tipeNominal === 'sama') return santriList.map(s => ({ nama: s.nama_santri, kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas', nominal: tagihan.nominalSama || 0 }))
    if (tagihan.tipeNominal === 'per_kelas') {
      const kelasTarget = tagihan.nominalPerKelas?.map(n => n.kelas) || []
      return santriList.filter(s => { const k = s.kelas_nama || s.kelas?.nama_kelas; return k && kelasTarget.includes(k) }).map(s => { const k = s.kelas_nama || s.kelas?.nama_kelas; return { nama: s.nama_santri, kelas: k, nominal: tagihan.nominalPerKelas?.find(n => n.kelas === k)?.nominal || 0 } })
    }
    const ids = tagihan.nominalPerIndividu?.map(n => n.santriId) || []
    return santriList.filter(s => ids.includes(String(s.id))).map(s => ({ nama: s.nama_santri, kelas: s.kelas_nama || s.kelas?.nama_kelas || 'Belum ada kelas', nominal: tagihan.nominalPerIndividu?.find(n => n.santriId === String(s.id))?.nominal || 0 }))
  }

  const daftarSantri = getDaftarSantri()
  const totalTagihan = daftarSantri.length * tagihan.bulan.length
  const getKelasWithSantri = () => (tagihan.nominalPerKelas || []).filter(item => santriList.some(s => (s.kelas_nama || s.kelas?.nama_kelas) === item.kelas))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">Preview Generate Tagihan</h2><p className="text-sm text-gray-600 mt-1">Tagihan: <strong>{tagihan.namaTagihan}</strong></p></div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Kategori:</span> {tagihan.kategori}</div>
            <div><span className="font-semibold">Tipe Nominal:</span> {tagihan.tipeNominal === 'sama' ? 'Semua Santri' : tagihan.tipeNominal === 'per_kelas' ? 'Berdasarkan Kelas' : 'Santri Individu'}</div>
            <div><span className="font-semibold">Bulan:</span> {tagihan.bulan.length} bulan ({tagihan.bulan.slice(0,3).join(', ')}{tagihan.bulan.length > 3 ? '...' : ''})</div>
            <div><span className="font-semibold">Jatuh Tempo:</span> {tagihan.jatuhTempo}</div>
          </div>
          {tagihan.tipeNominal === 'per_kelas' && getKelasWithSantri().length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Ringkasan Per Kelas</h3>
              <div className="border rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-100"><tr>{['Kelas','Nominal/Bulan','Jml Santri','Jml Bulan','Total'].map(h=><th key={h} className="px-4 py-2 text-left">{h}</th>)}</tr></thead><tbody className="divide-y">{getKelasWithSantri().map((item,i)=>{ const cnt=santriList.filter(s=>(s.kelas_nama||s.kelas?.nama_kelas)===item.kelas).length; return <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">{item.kelas}</td><td className="px-4 py-2">Rp {item.nominal.toLocaleString('id-ID')}</td><td className="px-4 py-2">{cnt} santri</td><td className="px-4 py-2">{tagihan.bulan.length}</td><td className="px-4 py-2 font-semibold">Rp {(item.nominal*tagihan.bulan.length*cnt).toLocaleString('id-ID')}</td></tr> })}</tbody></table></div>
            </div>
          )}
          {tagihan.tipeNominal !== 'per_kelas' && daftarSantri.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Daftar Santri ({daftarSantri.length})</h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg"><table className="w-full text-sm"><thead className="bg-gray-100 sticky top-0"><tr>{['No','Nama','Kelas','Nominal/Bulan','Jml Bulan','Total'].map(h=><th key={h} className="px-4 py-2 text-left">{h}</th>)}</tr></thead><tbody className="divide-y">{daftarSantri.map((s,i)=><tr key={i} className="hover:bg-gray-50"><td className="px-4 py-2">{i+1}</td><td className="px-4 py-2 font-medium">{s.nama}</td><td className="px-4 py-2">{s.kelas}</td><td className="px-4 py-2">Rp {s.nominal.toLocaleString('id-ID')}</td><td className="px-4 py-2">{tagihan.bulan.length}</td><td className="px-4 py-2 font-semibold">Rp {(s.nominal*tagihan.bulan.length).toLocaleString('id-ID')}</td></tr>)}</tbody></table></div>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            <p className="font-semibold text-green-900 mb-2">Ringkasan Generate</p>
            <p>• Total santri: <strong>{daftarSantri.length}</strong></p>
            <p>• Total bulan: <strong>{tagihan.bulan.length}</strong></p>
            <p>• Total tagihan yang akan dibuat: <strong>{totalTagihan}</strong></p>
            <p>• Buku Kas: <strong>{tagihan.bukuKas}</strong></p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            <p className="font-semibold text-yellow-900 mb-1 flex items-center gap-1">⚠ Catatan Penting</p>
            <p>• Tagihan yang sudah di-generate akan <strong>DISIMPAN PERMANEN</strong></p>
            <p>• Nominal mengikuti kelas santri saat generate, tidak berubah meski santri pindah kelas</p>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={async () => { setIsGenerating(true); try { const r = await generateTagihanSantri(tagihan.id); setGeneratedCount(r.data.total_tagihan); setGeneratedSantri(r.data.total_santri); setShowSuccess(true) } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal generate tagihan') } finally { setIsGenerating(false) } }} disabled={isGenerating} className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Play className="w-4 h-4" />{isGenerating ? 'Generating...' : 'Generate Tagihan Sekarang'}
          </button>
        </div>
      </div>
      {showSuccess && <ModalSuccessGenerate totalTagihan={generatedCount} totalSantri={generatedSantri} onClose={() => { setShowSuccess(false); onClose() }} />}
    </div>
  )
}
