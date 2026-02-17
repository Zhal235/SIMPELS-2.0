import { useState, useEffect } from 'react'
import api from '../../api/index'
import { Download, Printer } from 'lucide-react'

interface IncomeStatementData {
  period: string
  pendapatan: {
    operasional: Array<{ nama: string; jumlah: number }>
    non_operasional: Array<{ nama: string; jumlah: number }>
    total: number
  }
  beban: {
    operasional: Array<{ nama: string; jumlah: number }>
    non_operasional: Array<{ nama: string; jumlah: number }>
    total: number
  }
  laba_rugi: number
}

export default function LaporanLabaRugi() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<IncomeStatementData | null>(null)
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

      // Map expenses to operational categories
      const bebanOperasional = expenses.map((e: any) => ({
        nama: e.kategori_name || e.kategori || 'Lain-lain',
        jumlah: parseFloat(e.total)
      }))

      // Map receipts to categories
      const pendapatanOperasional = summary.receipts_breakdown 
        ? Object.entries(summary.receipts_breakdown).map(([name, amount]) => ({
            nama: name,
            jumlah: Number(amount)
          }))
        : [{ nama: 'Penerimaan', jumlah: summary.total_receipts }]

      setData({
        period: `${range.start} s/d ${range.end}`,
        pendapatan: {
          operasional: pendapatanOperasional,
          non_operasional: [],
          total: summary.total_receipts
        },
        beban: {
          operasional: bebanOperasional,
          non_operasional: [],
          total: summary.total_expenses
        },
        laba_rugi: summary.net
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
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Aktivitas Keuangan</h1>
          <p className="text-gray-600 mt-1">Activity Report - Standar Akuntansi Pesantren (ISAK 35)</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
            <Download className="h-4 w-4" />
            Export PDF
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
            <h2 className="text-xl font-bold text-center text-gray-900">LAPORAN AKTIVITAS KEUANGAN</h2>
            <h3 className="text-lg text-center text-gray-700 mt-1">YAYASAN PONDOK PESANTREN</h3>
            <p className="text-center text-gray-600 mt-1">Periode: {data.period}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* PENDAPATAN */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">PENERIMAAN</h3>
              
              {/* Pendapatan Operasional */}
              <div className="ml-4">
                <h4 className="font-medium text-gray-800 mb-2">Penerimaan dari Santri & Lainnya:</h4>
                <div className="ml-4 space-y-1">
                  {data.pendapatan.operasional.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-gray-700">{item.nama}</span>
                      <span className="font-medium">{formatCurrency(item.jumlah)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendapatan Non-Operasional */}
              {data.pendapatan.non_operasional.length > 0 && (
                <div className="ml-4 mt-3">
                  <h4 className="font-medium text-gray-800 mb-2">Penerimaan Lain-lain:</h4>
                  <div className="ml-4 space-y-1">
                    {data.pendapatan.non_operasional.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-700">{item.nama}</span>
                        <span className="font-medium">{formatCurrency(item.jumlah)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 mt-3 border-t-2 border-gray-300 font-semibold">
                <span className="text-gray-900">Total Penerimaan</span>
                <span className="text-green-600">{formatCurrency(data.pendapatan.total)}</span>
              </div>
            </div>

            {/* BEBAN */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">PENGELUARAN</h3>
              
              {/* Beban Operasional */}
              <div className="ml-4">
                <h4 className="font-medium text-gray-800 mb-2">Pengeluaran Operasional:</h4>
                <div className="ml-4 space-y-1">
                  {data.beban.operasional.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="text-gray-700">{item.nama}</span>
                      <span className="font-medium">{formatCurrency(item.jumlah)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beban Non-Operasional */}
              {data.beban.non_operasional.length > 0 && (
                <div className="ml-4 mt-3">
                  <h4 className="font-medium text-gray-800 mb-2">Pengeluaran Lain-lain:</h4>
                  <div className="ml-4 space-y-1">
                    {data.beban.non_operasional.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-700">{item.nama}</span>
                        <span className="font-medium">{formatCurrency(item.jumlah)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 mt-3 border-t-2 border-gray-300 font-semibold">
                <span className="text-gray-900">Total Pengeluaran</span>
                <span className="text-red-600">{formatCurrency(data.beban.total)}</span>
              </div>
            </div>

            {/* SURPLUS/DEFISIT */}
            <div className="border-t-4 border-gray-900 pt-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {data.laba_rugi >= 0 ? 'SURPLUS' : 'DEFISIT'}
                  </span>
                  <span className={`text-2xl font-bold ${data.laba_rugi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(data.laba_rugi))}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">Catatan:</h4>
              <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                <li>Laporan ini disusun berdasarkan metode kas/akrual sesuai kebutuhan.</li>
                <li>Penerimaan mencakup seluruh pemasukan dari santri dan sumber lainnya.</li>
                <li>Pengeluaran mencakup seluruh beban operasional pesantren.</li>
                <li>
                  {data.laba_rugi >= 0 
                    ? 'Surplus menunjukkan penerimaan melebihi pengeluaran pada periode ini.' 
                    : 'Defisit menunjukkan pengeluaran melebihi penerimaan, evaluasi anggaran diperlukan.'}
                </li>
              </ul>
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

