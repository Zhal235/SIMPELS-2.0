import { useState, useEffect } from 'react'
import { Search, Download, Eye, Calendar, Users, TrendingUp } from 'lucide-react'
import { listSantri } from '../../api/santri'
import { listTagihanBySantri } from '../../api/tagihanSantri'
import toast from 'react-hot-toast'

interface SantriAlumni {
  id: string
  nis: string
  nama_santri: string
  jenis_kelamin: string
  kelas_nama: string
  tahun_lulus?: string
  tanggal_keluar?: string
  status: string
  hp_ayah?: string
  hp_ibu?: string
}

export default function Alumni() {
  const [alumniList, setAlumniList] = useState<SantriAlumni[]>([])
  const [filteredAlumni, setFilteredAlumni] = useState<SantriAlumni[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')

  useEffect(() => {
    fetchAlumni()
  }, [])

  useEffect(() => {
    filterAlumni()
  }, [searchTerm, selectedYear, selectedGender, alumniList])

  const fetchAlumni = async () => {
    setLoading(true)
    try {
      const res = await listSantri(1, 10000)
      const allSantri = res.data || []
      
      // Filter santri yang statusnya alumni atau lulus
      const alumni = allSantri.filter((s: any) => 
        s.status === 'alumni' || s.status === 'lulus'
      )
      
      setAlumniList(alumni)
      setFilteredAlumni(alumni)
    } catch (error) {
      console.error('Error fetching alumni:', error)
      toast.error('Gagal memuat data alumni')
    } finally {
      setLoading(false)
    }
  }

  const filterAlumni = () => {
    let filtered = [...alumniList]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        a.nama_santri.toLowerCase().includes(term) ||
        a.nis.toLowerCase().includes(term) ||
        a.kelas_nama?.toLowerCase().includes(term)
      )
    }

    // Filter by year (extract from tanggal_keluar)
    if (selectedYear !== 'all') {
      filtered = filtered.filter(a => {
        const year = a.tanggal_keluar ? new Date(a.tanggal_keluar).getFullYear().toString() : ''
        return year === selectedYear
      })
    }

    // Filter by gender
    if (selectedGender !== 'all') {
      filtered = filtered.filter(a => a.jenis_kelamin === selectedGender)
    }

    setFilteredAlumni(filtered)
  }

  // Get unique years from tanggal_keluar
  const getUniqueYears = () => {
    const years = alumniList
      .map(a => a.tanggal_keluar ? new Date(a.tanggal_keluar).getFullYear() : null)
      .filter(y => y !== null) as number[]
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }

  const exportToCSV = () => {
    const headers = ['NIS', 'Nama', 'Jenis Kelamin', 'Kelas Terakhir', 'Tanggal Lulus', 'Status', 'HP Ayah', 'HP Ibu']
    const rows = filteredAlumni.map(a => [
      a.nis,
      a.nama_santri,
      a.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      a.kelas_nama || '-',
      a.tanggal_keluar || '-',
      a.status === 'alumni' ? 'Alumni' : 'Lulus',
      a.hp_ayah || '-',
      a.hp_ibu || '-'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `alumni-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('Data alumni berhasil di-export')
  }

  // Statistics
  const totalAlumni = filteredAlumni.length
  const totalLakiLaki = filteredAlumni.filter(a => a.jenis_kelamin === 'L').length
  const totalPerempuan = filteredAlumni.filter(a => a.jenis_kelamin === 'P').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Alumni</h1>
          <p className="text-gray-600 mt-1">Daftar santri yang sudah lulus/alumni</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Alumni</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalAlumni}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Laki-laki</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalLakiLaki}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Perempuan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalPerempuan}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-pink-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Tahun</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alumni Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Memuat data alumni...
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p>Tidak ada data alumni</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas Terakhir
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tahun Lulus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlumni.map((alumni, index) => (
                  <tr key={alumni.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alumni.nis}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {alumni.nama_santri}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {alumni.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {alumni.kelas_nama || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {alumni.tanggal_keluar 
                        ? new Date(alumni.tanggal_keluar).getFullYear()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {alumni.status === 'alumni' ? 'Alumni' : 'Lulus'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        {alumni.hp_ayah && (
                          <div className="text-xs">Ayah: {alumni.hp_ayah}</div>
                        )}
                        {alumni.hp_ibu && (
                          <div className="text-xs">Ibu: {alumni.hp_ibu}</div>
                        )}
                        {!alumni.hp_ayah && !alumni.hp_ibu && '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}