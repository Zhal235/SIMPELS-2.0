import { useState, useEffect, useMemo } from 'react'
import api from '../../api/index'
import { listTahunAjaran } from '../../api/tahunAjaran'
import { Download, Printer } from 'lucide-react'
import { exportToExcel } from '../../utils/exportExcel'
import { printTagihanSantri } from '../../utils/printLaporan'
import { useInstansiSetting } from '../../hooks/useInstansiSetting'
import TagihanFilterPanel from '../../components/keuangan/TagihanFilterPanel'
import TagihanSantriTable, { SantriGroup } from '../../components/keuangan/TagihanSantriTable'

interface TagihanData {
  id: number
  santri: {
    nama: string
    nis: string
    kelas?: { nama_kelas: string }
  }
  jenis_tagihan: { nama_tagihan: string }
  bulan: string
  tahun: number
  tahun_ajaran_id?: number
  nominal: number
  dibayar: number
  sisa: number
  status: string
}

interface Summary {
  total_tagihan: number
  total_dibayar: number
  total_sisa: number
  jumlah_lunas: number
  jumlah_belum_lunas: number
  jumlah_cicilan: number
}

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
]

function groupBySantri(data: TagihanData[]): SantriGroup[] {
  const map = new Map<string, SantriGroup>()
  data.forEach(t => {
    const key = t.santri.nis || t.santri.nama
    if (!map.has(key)) {
      map.set(key, {
        santri_id: key,
        nama: t.santri.nama,
        nis: t.santri.nis,
        kelas: t.santri.kelas?.nama_kelas || '',
        tagihan: [],
        total_tagihan: 0,
        total_dibayar: 0,
        total_sisa: 0,
      })
    }
    const group = map.get(key)!
    group.tagihan.push({ id: t.id, jenis_tagihan: t.jenis_tagihan, bulan: t.bulan, tahun: t.tahun, nominal: t.nominal, dibayar: t.dibayar, sisa: t.sisa, status: t.status })
    group.total_tagihan += t.nominal
    group.total_dibayar += t.dibayar
    group.total_sisa += t.sisa
  })
  return Array.from(map.values())
}

