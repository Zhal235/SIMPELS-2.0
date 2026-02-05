import { useState, useEffect } from 'react'
import api from '../../api/index'
import { Download, Printer } from 'lucide-react'

interface CashFlowData {
  period: string
  receipts: {
    pembayaran_santri: number
    lain_lain: number
    total: number
  }
  expenses: {
    by_category: Array<{
      kategori: string
      total: number
    }>
    total: number
  }
  net_cash_flow: number
}

export default function LaporanArusKas() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(false)

  const getDateRange = () => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (period) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        if (startDate && endDate) {
          return { start: startDate, end: endDate }
        }
        return null
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const fetchData = async () => {
    const range = getDateRange()
    if (!range) return

    setLoading(true)
    try {
      const [summaryRes, expensesRes] = await Promise.all([
        api.get('/v1/keuangan/reports/summary', {
          params: { start: range.start, end: range.end }
        }),
        api.get('/v1/keuangan/reports/expenses-by-category', {
          params: { start: range.start, end: range.end }
        })
      ])

      const summary = summaryRes.data.data
      const expenses = expensesRes.data.data

      setData({
        period: `${range.start} s/d ${range.end}`,
        receipts: {
          pembayaran_santri: summary.total_receipts,
          lain_lain: 0,
          total: summary.total_receipts
        },
        expenses: {
          by_category: expenses.map((e: any) => ({
            kategori: e.kategori_name || e.kategori || 'Lain-lain',
            total: parseFloat(e.total)
          })),
          total: summary.total_expenses
        },
        net_cash_flow: summary.net
      })
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, startDate, endDate])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Arus Kas</h1>
          <p className="text-gray-600 mt-1">Analisis arus kas masuk dan keluar</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Periode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kuartal
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex gap-2 items-center ml-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-2">Memuat data...</p>
        </div>
      ) : data ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-center text-gray-900">LAPORAN ARUS KAS</h2>
            <p className="text-center text-gray-600 mt-1">Periode: {data.period}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Arus Kas Masuk */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
                ARUS KAS MASUK (Penerimaan)
              </h3>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Pembayaran Santri</span>
                  <span className="font-medium">{formatCurrency(data.receipts.pembayaran_santri)}</span>
                </div>
                {data.receipts.lain_lain > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Penerimaan Lain-lain</span>
                    <span className="font-medium">{formatCurrency(data.receipts.lain_lain)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2">
                  <span className="font-semibold text-gray-900">Total Arus Kas Masuk</span>
                  <span className="font-bold text-green-600">{formatCurrency(data.receipts.total)}</span>
                </div>
              </div>
            </div>

            {/* Arus Kas Keluar */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-gray-300">
                ARUS KAS KELUAR (Pengeluaran)
              </h3>
              <div className="ml-4 space-y-2">
                {data.expenses.by_category.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <span className="text-gray-700">{item.kategori}</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 pt-2">
                  <span className="font-semibold text-gray-900">Total Arus Kas Keluar</span>
                  <span className="font-bold text-red-600">{formatCurrency(data.expenses.total)}</span>
                </div>
              </div>
            </div>

            {/* Net Cash Flow */}
            <div className="border-t-4 border-gray-900 pt-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <span className="text-xl font-bold text-gray-900">ARUS KAS BERSIH</span>
                <span className={`text-2xl font-bold ${data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.net_cash_flow)}
                </span>
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Analisis:</h4>
              <p className="text-sm text-blue-800">
                {data.net_cash_flow >= 0 ? (
                  <>
                    Arus kas bersih periode ini menunjukkan <span className="font-semibold">surplus sebesar {formatCurrency(data.net_cash_flow)}</span>. 
                    Kondisi keuangan dalam keadaan baik dengan penerimaan melebihi pengeluaran.
                  </>
                ) : (
                  <>
                    Arus kas bersih periode ini menunjukkan <span className="font-semibold">defisit sebesar {formatCurrency(Math.abs(data.net_cash_flow))}</span>. 
                    Perlu dilakukan evaluasi pengeluaran atau meningkatkan penerimaan.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Tidak ada data untuk periode yang dipilih</p>
        </div>
      )}
    </div>
  )
}
