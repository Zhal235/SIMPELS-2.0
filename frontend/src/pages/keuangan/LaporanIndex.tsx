import { Link } from 'react-router-dom'

export default function LaporanIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Laporan Keuangan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/keuangan/laporan/ringkasan" className="p-4 bg-white rounded shadow hover:shadow-md border">
          <div className="text-xl font-semibold">Ringkasan</div>
          <div className="text-sm text-gray-500">Total pemasukan, pengeluaran, dan netto</div>
        </Link>
        <Link to="/keuangan/laporan/pengeluaran-kategori" className="p-4 bg-white rounded shadow hover:shadow-md border">
          <div className="text-xl font-semibold">Pengeluaran per Kategori</div>
          <div className="text-sm text-gray-500">Rinci angka pengeluaran per kategori</div>
        </Link>
      </div>
    </div>
  )
}
