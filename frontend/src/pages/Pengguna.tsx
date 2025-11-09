import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Table from '../components/Table'
import { apiFetch } from '../api'

type UserRow = { name: string; role: string; email: string }

export default function Pengguna() {
  const [rows, setRows] = useState<UserRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<UserRow[]>('/user', 'GET')
        setRows(data)
      } catch (e) {
        console.error('Failed to fetch users', e)
      }
    }
    load()
  }, [])

  const columns = [
    { key: 'name', header: 'Nama' },
    { key: 'role', header: 'Role' },
    { key: 'email', header: 'Email' },
  ] as const

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pengguna</h2>
      <Card>
        <Table columns={columns as any} data={rows} />
      </Card>
    </div>
  )
}