import { useEffect, useState } from 'react'
import { getExpensesByCategory } from '../../api/reports'

export default function PengeluaranKategori() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getExpensesByCategory().then((res) => {
      const d = res.data ?? res
      setItems(d)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pengeluaran per Kategori</h1>
      <div className="mt-4 bg-white rounded shadow border overflow-hidden">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4">Memuat...</td></tr>
            ) : items.length ? items.map((it: any) => (
              <tr key={it.kategori_id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{it.kategori_name ?? 'Lain-lain'}</td>
                <td className="px-4 py-3">{it.total}</td>
              </tr>
            )) : (
              <tr><td className="p-4">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
