import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { apiFetch } from '../api'

type SantriRow = {
  nama: string
  nis: string
  kelas: string
  dompet: number
  status: string
}

export default function Santri() {
  const [rows, setRows] = useState<SantriRow[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<SantriRow[]>('/santri', 'GET')
        setRows(data)
      } catch (e) {
        console.error('Failed to fetch santri', e)
      }
    }
    load()
  }, [])

  const columns = [
    { key: 'nama', header: 'Nama' },
    { key: 'nis', header: 'NIS' },
    { key: 'kelas', header: 'Kelas' },
    { key: 'dompet', header: 'Dompet (saldo)' },
    { key: 'status', header: 'Status' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Data Santri</h2>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>Tambah Santri</button>
      </div>
      <Card>
        <Table columns={columns as any} data={rows} />
      </Card>
      <Modal open={open} title="Tambah Santri" onClose={() => setOpen(false)}>
        {/* Form CRUD placeholder */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input className="rounded-md border px-3 py-2" placeholder="Nama" />
          <input className="rounded-md border px-3 py-2" placeholder="NIS" />
          <input className="rounded-md border px-3 py-2" placeholder="Kelas" />
          <input className="rounded-md border px-3 py-2" placeholder="Dompet" />
        </div>
      </Modal>
    </div>
  )
}