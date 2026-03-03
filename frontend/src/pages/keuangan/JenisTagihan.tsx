import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Play, Search } from 'lucide-react'
import { listSantri } from '../../api/santri'
import { listKelas } from '../../api/kelas'
import { listJenisTagihan, createJenisTagihan, updateJenisTagihan, deleteJenisTagihan } from '../../api/jenisTagihan'
import { listTahunAjaran } from '../../api/tahunAjaran'
import { listBukuKas } from '../../api/bukuKas'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'
import type { JenisTagihanItem } from '../../types/jenisTagihan.types'
import ModalFormTagihan from './components/ModalFormTagihan'
import ModalPreviewGenerate from './components/ModalPreviewGenerate'
import ModalBulkActions from './components/ModalBulkActions'

function ModalConfirmDelete({ tagihanNama, onConfirm, onCancel }: { tagihanNama: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6 border-b"><h3 className="font-bold text-lg">Hapus Tagihan</h3></div>
        <div className="p-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <div><p className="font-medium">Anda yakin ingin menghapus?</p><p className="text-sm text-gray-600 mt-1">Tagihan <strong>"{tagihanNama}"</strong> akan dihapus permanen.</p></div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Hapus</button>
        </div>
      </div>
    </div>
  )
}

export default function JenisTagihan() {
  const [showModal, setShowModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  const [selectedTagihan, setSelectedTagihan] = useState<JenisTagihanItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [kelasList, setKelasList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [bukuKasList, setBukuKasList] = useState<any[]>([])
  const [dataTagihan, setDataTagihan] = useState<JenisTagihanItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState<any>(null)
  const [bulanList, setBulanList] = useState<string[]>([])

  const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  useEffect(() => { fetchAllData() }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [kelasRes, santriRes, tagihanRes, tahunRes, bukuKasRes] = await Promise.all([listKelas(), listSantri(1, 1000), listJenisTagihan(), listTahunAjaran(), listBukuKas()])
      setKelasList(kelasRes.data || kelasRes || [])
      setSantriList(santriRes.data || santriRes || [])
      setDataTagihan(tagihanRes.data || tagihanRes || [])
      setBukuKasList(bukuKasRes.data || bukuKasRes || [])
      const tahuns = tahunRes.data || tahunRes || []
      const aktif = tahuns.find((t: any) => t.status === 'aktif')
      setTahunAjaranAktif(aktif || null)
      if (aktif) {
        const { bulan_mulai: mulai, bulan_akhir: akhir } = aktif
        const bulan: string[] = []
        if (mulai <= akhir) for (let i = mulai; i <= akhir; i++) bulan.push(BULAN_NAMA[i-1])
        else { for (let i = mulai; i <= 12; i++) bulan.push(BULAN_NAMA[i-1]); for (let i = 1; i <= akhir; i++) bulan.push(BULAN_NAMA[i-1]) }
        setBulanList(bulan)
      } else { setBulanList(BULAN_NAMA) }
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const handleSave = async (data: JenisTagihanItem) => {
    try {
      if (selectedTagihan) {
        const res = await updateJenisTagihan(selectedTagihan.id, data)
        setDataTagihan(prev => prev.map(i => i.id === selectedTagihan.id ? res.data : i))
        toast.success('Tagihan berhasil diperbarui!')
      } else {
        const res = await createJenisTagihan(data)
        setDataTagihan(prev => [...prev, res.data])
        toast.success('Tagihan berhasil ditambahkan!')
      }
      setShowModal(false); setSelectedTagihan(null)
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal menyimpan tagihan') }
  }

  const handleConfirmDelete = async () => {
    if (!selectedTagihan) return
    try {
      await deleteJenisTagihan(selectedTagihan.id)
      setDataTagihan(prev => prev.filter(i => i.id !== selectedTagihan.id))
      toast.success('Tagihan berhasil dihapus!')
    } catch { toast.error('Gagal menghapus tagihan') }
    finally { setShowConfirmModal(false); setSelectedTagihan(null) }
  }

  const filtered = dataTagihan.filter(i => i.namaTagihan.toLowerCase().includes(searchTerm.toLowerCase()) || i.kategori.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="p-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Jenis Tagihan</h1><p className="text-gray-600 mt-1">Kelola jenis-jenis tagihan untuk santri</p></div>
      <div className="bg-white rounded-lg shadow mb-6 p-4 flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Cari tagihan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        {hasAccess('keuangan.tagihan.edit') && <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-5 h-5" />Tambah Tagihan</button>}
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['No','Nama Tagihan','Kategori','Bulan','Nominal Default','Jatuh Tempo','Buku Kas','Aksi'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Tidak ada data tagihan</td></tr> : filtered.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{i + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.namaTagihan}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.kategori==='Rutin'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{item.kategori}</span></td>
                  <td className="px-6 py-4 text-sm">{item.bulan.length > 3 ? `${item.bulan.slice(0,3).join(', ')}... (+${item.bulan.length-3})` : item.bulan.join(', ')}</td>
                  <td className="px-6 py-4 text-sm">{item.tipeNominal==='sama' && item.nominalSama ? `Rp ${item.nominalSama.toLocaleString('id-ID')}` : item.tipeNominal==='per_kelas' ? <span className="text-orange-600 font-medium">Berbeda per Kelas</span> : <span className="text-purple-600 font-medium">Berbeda per Individu</span>}</td>
                  <td className="px-6 py-4 text-sm">{item.jatuhTempo}</td>
                  <td className="px-6 py-4 text-sm">{item.bukuKas}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {hasAccess('keuangan.tagihan.edit') && <button onClick={() => { setSelectedTagihan(item); setShowPreviewModal(true) }} className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded" title="Generate"><Play className="w-4 h-4" /></button>}
                      {hasAccess('keuangan.tagihan.edit') && <button onClick={() => { setSelectedTagihan(item); setShowModal(true) }} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>}
                      {hasAccess('keuangan.tagihan.delete') && <button onClick={() => { setSelectedTagihan(item); setShowConfirmModal(true) }} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>}
                      {hasAccess('keuangan.tagihan.edit') && <button onClick={() => { setSelectedTagihan(item); setShowBulkActionModal(true) }} className="text-purple-600 hover:text-purple-900 px-2 py-1 hover:bg-purple-50 rounded text-xs font-medium">Perbaiki</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && <ModalFormTagihan onClose={() => { setShowModal(false); setSelectedTagihan(null) }} onSave={handleSave} tagihan={selectedTagihan} kelasList={kelasList} santriList={santriList} bukuKasList={bukuKasList} bulanAvailable={bulanList} tahunAjaranAktif={tahunAjaranAktif} />}
      {showPreviewModal && selectedTagihan && <ModalPreviewGenerate tagihan={selectedTagihan} santriList={santriList} onClose={() => { setShowPreviewModal(false); setSelectedTagihan(null) }} />}
      {showConfirmModal && selectedTagihan && <ModalConfirmDelete tagihanNama={selectedTagihan.namaTagihan} onConfirm={handleConfirmDelete} onCancel={() => { setShowConfirmModal(false); setSelectedTagihan(null) }} />}
      {showBulkActionModal && selectedTagihan && <ModalBulkActions tagihan={selectedTagihan} onClose={() => { setShowBulkActionModal(false); setSelectedTagihan(null) }} onSuccess={fetchAllData} />}
    </div>
  )
}