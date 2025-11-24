import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  DollarSign, 
  FileText,
  Banknote,
  Table,
  TrendingUp
} from 'lucide-react'

interface ReportCard {
  title: string
  description: string
  icon: any
  path: string
  color: string
}

export default function LaporanIndex() {
  const reports: ReportCard[] = [
    {
      title: 'Dashboard Ringkasan',
      description: 'Overview keuangan dengan grafik dan metrik utama',
      icon: BarChart3,
      path: '/keuangan/laporan/dashboard',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'Laporan Tagihan Santri',
      description: 'Daftar tagihan santri per periode dengan status pembayaran',
      icon: FileText,
      path: '/keuangan/laporan/tagihan-santri',
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200'
    },
    {
      title: 'Laporan Tunggakan',
      description: 'Daftar santri dengan tunggakan dan prioritas penagihan',
      icon: FileText,
      path: '/keuangan/laporan/tunggakan-santri',
      color: 'bg-red-50 text-red-600 border-red-200'
    },
    {
      title: 'Laporan Arus Kas',
      description: 'Analisis arus kas masuk dan keluar per periode',
      icon: TrendingUp,
      path: '/keuangan/laporan/arus-kas',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      title: 'Laporan Laba Rugi',
      description: 'Income statement dengan format standar akuntansi',
      icon: FileText,
      path: '/keuangan/laporan/laba-rugi',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      title: 'Laporan Per Buku Kas',
      description: 'Saldo dan mutasi kas per buku kas',
      icon: Banknote,
      path: '/keuangan/laporan/per-buku-kas',
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      title: 'Detail Transaksi',
      description: 'Daftar lengkap transaksi dengan filter dan export',
      icon: Table,
      path: '/keuangan/laporan/detail-transaksi',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      title: 'Pengeluaran per Kategori',
      description: 'Breakdown pengeluaran berdasarkan kategori',
      icon: DollarSign,
      path: '/keuangan/laporan/pengeluaran-kategori',
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600 mt-1">Pilih jenis laporan yang ingin Anda lihat</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const IconComponent = report.icon
          return (
            <Link
              key={report.path}
              to={report.path}
              className="group relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${report.color} group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.description}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
