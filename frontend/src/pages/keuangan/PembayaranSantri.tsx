import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { listSantri, getSantri } from '../../api/santri'
import { getTagihanBySantri, listPembayaran, getHistoryPembayaran } from '../../api/pembayaran'
import { useAuthStore } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'
import type { Santri, Tagihan } from '../../types/pembayaran.types'
import { isOverdue, formatRupiah } from '../../utils/pembayaranHelpers'
import SantriSearchInput from './components/SantriSearchInput'
import SantriInfoCard from './components/SantriInfoCard'
import ModalBayarLunas from './components/ModalBayarLunas'
import ModalBayarSebagian from './components/ModalBayarSebagian'
import ModalKwitansi from './components/ModalKwitansi'
import HistoryPembayaranContent from './components/HistoryPembayaranContent'
import TagihanGroupedCards from './components/TagihanGroupedCards'

type ActiveTab = 'rutin' | 'non-rutin' | 'tunggakan' | 'lunas'

export default function PembayaranSantri() {
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null)
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('rutin')
  const [selectedTagihan, setSelectedTagihan] = useState<string[]>([])
  const [showModalLunas, setShowModalLunas] = useState(false)
  const [showModalSebagian, setShowModalSebagian] = useState(false)
  const [tagihan, setTagihan] = useState<Tagihan[]>([])
  const [historyPembayaran, setHistoryPembayaran] = useState<any>({})
  const [kwitansiData, setKwitansiData] = useState<any>(null)
  const [showKwitansi, setShowKwitansi] = useState(false)
  const user = useAuthStore((state) => state.user)
  const isLunasTab = activeTab === 'lunas'

  useEffect(() => {
    listSantri(1, 1000).then(res => {
      const data = Array.isArray(res) ? res : (res?.data ? res.data : [])
      setSantriList(data)
      const santriId = searchParams.get('santri_id')
      const nama = searchParams.get('nama')
      if (santriId && data.length > 0) {
        const found = data.find((s: any) => s.id === santriId)
        if (found) { handleSelectSantri(found); if (nama) setSearchQuery(decodeURIComponent(nama)) }
      }
    }).catch(() => toast.error('Gagal memuat data santri'))
  }, [searchParams])

  async function handleSelectSantri(santri: Santri) {
    setSelectedSantri(santri)
    setSearchQuery(santri.nama_santri)
    setShowSearchResults(false)
    setSelectedTagihan([])
    try {
      const resFull: any = await getSantri(santri.id)
      const payload = resFull?.data || resFull
      const full = payload?.data || payload
      if (full) setSelectedSantri(full)
    } catch {}
    try {
      const [resTagihan, resHistory, resPembayaran] = await Promise.all([
        getTagihanBySantri(santri.id),
        getHistoryPembayaran(santri.id),
        listPembayaran({ santri_id: santri.id }),
      ])
      setHistoryPembayaran(resHistory.data || {})
      const belumLunas = (resTagihan.data || [])
        .filter((t: any) => t.jenis_tagihan)
        .map((t: any) => ({
          id: t.id, bulan: t.bulan, tahun: String(t.tahun),
          jenisTagihan: t.jenis_tagihan?.nama_tagihan || 'Unknown',
          nominal: Number(t.sisa) || 0, jumlahBayar: t.dibayar,
          tipe: t.jenis_tagihan?.kategori?.toLowerCase().replace(' ', '-') || 'rutin',
          status: t.status, sisaBayar: Number(t.sisa) || 0,
          tglJatuhTempo: t.jatuh_tempo, buku_kas_id: t.jenis_tagihan?.buku_kas_id,
          sisa: t.sisa,
        }))
      const lunas = (resPembayaran.data || [])
        .filter((p: any) => p.tagihan_santri?.status === 'lunas' && p.tagihan_santri?.jenis_tagihan)
        .map((p: any) => ({
          id: p.tagihan_santri.id, bulan: p.tagihan_santri.bulan, tahun: String(p.tagihan_santri.tahun),
          jenisTagihan: p.tagihan_santri.jenis_tagihan?.nama_tagihan || 'Unknown',
          nominal: Number(p.tagihan_santri.nominal) || 0, jumlahBayar: p.tagihan_santri.dibayar,
          tipe: p.tagihan_santri.jenis_tagihan?.kategori?.toLowerCase().replace(' ', '-') || 'rutin',
          status: 'lunas' as const, sisaBayar: 0, tglJatuhTempo: p.tagihan_santri.jatuh_tempo,
          tglBayar: p.tanggal_bayar, adminPenerima: 'Admin',
          buku_kas_id: p.tagihan_santri.jenis_tagihan?.buku_kas_id, sisa: 0,
        }))
      const all = [...belumLunas, ...lunas]
      setTagihan(Array.from(new Map(all.map(t => [t.id, t])).values()) as Tagihan[])
    } catch {
      toast.error('Gagal memuat data tagihan')
      setTagihan([])
      setHistoryPembayaran({})
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
    setSelectedSantri(null)
    setShowSearchResults(false)
    setSelectedTagihan([])
  }

  function toggleTagihan(id: number | string) {
    const s = String(id)
    setSelectedTagihan(prev => prev.includes(s) ? prev.filter(t => t !== s) : [...prev, s])
  }

  function getFilteredTagihan(): Tagihan[] {
    if (activeTab === 'rutin') return tagihan.filter(t => t.tipe === 'rutin' && (t.status === 'belum_bayar' || t.status === 'sebagian') && !isOverdue(t.tglJatuhTempo, t.bulan, t.tahun))
    if (activeTab === 'non-rutin') return tagihan.filter(t => t.tipe === 'non-rutin' && (t.status === 'belum_bayar' || t.status === 'sebagian') && !isOverdue(t.tglJatuhTempo, t.bulan, t.tahun))
    if (activeTab === 'tunggakan') return tagihan.filter(t => t.status !== 'lunas' && isOverdue(t.tglJatuhTempo, t.bulan, t.tahun))
    if (activeTab === 'lunas') return tagihan.filter(t => t.status === 'lunas' || t.status === 'sebagian')
    return []
  }

  function getGroupedTagihan() {
    const grouped: Record<string, Tagihan[]> = {}
    getFilteredTagihan().forEach(t => {
      const key = `${t.bulan}-${t.tahun}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(t)
    })
    return Object.entries(grouped).map(([key, items]) => {
      const [bulan, tahun] = key.split('-')
      return { bulan, tahun, items }
    })
  }

  const totalSelected = tagihan.filter(t => selectedTagihan.includes(String(t.id))).reduce((s, t) => s + (Number(t.nominal) || 0), 0)

  function handlePaymentSuccess(data: any) {
    setKwitansiData(data)
    setShowKwitansi(true)
    setShowModalLunas(false)
    setShowModalSebagian(false)
    setSelectedTagihan([])
    if (selectedSantri) handleSelectSantri(selectedSantri)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pembayaran Santri</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran santri</p>
        </div>
        <SantriSearchInput
          searchQuery={searchQuery}
          showSearchResults={showSearchResults}
          santriList={santriList}
          onQueryChange={(q) => { setSearchQuery(q); setShowSearchResults(q.length >= 2) }}
          onSelect={handleSelectSantri}
          onClear={handleClearSearch}
          onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
        />
      </div>

      {selectedSantri ? (
        <>
          <SantriInfoCard santri={selectedSantri} />

          {selectedTagihan.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total yang Dipilih ({selectedTagihan.length} tagihan)</p>
                  <p className="text-3xl font-bold text-blue-600">{formatRupiah(totalSelected)}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowModalSebagian(true)} className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">Bayar Sebagian</button>
                  <button onClick={() => setShowModalLunas(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Bayar Lunas</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex">
                {([{ key: 'rutin', label: 'Tagihan Rutin' }, { key: 'non-rutin', label: 'Tagihan Non Rutin' }, { key: 'tunggakan', label: 'Tunggakan' }, { key: 'lunas', label: 'Sudah Dibayar' }] as const).map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {isLunasTab
                ? <HistoryPembayaranContent historyPembayaran={historyPembayaran} santri={selectedSantri} onPrintKwitansi={(data) => { setKwitansiData(data); setShowKwitansi(true) }} />
                : <TagihanGroupedCards groupedTagihan={getGroupedTagihan()} selectedTagihan={selectedTagihan} isLunasTab={isLunasTab} santri={selectedSantri} onToggle={toggleTagihan} onPrintKwitansi={(data) => { setKwitansiData(data); setShowKwitansi(true) }} />
              }
            </div>
          </div>

          {showModalLunas && <ModalBayarLunas tagihan={tagihan} selectedTagihan={selectedTagihan} santri={selectedSantri} userName={user?.name || 'Admin'} onClose={() => setShowModalLunas(false)} onSuccess={handlePaymentSuccess} />}
          {showModalSebagian && <ModalBayarSebagian tagihan={tagihan} selectedTagihan={selectedTagihan} santri={selectedSantri} userName={user?.name || 'Admin'} onClose={() => setShowModalSebagian(false)} onSuccess={handlePaymentSuccess} />}
          {showKwitansi && kwitansiData && <ModalKwitansi kwitansiData={kwitansiData} onClose={() => setShowKwitansi(false)} />}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cari Santri</h3>
          <p className="text-gray-500">Gunakan kolom pencarian di atas untuk mencari data santri</p>
        </div>
      )}
    </div>
  )
}