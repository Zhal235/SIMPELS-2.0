import { useState, useEffect } from 'react'
import api from '../../api/index'
import { Download, Printer } from 'lucide-react'

interface BukuKas {
  id: number
  nama_kas: string
  saldo_cash_awal: number
  saldo_bank_awal: number
}

interface KasMutasi {
  buku_kas: BukuKas
  saldo_awal_cash: number
  saldo_awal_bank: number
  mutasi_masuk_cash: number
  mutasi_masuk_bank: number
  mutasi_keluar_cash: number
  mutasi_keluar_bank: number
  saldo_akhir_cash: number
  saldo_akhir_bank: number
  total_saldo_akhir: number
}

export default function LaporanPerBukuKas() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<KasMutasi[]>([])
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
      // Fetch all buku kas
      const bukuKasRes = await api.get('/v1/keuangan/buku-kas')
      const bukuKasList: BukuKas[] = bukuKasRes.data.data

      // Fetch transaksi for each buku kas
      const kasData: KasMutasi[] = await Promise.all(
        bukuKasList.map(async (kas) => {
          const transaksiRes = await api.get('/v1/keuangan/transaksi-kas', {
            params: {
              buku_kas_id: kas.id,
              start_date: range.start,
              end_date: range.end
            }
          })

          const transaksi = transaksiRes.data.data || []
          
          // Calculate mutations - EXCLUDE Transfer Internal
          let mutasi_masuk_cash = 0
          let mutasi_masuk_bank = 0
          let mutasi_keluar_cash = 0
          let mutasi_keluar_bank = 0

          transaksi.forEach((t: any) => {
            // Skip Transfer Internal (perpindahan Bank ↔ Cash dalam 1 buku kas)
            if (t.kategori && t.kategori.includes('Transfer Internal')) {
              return // Skip this transaction
            }
            
            const nominal = parseFloat(t.nominal || 0)
            const isMasuk = t.jenis === 'pemasukan'
            const isCash = t.metode === 'cash' || t.metode === 'tunai'

            if (isMasuk) {
              if (isCash) mutasi_masuk_cash += nominal
              else mutasi_masuk_bank += nominal
            } else {
              if (isCash) mutasi_keluar_cash += nominal
              else mutasi_keluar_bank += nominal
            }
          })

          const saldo_awal_cash = parseFloat((kas.saldo_cash_awal || 0).toString())
          const saldo_awal_bank = parseFloat((kas.saldo_bank_awal || 0).toString())
          const saldo_akhir_cash = saldo_awal_cash + mutasi_masuk_cash - mutasi_keluar_cash
          const saldo_akhir_bank = saldo_awal_bank + mutasi_masuk_bank - mutasi_keluar_bank

          return {
            buku_kas: kas,
            saldo_awal_cash,
            saldo_awal_bank,
            mutasi_masuk_cash,
            mutasi_masuk_bank,
            mutasi_keluar_cash,
            mutasi_keluar_bank,
            saldo_akhir_cash,
            saldo_akhir_bank,
            total_saldo_akhir: saldo_akhir_cash + saldo_akhir_bank
          }
        })
      )

      setData(kasData)
    } catch (error) {
      setData([])
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

  const getTotalSaldo = () => {
    return data.reduce((sum, kas) => sum + kas.total_saldo_akhir, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Per Buku Kas</h1>
          <p className="text-gray-600 mt-1">Saldo dan mutasi kas per buku kas</p>
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
      ) : data.length > 0 ? (
        <div className="space-y-4">
          {data.map((kas) => (
            <div key={kas.buku_kas.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
                <h3 className="text-lg font-semibold text-white">{kas.buku_kas.nama_kas}</h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kas Tunai */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 pb-2 border-b-2 border-blue-200">
                      💵 KAS TUNAI (CASH)
                    </h4>
                    <div className="space-y-2 ml-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saldo Awal</span>
                        <span className="font-medium">{formatCurrency(kas.saldo_awal_cash)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Mutasi Masuk (+)</span>
                        <span className="font-medium">{formatCurrency(kas.mutasi_masuk_cash)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Mutasi Keluar (-)</span>
                        <span className="font-medium">{formatCurrency(kas.mutasi_keluar_cash)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-blue-600 pt-2 border-t-2 border-gray-200">
                        <span>Saldo Akhir</span>
                        <span>{formatCurrency(kas.saldo_akhir_cash)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kas Bank */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 pb-2 border-b-2 border-green-200">
                      🏦 KAS BANK (TRANSFER)
                    </h4>
                    <div className="space-y-2 ml-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saldo Awal</span>
                        <span className="font-medium">{formatCurrency(kas.saldo_awal_bank)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Mutasi Masuk (+)</span>
                        <span className="font-medium">{formatCurrency(kas.mutasi_masuk_bank)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Mutasi Keluar (-)</span>
                        <span className="font-medium">{formatCurrency(kas.mutasi_keluar_bank)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-green-600 pt-2 border-t-2 border-gray-200">
                        <span>Saldo Akhir</span>
                        <span>{formatCurrency(kas.saldo_akhir_bank)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Saldo */}
                <div className="mt-6 pt-4 border-t-4 border-gray-900">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">TOTAL SALDO AKHIR</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(kas.total_saldo_akhir)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-white">TOTAL SELURUH KAS</span>
              <span className="text-3xl font-bold text-white">
                {formatCurrency(getTotalSaldo())}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Tidak ada data buku kas</p>
        </div>
      )}
    </div>
  )
}
