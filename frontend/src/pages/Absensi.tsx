import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'

type AbsensiRow = { nama: string; tanggal: string; status: string }

export default function Absensi() {
  const [rows, setRows] = useState<AbsensiRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<AbsensiRow[]>('/absensi', 'GET')
        setRows(data)
      } catch (e) {
        console.error('Failed to fetch absensi', e)
      }
    }
    load()
  }, [])

  const columns = [
    { key: 'nama', header: 'Nama' },
    { key: 'tanggal', header: 'Tanggal' },
    { key: 'status', header: 'Status' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Absensi</h2>
        <button className="btn btn-primary">Rekam Kehadiran (QR Dummy)</button>
      </div>
      <Card>
        <Table columns={columns as any} data={rows} />
      </Card>
    </div>
  )
}