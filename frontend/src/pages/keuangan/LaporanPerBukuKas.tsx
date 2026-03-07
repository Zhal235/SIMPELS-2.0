import { useState, useEffect } from 'react'
import api from '../../api/index'
import { Download, Printer } from 'lucide-react'
import { exportToExcel } from '../../utils/exportExcel'
import { printPerBukuKas } from '../../utils/printLaporan'
import { useInstansiSetting } from '../../hooks/useInstansiSetting'
import BukuKasCard from '../../components/keuangan/BukuKasCard'

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
  const { setting } = useInstansiSetting()
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

  const calcNetMutasi = (transaksi: any[], excludeTI: boolean) => {
    let cash_in = 0, cash_out = 0, bank_in = 0, bank_out = 0
    transaksi.forEach((t: any) => {
      if (excludeTI && t.kategori && t.kategori.includes('Transfer Internal')) return
      const nominal = parseFloat(t.nominal || 0)
      const isMasuk = t.jenis === 'pemasukan'
      const isCash = t.metode === 'cash' || t.metode === 'tunai'
      if (isMasuk) { if (isCash) cash_in += nominal; else bank_in += nominal }
      else { if (isCash) cash_out += nominal; else bank_out += nominal }
    })
    return { cash_in, cash_out, bank_in, bank_out }
  }

  const fetchData = async () => {
    const range = getDateRange()
    if (!range) return

    setLoading(true)
    try {
      const bukuKasRes = await api.get('/v1/keuangan/buku-kas')
      const bukuKasList: BukuKas[] = bukuKasRes.data.data

      const prevEndDate = (() => {
        const d = new Date(range.start)
        d.setDate(d.getDate() - 1)
        return d.toISOString().split('T')[0]
      })()

      const kasData: KasMutasi[] = await Promise.all(
        bukuKasList.map(async (kas) => {
          const [transaksiRes, prevTransaksiRes] = await Promise.all([
            api.get('/v1/keuangan/transaksi-kas', {
              params: { buku_kas_id: kas.id, start_date: range.start, end_date: range.end }
            }),
            api.get('/v1/keuangan/transaksi-kas', {
              params: { buku_kas_id: kas.id, end_date: prevEndDate }
            })
          ])

          const transaksi = transaksiRes.data.data || []
          const prevTransaksi = prevTransaksiRes.data.data || []

          const prev = calcNetMutasi(prevTransaksi, true)
          const saldo_awal_cash = (kas.saldo_cash_awal || 0) + prev.cash_in - prev.cash_out
          const saldo_awal_bank = (kas.saldo_bank_awal || 0) + prev.bank_in - prev.bank_out

          const period = calcNetMutasi(transaksi, true)
          const saldo_akhir_cash = saldo_awal_cash + period.cash_in - period.cash_out
          const saldo_akhir_bank = saldo_awal_bank + period.bank_in - period.bank_out

          return {
            buku_kas: kas,
            saldo_awal_cash,
            saldo_awal_bank,
            mutasi_masuk_cash: period.cash_in,
            mutasi_masuk_bank: period.bank_in,
            mutasi_keluar_cash: period.cash_out,
            mutasi_keluar_bank: period.bank_out,
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

  const handlePrint = () => {
    const range = getDateRange()
    const periodeStr = range ? `${range.start} s/d ${range.end}` : ''
    printPerBukuKas(data, periodeStr, { namaYayasan: setting?.nama_yayasan, namaPesantren: setting?.nama_pesantren, kopSuratUrl: setting?.kop_surat_url })
  }

  const handleExportExcel = () => {
    const rows = data.map((kas, i) => ({
      no: i + 1,
      nama_kas: kas.buku_kas.nama_kas,
      saldo_awal_cash: kas.saldo_awal_cash,
      saldo_awal_bank: kas.saldo_awal_bank,
      masuk_cash: kas.mutasi_masuk_cash,
      masuk_bank: kas.mutasi_masuk_bank,
      keluar_cash: kas.mutasi_keluar_cash,
      keluar_bank: kas.mutasi_keluar_bank,
      akhir_cash: kas.saldo_akhir_cash,
      akhir_bank: kas.saldo_akhir_bank,
      total: kas.total_saldo_akhir,
    }))
    exportToExcel(rows, {
      no: 'No',
      nama_kas: 'Nama Buku Kas',
      saldo_awal_cash: 'Saldo Awal Cash (Rp)',
      saldo_awal_bank: 'Saldo Awal Bank (Rp)',
      masuk_cash: 'Masuk Cash (Rp)',
      masuk_bank: 'Masuk Bank (Rp)',
      keluar_cash: 'Keluar Cash (Rp)',
      keluar_bank: 'Keluar Bank (Rp)',
      akhir_cash: 'Saldo Akhir Cash (Rp)',
      akhir_bank: 'Saldo Akhir Bank (Rp)',
      total: 'Total Saldo (Rp)',
    }, `laporan-per-buku-kas-${new Date().toISOString().split('T')[0]}`, 'Per Buku Kas')
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
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
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
            <BukuKasCard key={kas.buku_kas.id} kas={kas} formatCurrency={formatCurrency} />
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
