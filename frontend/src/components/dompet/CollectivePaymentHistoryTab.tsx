import React, { useEffect, useState } from 'react'
import Card from '../Card'
import Table from '../Table'
import { buildCollectivePaymentHistoryColumns } from './collectivePaymentHistoryColumns'
import { getCollectivePaymentHistorySummary, listCollectivePaymentsByMonth } from '../../api/wallet'
import toast from 'react-hot-toast'

type Props = {
  refreshKey: number
  onPreview: (payment: any) => void
  onDelete: (id: number) => void
}

export default function CollectivePaymentHistoryTab({ refreshKey, onPreview, onDelete }: Props) {
  const [payments, setPayments] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [historyTree, setHistoryTree] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number; label: string } | null>(null)
  const [historyMeta, setHistoryMeta] = useState<any>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const historyColumns = buildCollectivePaymentHistoryColumns({
    onPreview,
    onDelete,
  })

  useEffect(() => {
    loadSummary()
  }, [refreshKey])

  useEffect(() => {
    if (selectedPeriod) {
      loadByMonth(selectedPeriod.year, selectedPeriod.month, historyPage)
    }
  }, [selectedPeriod, historyPage])

  async function loadSummary() {
    try {
      setLoading(true)
      const res = await getCollectivePaymentHistorySummary()
      if (res.success) {
        const recent = res.data?.recent || []
        const years = [...(res.data?.years || [])].sort((a, b) => Number(b.year) - Number(a.year))
        setRecentPayments(recent)
        setHistoryTree(years)
        setSelectedYear(years.length > 0 ? Number(years[0].year) : null)
        const firstMonth = years?.[0]?.months?.[0]
        if (firstMonth) {
          setSelectedPeriod(prev => {
            if (prev && prev.year === years[0].year && prev.month === firstMonth.month) {
              return prev
            }
            return { year: years[0].year, month: firstMonth.month, label: firstMonth.label }
          })
          setHistoryPage(1)
        } else {
          setSelectedPeriod(null)
          setPayments([])
          setHistoryMeta(null)
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat ringkasan history')
    } finally {
      setLoading(false)
    }
  }

  async function loadByMonth(year: number, month: number, page = 1) {
    try {
      setLoading(true)
      const res = await listCollectivePaymentsByMonth({ year, month, page, per_page: 25 })
      if (res.success) {
        setPayments(res.data || [])
        setHistoryMeta(res.meta || null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat history bulan terpilih')
    } finally {
      setLoading(false)
    }
  }

  function selectPeriod(year: number, month: number, label: string) {
    setSelectedPeriod({ year, month, label })
    setHistoryPage(1)
  }

  function handleYearChange(value: string) {
    const year = Number(value)
    setSelectedYear(year)
    const yearItem = historyTree.find((item: any) => Number(item.year) === year)
    const firstMonth = yearItem?.months?.[0]
    if (firstMonth) {
      selectPeriod(year, firstMonth.month, firstMonth.label)
    }
  }

  const activeYearItem = historyTree.find((item: any) => Number(item.year) === Number(selectedYear))

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Recent (5 Terbaru)</h3>
          {recentPayments.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada data tagihan</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {recentPayments.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onPreview(item)}
                  className="text-left border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="font-semibold truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                  <div className="text-xs mt-2">✅ {item.paid_count} | ⏳ {item.pending_count}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-3">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Explorer</h3>
            {historyTree.length === 0 ? (
              <div className="text-sm text-gray-500">Tidak ada history</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tahun</label>
                  <select
                    className="input"
                    value={selectedYear ?? ''}
                    onChange={e => handleYearChange(e.target.value)}
                  >
                    {historyTree.map((yearItem: any) => (
                      <option key={yearItem.year} value={yearItem.year}>
                        {yearItem.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border rounded-lg p-2 space-y-1">
                  {(activeYearItem?.months || []).map((monthItem: any) => {
                    const active = selectedPeriod?.year === activeYearItem.year && selectedPeriod?.month === monthItem.month
                    return (
                      <button
                        key={`${activeYearItem.year}-${monthItem.month}`}
                        onClick={() => selectPeriod(activeYearItem.year, monthItem.month, monthItem.label)}
                        className={`w-full text-left text-sm px-2 py-1 rounded ${
                          active ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {monthItem.label} ({monthItem.total})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-9">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedPeriod ? `History ${selectedPeriod.label} ${selectedPeriod.year}` : 'History'}
              </h3>
              {historyMeta && <div className="text-sm text-gray-500">Total {historyMeta.total || 0}</div>}
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <Table columns={historyColumns} data={payments} />
                {historyMeta && historyMeta.last_page > 1 && (
                  <div className="flex justify-end items-center gap-2 pt-2">
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      disabled={historyPage <= 1}
                      className="btn btn-sm"
                    >
                      Prev
                    </button>
                    <span className="text-sm">{historyPage} / {historyMeta.last_page}</span>
                    <button
                      onClick={() => setHistoryPage(prev => Math.min(historyMeta.last_page, prev + 1))}
                      disabled={historyPage >= historyMeta.last_page}
                      className="btn btn-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
