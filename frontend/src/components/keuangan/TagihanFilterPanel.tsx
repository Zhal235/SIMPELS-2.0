import { Filter, Search } from 'lucide-react'

interface Props {
  filterBulan: string
  setFilterBulan: (v: string) => void
  filterTahun: string
  setFilterTahun: (v: string) => void
  filterTa: string
  setFilterTa: (v: string) => void
  tahuns: any[]
  filterStatus: string
  setFilterStatus: (v: string) => void
  filterJenisTagihan: string
  setFilterJenisTagihan: (v: string) => void
  jenisTagihanList: Array<{ id: number; nama_tagihan: string }>
  search: string
  setSearch: (v: string) => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  onSearch: () => void
  bulanOptions: Array<{ value: string; label: string }>
}

export default function TagihanFilterPanel({
  filterBulan, setFilterBulan, filterTahun, setFilterTahun,
  filterTa, setFilterTa, tahuns, filterStatus, setFilterStatus,
  filterJenisTagihan, setFilterJenisTagihan, jenisTagihanList,
  search, setSearch, showFilters, setShowFilters, onSearch, bulanOptions
}: Props) {
  const selectCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm'
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-gray-700 font-medium"
      >
        <Filter className="h-4 w-4" />
        {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
      </button>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
            <select value={filterTa} onChange={e => setFilterTa(e.target.value)} className={selectCls}>
              <option value="all">Semua</option>
              {tahuns.map(t => <option key={t.id} value={t.id}>{t.nama_tahun_ajaran} ({t.status})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
            <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className={selectCls}>
              <option value="all">Semua Bulan</option>
              {bulanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
            <input
              type="number"
              value={filterTahun}
              onChange={e => setFilterTahun(e.target.value)}
              className={selectCls}
              placeholder="2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Tagihan</label>
            <select value={filterJenisTagihan} onChange={e => setFilterJenisTagihan(e.target.value)} className={selectCls}>
              <option value="all">Semua Jenis</option>
              {jenisTagihanList.map(jt => <option key={jt.id} value={jt.nama_tagihan}>{jt.nama_tagihan}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="all">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="sebagian">Cicilan</option>
              <option value="belum_bayar">Belum Bayar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Santri</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && onSearch()}
                placeholder="Nama atau NIS..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
