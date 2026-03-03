import Card from '../../../components/Card'
import Table from '../../../components/Table'

interface Props {
  loading: boolean
  items: any[]
  filteredItems: any[]
  columns: any[]
  searchQuery: string
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  getRowKey: (row: any, idx: number) => string
}

export default function SantriTable({ loading, items, filteredItems, columns, searchQuery, currentPage, pageSize, totalItems, onPageChange, onPageSizeChange, getRowKey }: Props) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (loading && items.length === 0) return <Card><div className="p-4 text-sm text-gray-500">Memuat data…</div></Card>
  if (!items || items.length === 0) return <Card><div className="p-4 text-sm text-gray-500">Belum ada data santri.</div></Card>
  if (filteredItems.length === 0) return <Card><div className="p-4 text-sm text-gray-500">Tidak ada data yang sesuai dengan pencarian "{searchQuery}"</div></Card>

  return (
    <Card>
      <Table columns={columns} data={filteredItems} getRowKey={getRowKey} />
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} data
            {searchQuery && ` (${filteredItems.length} hasil pencarian)`}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Per halaman:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            ← Prev
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => (
                <div key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                </div>
              ))}
          </div>
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Next →
          </button>
        </div>
      </div>
    </Card>
  )
}
