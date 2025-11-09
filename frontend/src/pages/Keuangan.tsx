import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts'

type Transaksi = { tanggal: string; jenis: 'debit' | 'kredit'; nominal: number; keterangan?: string }
type Saldo = { total: number }

export default function Keuangan() {
  const [items, setItems] = useState<Transaksi[]>([])
  const [saldo, setSaldo] = useState<Saldo | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<Transaksi[]>('/keuangan', 'GET')
        setItems(data)
        const s = await apiFetch<Saldo>('/keuangan/saldo', 'GET')
        setSaldo(s)
      } catch (e) {
        console.error('Failed to fetch keuangan', e)
      }
    }
    load()
  }, [])

  const columns = [
    { key: 'tanggal', header: 'Tanggal' },
    { key: 'jenis', header: 'Jenis' },
    { key: 'nominal', header: 'Nominal' },
    { key: 'keterangan', header: 'Keterangan' },
  ] as const

  const chartData = items.map((i, idx) => ({ x: idx + 1, y: i.nominal * (i.jenis === 'debit' ? 1 : -1) }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Keuangan</h2>
        <div className="text-brand font-semibold">Total Saldo: {saldo?.total ?? '-'}</div>
      </div>
      <Card title="Grafik Keuangan">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="x" hide />
              <YAxis hide />
              <Area type="monotone" dataKey="y" stroke="#1ABC9C" fill="#1ABC9C" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <Table columns={columns as any} data={items} />
      </Card>
    </div>
  )
}