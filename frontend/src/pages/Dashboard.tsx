import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { apiFetch } from '../api'

type Summary = {
  totalSantri: number
  totalSaldo: number
  absensiSeries: number[]
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await apiFetch<Summary>('/dashboard', 'GET')
        setSummary(data)
      } catch (e) {
        console.error('Failed to fetch dashboard', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card title="Total Santri">
        <div className="text-3xl font-bold text-brand">{loading ? '...' : summary?.totalSantri ?? '-'}</div>
      </Card>
      <Card title="Total Saldo Keuangan">
        <div className="text-3xl font-bold text-brand">{loading ? '...' : summary?.totalSaldo ?? '-'}</div>
      </Card>
      <Card title="Grafik Absensi (mingguan)">
        <div className="flex items-end gap-1 h-24">
          {(summary?.absensiSeries ?? [10, 20, 12, 30, 18, 25, 22]).map((v, i) => (
            <div key={i} className="w-6 bg-brand" style={{ height: `${v}px` }} />
          ))}
        </div>
      </Card>
    </div>
  )
}