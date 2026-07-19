import { useEffect, useState } from 'react'
import { getExpensesByCategory } from '../../api/reports'

interface KategoriPengeluaranItem {
  kategori_id: number
  kategori_name: string
  total: number | string
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

export default function PengeluaranKategori() {
  const [items, setItems] = useState<KategoriPengeluaranItem[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const normalizedItems = items
    .map((item) => ({
      ...item,
      total: Number(item.total || 0),
      kategori_name: item.kategori_name || 'Lain-lain',
    }))
    .sort((a, b) => b.total - a.total)

  const totalPengeluaran = normalizedItems.reduce((sum, item) => sum + item.total, 0)
  const jumlahKategori = normalizedItems.length

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (startDate) params.start = startDate
      if (endDate) params.end = endDate

      const res = await getExpensesByCategory(params)
      const data = Array.isArray(res.data) ? res.data : []
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengeluaran per Kategori</h1>
          <p className="text-sm text-gray-600">Ringkasan kategori pengeluaran berdasarkan rentang tanggal.</p>
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-lg border bg-white p-3 sm:grid-cols-3">
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={fetchData}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Terapkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Total Pengeluaran</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{currency.format(totalPengeluaran)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Jumlah Kategori</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{jumlahKategori}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Kategori Tertinggi</p>
          <p className="mt-1 truncate text-xl font-bold text-gray-900">
            {normalizedItems[0]?.kategori_name || '-'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Proporsi</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>Memuat data...</td>
              </tr>
            ) : normalizedItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>Tidak ada data pengeluaran pada rentang ini.</td>
              </tr>
            ) : (
              normalizedItems.map((item, index) => {
                const ratio = totalPengeluaran > 0 ? (item.total / totalPengeluaran) * 100 : 0

                return (
                  <tr key={`${item.kategori_id}-${index}`} className="border-t align-top hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.kategori_name}</td>
                    <td className="px-4 py-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>{ratio.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{currency.format(item.total)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