export default function LaporanTagihanSantri() {
  const { setting } = useInstansiSetting()
  const [data, setData] = useState<TagihanData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterBulan, setFilterBulan] = useState('all')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear() + '')
  const [filterTa, setFilterTa] = useState('all')
  const [tahuns, setTahuns] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterJenisTagihan, setFilterJenisTagihan] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [jenisTagihanList, setJenisTagihanList] = useState<Array<{ id: number; nama_tagihan: string }>>([])

  useEffect(() => {
    fetchJenisTagihan()
    listTahunAjaran().then((res: any) => setTahuns(res.data || res || []))
  }, [])

  useEffect(() => { fetchData() }, [filterBulan, filterTahun, filterStatus, filterJenisTagihan, filterTa])

  const fetchJenisTagihan = async () => {
    try {
      const response = await api.get('/v1/keuangan/jenis-tagihan')
      const arr = Array.isArray(response.data.data) ? response.data.data : Array.isArray(response.data) ? response.data : []
      setJenisTagihanList(arr.map((item: any) => ({ id: item.id, nama_tagihan: item.namaTagihan || item.nama_tagihan })))
    } catch {
      setJenisTagihanList([])
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/v1/keuangan/tagihan-santri')
      const santriData = response.data.data || []
      const allTagihan: TagihanData[] = []
      santriData.forEach((s: any) => {
        if (!Array.isArray(s.detail_tagihan)) return
        s.detail_tagihan.forEach((tagihan: any) => {
          allTagihan.push({
            id: tagihan.id,
            santri: { nama: s.santri_nama, nis: s.santri_nis || s.nis || 'N/A', kelas: { nama_kelas: s.kelas } },
            jenis_tagihan: { nama_tagihan: tagihan.jenis_tagihan },
            bulan: tagihan.bulan, tahun: tagihan.tahun, tahun_ajaran_id: tagihan.tahun_ajaran_id,
            nominal: parseFloat(tagihan.nominal || 0), dibayar: parseFloat(tagihan.dibayar || 0),
            sisa: parseFloat(tagihan.sisa || 0), status: tagihan.status,
          })
        })
      })
      const bulanNama = bulanOptions.find(b => b.value === filterBulan)?.label
      const filtered = allTagihan.filter(t => {
        if (filterBulan !== 'all' && t.bulan !== filterBulan && t.bulan !== bulanNama) return false
        if (filterTahun && t.tahun !== parseInt(filterTahun)) return false
        if (filterStatus !== 'all' && t.status !== filterStatus) return false
        if (filterJenisTagihan !== 'all' && t.jenis_tagihan.nama_tagihan !== filterJenisTagihan) return false
        if (filterTa !== 'all' && t.tahun_ajaran_id !== Number(filterTa)) return false
        if (search) {
          const q = search.toLowerCase()
          if (!t.santri.nama?.toLowerCase().includes(q) && !t.jenis_tagihan.nama_tagihan?.toLowerCase().includes(q)) return false
        }
        return true
      })
      setData(filtered)
      setSummary({
        total_tagihan: filtered.reduce((s, t) => s + t.nominal, 0),
        total_dibayar: filtered.reduce((s, t) => s + t.dibayar, 0),
        total_sisa: filtered.reduce((s, t) => s + t.sisa, 0),
        jumlah_lunas: filtered.filter(t => t.status === 'lunas').length,
        jumlah_belum_lunas: filtered.filter(t => t.status === 'belum_bayar').length,
        jumlah_cicilan: filtered.filter(t => t.status === 'sebagian').length,
      })
    } catch {
      setData([]); setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

  const handlePrint = () => {
    const bulanLabel = filterBulan !== 'all' ? (bulanOptions.find(b => b.value === filterBulan)?.label || filterBulan) : 'Semua Bulan'
    printTagihanSantri(data, summary, { namaYayasan: setting?.nama_yayasan, namaPesantren: setting?.nama_pesantren, kopSuratUrl: setting?.kop_surat_url }, `${bulanLabel} ${filterTahun}`)
  }

  const handleExportExcel = () => {
    const rows = data.map((t, i) => ({
      no: i + 1, nama: t.santri?.nama || '', nis: t.santri?.nis || '',
      kelas: t.santri?.kelas?.nama_kelas || '', jenis_tagihan: t.jenis_tagihan?.nama_tagihan || '',
      bulan: t.bulan || '', tahun: t.tahun, nominal: t.nominal, dibayar: t.dibayar, sisa: t.sisa,
      status: t.status === 'lunas' ? 'Lunas' : t.status === 'belum_bayar' ? 'Belum Bayar' : 'Cicilan',
    }))
    exportToExcel(rows, {
      no: 'No', nama: 'Nama Santri', nis: 'NIS', kelas: 'Kelas', jenis_tagihan: 'Jenis Tagihan',
      bulan: 'Bulan', tahun: 'Tahun', nominal: 'Nominal (Rp)', dibayar: 'Dibayar (Rp)', sisa: 'Sisa (Rp)', status: 'Status',
    }, `laporan-tagihan-santri-${new Date().toISOString().split('T')[0]}`, 'Tagihan Santri')
  }

  const groupedData = useMemo(() => groupBySantri(data), [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Tagihan Santri</h1>
          <p className="text-gray-600 mt-1">Daftar tagihan santri per periode</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Printer className="h-4 w-4" /> Cetak
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      <TagihanFilterPanel
        filterBulan={filterBulan} setFilterBulan={setFilterBulan}
        filterTahun={filterTahun} setFilterTahun={setFilterTahun}
        filterTa={filterTa} setFilterTa={setFilterTa} tahuns={tahuns}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterJenisTagihan={filterJenisTagihan} setFilterJenisTagihan={setFilterJenisTagihan}
        jenisTagihanList={jenisTagihanList} search={search} setSearch={setSearch}
        showFilters={showFilters} setShowFilters={setShowFilters}
        onSearch={fetchData} bulanOptions={bulanOptions}
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Tagihan</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summary.total_tagihan)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Dibayar</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_dibayar)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Sisa</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_sisa)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Status</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Lunas: {summary.jumlah_lunas}</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Cicilan: {summary.jumlah_cicilan}</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Belum: {summary.jumlah_belum_lunas}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-600 mt-2">Memuat data...</p>
          </div>
        ) : (
          <TagihanSantriTable groups={groupedData} bulanOptions={bulanOptions} />
        )}
      </div>
    </div>
  )
}

