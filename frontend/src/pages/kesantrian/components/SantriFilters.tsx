import { Search } from 'lucide-react'
import Card from '../../../components/Card'

interface Props {
  searchQuery: string
  onSearchChange: (v: string) => void
  kelasOptions: any[]
  asramaOptions: any[]
  selectedKelas: string
  selectedAsrama: string
  selectedStatus: string
  onKelasChange: (v: string) => void
  onAsramaChange: (v: string) => void
  onStatusChange: (v: string) => void
}

const SELECT_CLASS = 'border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]'

export default function SantriFilters({ searchQuery, onSearchChange, kelasOptions, asramaOptions, selectedKelas, selectedAsrama, selectedStatus, onKelasChange, onAsramaChange, onStatusChange }: Props) {
  return (
    <Card>
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIS, atau NISN..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select value={selectedKelas} onChange={(e) => onKelasChange(e.target.value)} className={SELECT_CLASS}>
              <option value="">Semua Kelas</option>
              {kelasOptions.map((k: any) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
            <select value={selectedAsrama} onChange={(e) => onAsramaChange(e.target.value)} className={SELECT_CLASS}>
              <option value="">Semua Asrama</option>
              <option value="non_asrama">Non Asrama</option>
              {asramaOptions.map((a: any) => (
                <option key={a.id} value={a.id}>{a.nama_asrama}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(e) => onStatusChange(e.target.value)} className={SELECT_CLASS}>
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="lulus">Lulus</option>
              <option value="keluar">Keluar</option>
              <option value="mutasi_keluar">Mutasi Keluar</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  )
}
