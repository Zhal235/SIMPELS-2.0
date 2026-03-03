import { Plus, X } from 'lucide-react'
import { formatRupiah } from '../../../utils/pembayaranHelpers'

export function Step2Penempatan({ formData, setFormData, kelasList, asramaList }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Penempatan Kelas & Asrama</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas <span className="text-red-500">*</span></label>
          <select value={formData.kelas_id} onChange={e => setFormData({ ...formData, kelas_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map((k: any) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Asrama <span className="text-red-500">*</span></label>
          <select value={formData.asrama_id} onChange={e => setFormData({ ...formData, asrama_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
            <option value="">-- Pilih Asrama --</option>
            {asramaList.map((a: any) => <option key={a.id} value={a.id}>{a.nama_asrama}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

export function Step3Tagihan({ jenisTagihanList, kelasList, selectedTagihan, addTagihan, removeTagihan, updateTagihanJatuhTempo, updateTagihanNominal }: any) {
  const totalTagihan = selectedTagihan.reduce((s: number, t: any) => s + Number(t.nominal), 0)
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Tagihan</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Tagihan Tersedia ({jenisTagihanList.length} item)</label>
        {jenisTagihanList.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-gray-500 mb-2">Belum ada jenis tagihan tersedia</p>
            <p className="text-sm text-gray-400">Silakan tambahkan di menu Keuangan → Jenis Tagihan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jenisTagihanList.map((jenis: any) => (
              <div key={jenis.id} onClick={() => addTagihan(jenis)} className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                <div className="flex justify-between items-start">
                  <div><p className="font-medium text-gray-900">{jenis.namaTagihan || jenis.nama_tagihan || 'Tagihan'}</p><p className="text-xs text-gray-500 mt-1">{jenis.kategori}</p></div>
                  <button onClick={e => { e.stopPropagation(); addTagihan(jenis) }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" type="button"><Plus className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedTagihan.length > 0 && (
        <div className="pt-4 border-t">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Tagihan Terpilih</h3>
          <div className="space-y-3">
            {selectedTagihan.map((tagihan: any) => (
              <div key={tagihan.jenis_tagihan_id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-medium text-gray-900">{tagihan.nama_tagihan}</p>
                  <button onClick={() => removeTagihan(tagihan.jenis_tagihan_id)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nominal {tagihan.is_custom_nominal && <span className="text-blue-600">(Custom)</span>}</label>
                    {['per_individu','per_kelas','beda_perkelas'].includes(tagihan.tipe_nominal) ? (
                      <>
                        <input type="number" value={tagihan.nominal || ''} onChange={e => updateTagihanNominal(tagihan.jenis_tagihan_id, Number(e.target.value)||0)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Masukkan nominal" min="0" />
                        <p className="text-xs text-gray-500 mt-1">{formatRupiah(Number(tagihan.nominal)||0)}</p>
                        {tagihan.kelas_id && <p className="text-xs text-blue-600 mt-1">Tingkat {kelasList.find((k: any) => k.id === tagihan.kelas_id)?.tingkat || tagihan.kelas_id}</p>}
                      </>
                    ) : (
                      <>
                        <div className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700">{tagihan.nominal || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">{formatRupiah(Number(tagihan.nominal)||0)}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Jatuh Tempo</label>
                    {tagihan.tipe_nominal === 'per_individu' ? (
                      <input type="date" value={tagihan.jatuh_tempo||''} onChange={e => updateTagihanJatuhTempo(tagihan.jenis_tagihan_id, e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                    ) : (
                      <div className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50 text-gray-700">{tagihan.jatuh_tempo || '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total Tagihan:</span>
            <span className="text-xl font-bold text-blue-600">{formatRupiah(totalTagihan)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function Step4Review({ formStep1, formStep2, selectedTagihan, kelasList, asramaList }: any) {
  const kelas = kelasList.find((k: any) => k.id === Number(formStep2.kelas_id))
  const asrama = asramaList.find((a: any) => a.id === Number(formStep2.asrama_id))
  const totalTagihan = selectedTagihan.reduce((s: number, t: any) => s + Number(t.nominal), 0)
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Konfirmasi</h2>
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Data Pribadi</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-600">Nama:</span><p className="font-medium">{formStep1.nama_santri}</p></div>
          <div><span className="text-gray-600">NIS:</span><p className="font-medium">{formStep1.nis}</p></div>
          <div><span className="text-gray-600">Tempat, Tgl Lahir:</span><p className="font-medium">{formStep1.tempat_lahir}, {formStep1.tanggal_lahir}</p></div>
          <div><span className="text-gray-600">Jenis Kelamin:</span><p className="font-medium">{formStep1.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p></div>
          <div><span className="text-gray-600">Asal Sekolah:</span><p className="font-medium">{formStep1.asal_sekolah}</p></div>
          <div><span className="text-gray-600">Orang Tua:</span><p className="font-medium">{formStep1.orang_tua.nama_ayah} & {formStep1.orang_tua.nama_ibu}</p></div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Penempatan</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-600">Kelas:</span><p className="font-medium">{kelas?.nama_kelas || '-'}</p></div>
          <div><span className="text-gray-600">Asrama:</span><p className="font-medium">{asrama?.nama_asrama || '-'}</p></div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Tagihan</h3>
        <div className="space-y-2 text-sm">
          {selectedTagihan.map((t: any) => (
            <div key={t.jenis_tagihan_id} className="flex justify-between"><span className="text-gray-700">{t.nama_tagihan}</span><span className="font-medium">{formatRupiah(t.nominal)}</span></div>
          ))}
          <div className="pt-2 border-t flex justify-between font-semibold"><span>Total:</span><span className="text-blue-600">{formatRupiah(totalTagihan)}</span></div>
        </div>
      </div>
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">✓ Data santri siap disimpan. Klik "Simpan & Selesai" untuk menyelesaikan proses mutasi masuk.</div>
    </div>
  )
}
