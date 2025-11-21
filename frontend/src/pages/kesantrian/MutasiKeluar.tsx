import Card from '../../components/Card'
import { useEffect, useState } from 'react'
import { listMutasiKeluar } from '../../api/mutasiKeluar'

export default function MutasiKeluar() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await listMutasiKeluar()
        const data = Array.isArray(res) ? res : (res?.data || [])
        setItems(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Mutasi Keluar</h1>
      <Card title="Daftar Mutasi Keluar">
        {loading ? (
          <div>Memuat...</div>
        ) : items.length === 0 ? (
          <div>Tidak ada mutasi keluar</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mutasi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m: any, idx: number) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4">{m.santri?.nama_santri}</td>
                    <td className="px-6 py-4">{m.tanggal_mutasi}</td>
                    <td className="px-6 py-4">{m.tujuan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}