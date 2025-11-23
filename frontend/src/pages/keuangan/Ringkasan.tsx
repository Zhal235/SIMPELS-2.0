import { useEffect, useState } from 'react'
import { getSummary } from '../../api/reports'

export default function Ringkasan() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getSummary().then((res) => {
      if (!mounted) return
      setData(res.data || res)
    }).catch(() => {}).finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Ringkasan Keuangan</h1>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow border">
          <div className="text-sm text-gray-500">Total Pemasukan</div>
          <div className="text-2xl font-bold">{loading ? '—' : (data?.total_receipts ?? 0)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow border">
          <div className="text-sm text-gray-500">Total Pengeluaran</div>
          <div className="text-2xl font-bold">{loading ? '—' : (data?.total_expenses ?? 0)}</div>
        </div>
        <div className="p-4 bg-white rounded shadow border">
          <div className="text-sm text-gray-500">Netto</div>
          <div className="text-2xl font-bold">{loading ? '—' : (data?.net ?? 0)}</div>
        </div>
      </div>
    </div>
  )
}
