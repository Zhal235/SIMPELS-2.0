import { useState, useEffect, Fragment } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'

interface TagihanItem {
  id: number
  jenis_tagihan: { nama_tagihan: string }
  bulan: string
  tahun: number
  nominal: number
  dibayar: number
  sisa: number
  status: string
}

export interface SantriGroup {
  santri_id: string
  nama: string
  nis: string
  kelas: string
  tagihan: TagihanItem[]
  total_tagihan: number
  total_dibayar: number
  total_sisa: number
}

interface Props {
  groups: SantriGroup[]
  bulanOptions: Array<{ value: string; label: string }>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

const statusConfig: Record<string, { cls: string; label: string }> = {
  lunas: { cls: 'bg-green-100 text-green-800', label: 'Lunas' },
  belum_bayar: { cls: 'bg-red-100 text-red-800', label: 'Belum Bayar' },
  sebagian: { cls: 'bg-yellow-100 text-yellow-800', label: 'Cicilan' },
}

export default function TagihanSantriTable({ groups, bulanOptions }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { setPage(1); setExpanded(new Set()) }, [groups])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getBulanLabel = (bulan: string) =>
    bulanOptions.find(b => b.value === bulan)?.label || bulan

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada data tagihan untuk periode ini</p>
      </div>
    )
  }

  const totalPages = Math.ceil(groups.length / pageSize)
  const pagedGroups = groups.slice((page - 1) * pageSize, page * pageSize)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, groups.length)

  const pageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jml</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tagihan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Dibayar</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Sisa</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagedGroups.map((group) => {
              const isExpanded = expanded.has(group.santri_id)
              const lunas = group.tagihan.filter(t => t.status === 'lunas').length
              const sebagian = group.tagihan.filter(t => t.status === 'sebagian').length
              const belum = group.tagihan.filter(t => t.status === 'belum_bayar').length
              return (
                <Fragment key={group.santri_id}>
                  <tr className="hover:bg-blue-50 cursor-pointer" onClick={() => toggle(group.santri_id)}>
                    <td className="px-4 py-3 text-gray-400">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{group.nama}</div>
                      <div className="text-xs text-gray-500">NIS: {group.nis}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{group.kelas || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-700">{group.tagihan.length}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(group.total_tagihan)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(group.total_dibayar)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatCurrency(group.total_sisa)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {lunas > 0 && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">{lunas} lunas</span>}
                        {sebagian > 0 && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">{sebagian} cicilan</span>}
                        {belum > 0 && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">{belum} belum</span>}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && group.tagihan.map((t) => (
                    <tr key={`d-${t.id}`} className="bg-blue-50/40">
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 pl-8 text-sm text-gray-700" colSpan={2}>{t.jenis_tagihan.nama_tagihan}</td>
                      <td className="px-4 py-2 text-sm text-center text-gray-600">{getBulanLabel(t.bulan)} {t.tahun}</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700">{formatCurrency(t.nominal)}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(t.dibayar)}</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(t.sisa)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[t.status]?.cls || 'bg-gray-100 text-gray-800'}`}>
                          {statusConfig[t.status]?.label || t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>dari <strong>{groups.length}</strong> santri &nbsp;|&nbsp; {from}-{to}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers().map((n, i) =>
            n === '...'
              ? <span key={`e-${i}`} className="px-2 text-gray-400">-</span>
              : <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] h-8 rounded text-sm font-medium ${page === n ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
                >
                  {n}
                </button>
          )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
