import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { JenisTagihanItem } from '../../../types/jenisTagihan.types'

interface Props {
  onClose: () => void
  onSave: (data: JenisTagihanItem) => void
  tagihan: JenisTagihanItem | null
  kelasList: any[]
  santriList: any[]
  bukuKasList: any[]
  bulanAvailable: string[]
  tahunAjaranAktif: any
}

function ModalTambahSantriInner({ santriList, onAdd, onClose }: { santriList: any[]; onAdd: (list: {id:string;nama:string}[], nominal: number) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<{id:string;nama:string}[]>([])
  const [nominal, setNominal] = useState(0)
  const [search, setSearch] = useState('')
  const filtered = santriList.filter(s => search.length >= 2 && ((s.nama_santri || '').toLowerCase().includes(search.toLowerCase()) || (s.nis || '').toLowerCase().includes(search.toLowerCase())))
  const toggle = (s: any) => { const id = String(s.id); setSelected(prev => prev.find(x => x.id === id) ? prev.filter(x => x.id !== id) : [...prev, { id, nama: s.nama_santri }]) }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-bold">Tambah Santri</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-4 space-y-4">
          <input type="text" placeholder="Cari nama/NIS (min 2 huruf)..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          {search.length >= 2 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
              {filtered.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">Santri tidak ditemukan</div> : filtered.map(s => (
                <div key={s.id} onClick={() => toggle(s)} className={`p-3 cursor-pointer flex items-center gap-3 ${selected.find(x => x.id === String(s.id)) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" readOnly checked={!!selected.find(x => x.id === String(s.id))} className="cursor-pointer" />
                  <div><div className="font-medium text-sm">{s.nama_santri}</div><div className="text-xs text-gray-500">{s.nis} • {s.kelas_nama}</div></div>
                </div>
              ))}
            </div>
          )}
          {selected.length > 0 && (
            <div className="border rounded-lg p-3 bg-blue-50 space-y-2">
              <p className="text-sm font-medium text-gray-700">Terpilih ({selected.length})</p>
              {selected.map(s => <div key={s.id} className="flex items-center justify-between bg-white p-2 rounded text-sm"><span className="font-medium">{s.nama}</span><button onClick={() => setSelected(prev => prev.filter(x => x.id !== s.id))}><X className="w-4 h-4 text-red-600" /></button></div>)}
              <input type="text" placeholder="Nominal untuk semua santri" value={nominal ? nominal.toLocaleString('id-ID') : ''} onChange={e => setNominal(Number(e.target.value.replace(/\./g,'').replace(/\D/g,'')))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              {nominal > 0 && <p className="text-xs text-gray-500">Total: {selected.length} × Rp {nominal.toLocaleString('id-ID')} = <strong>Rp {(selected.length * nominal).toLocaleString('id-ID')}</strong></p>}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
          <button onClick={() => { if (!selected.length || !nominal) { toast.error('Pilih minimal 1 santri dan isi nominal'); return } onAdd(selected, nominal) }} disabled={!selected.length || !nominal} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Tambah ({selected.length})</button>
        </div>
      </div>
    </div>
  )
}

export default function ModalFormTagihan({ onClose, onSave, tagihan, kelasList, santriList, bukuKasList, bulanAvailable, tahunAjaranAktif }: Props) {
  const [namaTagihan, setNamaTagihan] = useState(tagihan?.namaTagihan || '')
  const [kategori, setKategori] = useState<'Rutin' | 'Non Rutin'>(tagihan?.kategori || 'Rutin')
  const [bulanTerpilih, setBulanTerpilih] = useState<string[]>(tagihan?.bulan || [])
  const [tipeNominal, setTipeNominal] = useState<'sama'|'per_kelas'|'per_individu'>(tagihan?.tipeNominal || 'sama')
  const [nominalSama, setNominalSama] = useState(tagihan?.nominalSama || 0)
  const [nominalPerKelas, setNominalPerKelas] = useState<{kelas:string;nominal:number}[]>(tagihan?.nominalPerKelas || [])
  const [nominalPerIndividu, setNominalPerIndividu] = useState<{santriId:string;santriNama:string;nominal:number}[]>(tagihan?.nominalPerIndividu || [])
  const [jatuhTempo, setJatuhTempo] = useState(tagihan?.jatuhTempo || '')
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [bukuKasId, setBukuKasId] = useState(tagihan?.bukuKasId || '')
  const [showAddSantri, setShowAddSantri] = useState(false)

  const bulanList = bulanAvailable.length > 0 ? bulanAvailable : ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  const getBulanWithYear = (bulan: string) => {
    if (!tahunAjaranAktif) return bulan
    const bulanMap: Record<string,number> = {Januari:1,Februari:2,Maret:3,April:4,Mei:5,Juni:6,Juli:7,Agustus:8,September:9,Oktober:10,November:11,Desember:12}
    const tahun = bulanMap[bulan] >= tahunAjaranAktif.bulan_mulai ? tahunAjaranAktif.tahun_mulai : tahunAjaranAktif.tahun_akhir
    return `${bulan} ${tahun}`
  }

  const handleSubmit = () => {
    if (!namaTagihan.trim()) { toast.error('Nama tagihan harus diisi'); return }
    if (!bulanTerpilih.length) { toast.error('Pilih minimal satu bulan'); return }
    if (!jatuhTempo && !tanggalJatuhTempo) { toast.error('Jatuh tempo harus diisi'); return }
    if (!bukuKasId) { toast.error('Buku kas harus dipilih'); return }
    if (tipeNominal === 'sama' && nominalSama <= 0) { toast.error('Nominal harus > 0'); return }
    if (tipeNominal === 'per_kelas' && !nominalPerKelas.length) { toast.error('Isi nominal per kelas'); return }
    if (tipeNominal === 'per_individu' && !nominalPerIndividu.length) { toast.error('Pilih santri individu'); return }
    const data: JenisTagihanItem = { id: 0, namaTagihan, kategori, bulan: bulanTerpilih, tipeNominal, jatuhTempo: kategori === 'Rutin' ? jatuhTempo : tanggalJatuhTempo, bukuKasId: Number(bukuKasId) }
    if (tipeNominal === 'sama') data.nominalSama = nominalSama
    else if (tipeNominal === 'per_kelas') data.nominalPerKelas = nominalPerKelas
    else data.nominalPerIndividu = nominalPerIndividu
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{tagihan ? 'Edit Tagihan' : 'Tambah Tagihan Baru'}</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Tagihan *</label><input type="text" value={namaTagihan} onChange={e => setNamaTagihan(e.target.value)} placeholder="Contoh: SPP, Makan, Ujian" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label><div className="flex gap-4">{(['Rutin','Non Rutin'] as const).map(k => <label key={k} className="flex items-center"><input type="radio" name="kategori" value={k} checked={kategori===k} onChange={() => setKategori(k)} className="mr-2" />{k}</label>)}</div></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulan Tagihan * <span className="text-xs text-gray-500">{tahunAjaranAktif ? `(TA ${tahunAjaranAktif.tahun_mulai}/${tahunAjaranAktif.tahun_akhir})` : ''}</span></label>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setBulanTerpilih([...bulanList])} className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200">✓ Pilih Semua</button>
              <button type="button" onClick={() => setBulanTerpilih([])} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200">✗ Batal Semua</button>
              {bulanTerpilih.length > 0 && <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded">{bulanTerpilih.length}/{bulanList.length} terpilih</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {bulanList.map(b => (
                <label key={b} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input type="checkbox" checked={bulanTerpilih.includes(b)} onChange={e => setBulanTerpilih(e.target.checked ? [...bulanTerpilih, b] : bulanTerpilih.filter(x => x !== b))} className="mr-2" />
                  <span className="text-sm">{tahunAjaranAktif ? getBulanWithYear(b) : b}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Nominal *</label>
            <div className="space-y-3">
              {(['sama','per_kelas','per_individu'] as const).map(tipe => (
                <div key={tipe}>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="tipeNominal" value={tipe} checked={tipeNominal===tipe} onChange={() => setTipeNominal(tipe)} className="mr-3" />
                    <div><div className="font-medium">{tipe==='sama'?'Nominal Sama':tipe==='per_kelas'?'Nominal Berbeda Per Kelas':'Nominal Berbeda Per Individu'}</div><div className="text-xs text-gray-500">{tipe==='sama'?'Otomatis untuk semua santri aktif':tipe==='per_kelas'?'Centang kelas & isi nominal':'Pilih santri & isi nominal per santri'}</div></div>
                  </label>
                  {tipeNominal==='sama' && tipe==='sama' && <div className="ml-6 mt-2"><input type="text" placeholder="Masukkan nominal" value={nominalSama?nominalSama.toLocaleString('id-ID'):''} onChange={e => setNominalSama(Number(e.target.value.replace(/\./g,'').replace(/\D/g,'')))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>}
                  {tipeNominal==='per_kelas' && tipe==='per_kelas' && (
                    <div className="ml-6 mt-2 space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
                      {kelasList.map(k => {
                        const nama = k.nama_kelas || k.id; const chk = nominalPerKelas.some(n => n.kelas===nama); const val = nominalPerKelas.find(n => n.kelas===nama)?.nominal || 0
                        return <div key={k.id} className="grid grid-cols-12 gap-2 items-center"><div className="col-span-1"><input type="checkbox" checked={chk} onChange={e => { if(!e.target.checked) setNominalPerKelas(prev=>prev.filter(n=>n.kelas!==nama)); else if(!nominalPerKelas.find(n=>n.kelas===nama)) setNominalPerKelas(prev=>[...prev,{kelas:nama,nominal:0}]) }} /></div><div className="col-span-5 text-sm">{nama}</div><div className="col-span-6"><input type="text" placeholder="0" value={val?val.toLocaleString('id-ID'):''} onChange={e => { const v=Number(e.target.value.replace(/\./g,'').replace(/\D/g,'')); setNominalPerKelas(prev => prev.find(n=>n.kelas===nama) ? prev.map(n=>n.kelas===nama?{...n,nominal:v}:n) : [...prev,{kelas:nama,nominal:v}]) }} disabled={!chk} className="w-full px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100" /></div></div>
                      })}
                    </div>
                  )}
                  {tipeNominal==='per_individu' && tipe==='per_individu' && (
                    <div className="ml-6 mt-2 space-y-2">
                      {nominalPerIndividu.length > 0 && <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-2">{nominalPerIndividu.map(item => <div key={item.santriId} className="flex items-center gap-2 p-2 bg-gray-50 rounded"><div className="flex-1 text-sm font-medium">{item.santriNama}</div><input type="text" placeholder="Nominal" value={item.nominal?item.nominal.toLocaleString('id-ID'):''} onChange={e => setNominalPerIndividu(prev=>prev.map(n=>n.santriId===item.santriId?{...n,nominal:Number(e.target.value.replace(/\./g,'').replace(/\D/g,''))}:n))} className="w-32 px-3 py-1 border border-gray-300 rounded text-sm" /><button onClick={() => { const nama=nominalPerIndividu.find(n=>n.santriId===item.santriId)?.santriNama; setNominalPerIndividu(prev=>prev.filter(n=>n.santriId!==item.santriId)); toast.success(`${nama} dihapus`) }}><X className="w-4 h-4 text-red-600" /></button></div>)}</div>}
                      <button onClick={() => setShowAddSantri(true)} className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" />Tambah Santri</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo * <span className="text-xs text-gray-500">({kategori==='Rutin'?'Contoh: Tanggal 10 setiap bulan':'Pilih tanggal spesifik'})</span></label>
            {kategori==='Rutin' ? <div className="flex items-center gap-2"><span>Tanggal</span><input type="number" min="1" max="31" placeholder="10" value={jatuhTempo.replace(/\D/g,'')} onChange={e => setJatuhTempo(`Tanggal ${e.target.value} setiap bulan`)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg" /><span>setiap bulan</span></div>
            : <input type="date" value={tanggalJatuhTempo} onChange={e => setTanggalJatuhTempo(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />}
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Buku Kas *</label><select value={bukuKasId} onChange={e => setBukuKasId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option value="">Pilih Buku Kas</option>{bukuKasList.map((k:any) => <option key={k.id} value={k.id}>{k.nama_kas}</option>)}</select></div>
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{tagihan ? 'Simpan Perubahan' : 'Tambah Tagihan'}</button>
        </div>
      </div>
      {showAddSantri && <ModalTambahSantriInner santriList={santriList} onAdd={(list, nominal) => { const ids = new Set(nominalPerIndividu.map(n => n.santriId)); const toAdd = list.filter(s => !ids.has(s.id)).map(s => ({santriId:s.id,santriNama:s.nama,nominal})); if(toAdd.length) { setNominalPerIndividu(prev=>[...prev,...toAdd]); toast.success(`${toAdd.length} santri ditambahkan`) } else toast.error('Semua santri sudah ada'); setShowAddSantri(false) }} onClose={() => setShowAddSantri(false)} />}
    </div>
  )
}
