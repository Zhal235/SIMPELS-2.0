import { useState, useEffect } from 'react'
import { BookOpen, Printer, Calendar, TrendingUp, DollarSign, FileText } from 'lucide-react'
import api from '../../api/index'
import { useInstansiSetting } from '../../hooks/useInstansiSetting'
import toast from 'react-hot-toast'

interface FinancialData {
  summary: {
    total_receipts: number
    total_expenses: number
    net: number
    receipts_breakdown: Record<string, number>
  }
  bukuKas: Array<{
    buku_kas: { nama_kas: string }
    total_saldo_akhir: number
    saldo_akhir_cash: number
    saldo_akhir_bank: number
  }>
  expensesByCategory: Array<{
    kategori_name: string
    total: number
  }>
  santriMetrics: {
    total_tagihan: number
    total_dibayar: number
    total_tunggakan: number
    persentase_pembayaran: number
  }
  crossPeriodPayments: Array<{
    bulan: string
    tahun: string
    jenisTagihan: string
    total: number
  }>
}

export default function LaporanKeuanganLengkap() {
  const { setting } = useInstansiSetting()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(false)

  const getDateRange = () => {
    // Gunakan zona waktu WIB (UTC+7) langsung dari Date constructor
    const now = new Date()
    let start: Date, end: Date

    switch (period) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1) // Tanggal 1 bulan ini
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Tanggal terakhir bulan ini
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      case 'custom':
        if (startDate && endDate) {
          return { start: startDate, end: endDate }
        }
        return null
    }

    return {
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    }
  }

  const fetchData = async () => {
    const range = getDateRange()
    if (!range) return

    setLoading(true)
    try {
      const [summaryRes, bukuKasRes, expensesRes] = await Promise.all([
        api.get('/v1/keuangan/reports/summary', { params: { start: range.start, end: range.end } }),
        api.get('/v1/keuangan/buku-kas'),
        api.get('/v1/keuangan/reports/expenses-by-category', { params: { start: range.start, end: range.end } }),
      ])

      // Generate semua bulan dalam rentang period, lalu fetch tagihan per bulan
      const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
      const startD = new Date(range.start)
      const endD = new Date(range.end)
      const monthPairs: { bulan: string; tahun: number }[] = []
      const cur = new Date(startD.getFullYear(), startD.getMonth(), 1)
      while (cur <= endD) {
        monthPairs.push({ bulan: NAMA_BULAN[cur.getMonth()], tahun: cur.getFullYear() })
        cur.setMonth(cur.getMonth() + 1)
      }
      const tagihanResponses = await Promise.all(
        monthPairs.map(mp => api.get('/dashboard/tagihan-summary', { params: { bulan: mp.bulan, tahun: mp.tahun } }))
      )
      const allTagihanRows = tagihanResponses.flatMap(r => r.data.data || [])

      // Gunakan saldo_cash dan saldo_bank langsung dari API buku kas
      // Backend sudah menghitung dengan benar: saldo_awal + semua transaksi + Transfer Internal
      const bukuKasList = bukuKasRes.data.data || []
      const bukuKasData = bukuKasList.map((kas: any) => ({
        buku_kas: kas,
        saldo_akhir_cash: parseFloat(kas.saldo_cash || 0),
        saldo_akhir_bank: parseFloat(kas.saldo_bank || 0),
        total_saldo_akhir: parseFloat(kas.total_saldo || 0),
      }))

      // Calculate santri payment metrics from all tagihan (akumulatif)
      const santriData: any[] = allTagihanRows
      const totalTagihan = santriData.reduce((sum: number, item: any) => sum + (item.totalNominal || 0), 0)
      const totalDibayar = santriData.reduce((sum: number, item: any) => sum + (item.totalDibayar || 0), 0)
      const totalTunggakan = santriData.reduce((sum: number, item: any) => sum + (item.totalSisa || 0), 0)
      const persentasePembayaran = totalTagihan > 0 ? (totalDibayar / totalTagihan) * 100 : 0

      const pembayaranRes = await api.get('/v1/keuangan/pembayaran', {
        params: { start_date: range.start, end_date: range.end }
      })
      const pembayaranList = pembayaranRes.data.data || []
      const crossMap = new Map<string, { bulan: string; tahun: string; jenisTagihan: string; total: number }>()
      for (const p of pembayaranList) {
        const tag = p.tagihan_santri
        if (!tag || !tag.jenis_tagihan) continue
        const key = `${tag.jenis_tagihan.nama_tagihan}-${tag.bulan}-${tag.tahun}`
        if (!crossMap.has(key)) crossMap.set(key, { bulan: tag.bulan, tahun: String(tag.tahun), jenisTagihan: tag.jenis_tagihan.nama_tagihan, total: 0 })
        crossMap.get(key)!.total += parseFloat(p.nominal_bayar || 0)
      }
      const crossPeriodPayments = Array.from(crossMap.values()).sort((a, b) => {
        if (a.tahun !== b.tahun) return Number(a.tahun) - Number(b.tahun)
        const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
        return BULAN.indexOf(a.bulan) - BULAN.indexOf(b.bulan)
      })

      setData({
        summary: summaryRes.data.data,
        bukuKas: bukuKasData,
        expensesByCategory: expensesRes.data.data || [],
        santriMetrics: {
          total_tagihan: totalTagihan,
          total_dibayar: totalDibayar,
          total_tunggakan: totalTunggakan,
          persentase_pembayaran: persentasePembayaran
        },
        crossPeriodPayments,
      })
    } catch (error) {
      toast.error('Gagal memuat data laporan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, startDate, endDate])

  const formatRp = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

  const getPeriodeLabel = () => {
    const range = getDateRange()
    if (!range) return ''
    
    const startLabel = new Date(range.start).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const endLabel = new Date(range.end).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    return `${startLabel} s/d ${endLabel}`
  }

  const handlePrint = () => {
    if (!data) return
    printLaporanKeuanganLengkap(data, getPeriodeLabel(), data.crossPeriodPayments, {
      namaYayasan: setting?.nama_yayasan,
      namaPesantren: setting?.nama_pesantren,
      kopSuratUrl: setting?.kop_surat_url
    })
  }

  const totalKas = data?.bukuKas.reduce((sum, kas) => sum + kas.total_saldo_akhir, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <BookOpen className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Laporan Keuangan Lengkap</h1>
            <p className="text-gray-600 mt-1">Laporan keuangan komprehensif format profesional</p>
          </div>
        </div>
        {data && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            <Printer className="h-5 w-5" />
            Cetak Laporan
          </button>
        )}
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Pilih Periode Laporan:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'month' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'quarter' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kuartal Ini
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'year' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === 'custom' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex gap-3 items-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Dari Tanggal:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Sampai Tanggal:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {getPeriodeLabel() && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-800">
              <span className="font-medium">Periode Laporan:</span> {getPeriodeLabel()}
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-2">Memuat data laporan...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Ringkasan Keuangan</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Penerimaan</span>
                <span className="font-semibold text-green-600">{formatRp(data.summary.total_receipts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pengeluaran</span>
                <span className="font-semibold text-red-600">{formatRp(data.summary.total_expenses)}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-medium">Net Result</span>
                <span className={`font-bold ${data.summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRp(data.summary.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Santri Payment Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Tagihan & Pembayaran Santri</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tagihan</span>
                <span className="font-medium">{formatRp(data.santriMetrics.total_tagihan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Dibayar</span>
                <span className="font-medium text-green-600">{formatRp(data.santriMetrics.total_dibayar)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tunggakan</span>
                <span className="font-medium text-red-600">{formatRp(data.santriMetrics.total_tunggakan)}</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-medium">Persentase Terbayar</span>
                <span className={`font-bold ${data.santriMetrics.persentase_pembayaran >= 80 ? 'text-green-600' : data.santriMetrics.persentase_pembayaran >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {data.santriMetrics.persentase_pembayaran.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${data.santriMetrics.persentase_pembayaran >= 80 ? 'bg-green-500' : data.santriMetrics.persentase_pembayaran >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(data.santriMetrics.persentase_pembayaran, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Cash Position */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Posisi Kas</h3>
            </div>
            <div className="space-y-3">
              {data.bukuKas.slice(0, 3).map((kas, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{kas.buku_kas.nama_kas}</span>
                  <span className="font-medium">{formatRp(kas.total_saldo_akhir)}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between">
                <span className="font-medium">Total Kas</span>
                <span className="font-bold text-blue-600">{formatRp(totalKas)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Tunggakan: {formatRp(data.santriMetrics.total_tunggakan)}
              </div>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Top Pengeluaran</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.expensesByCategory.slice(0, 4).map((item, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1 truncate">{item.kategori_name}</div>
                  <div className="font-medium text-red-600">{formatRp(item.total)}</div>
                </div>
              ))}
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

// Print function for comprehensive financial report
function printLaporanKeuanganLengkap(
  data: FinancialData,
  periode: string,
  crossPeriodPayments: FinancialData['crossPeriodPayments'],
  instansi: { namaYayasan?: string; namaPesantren?: string; kopSuratUrl?: string | null }
) {
  const formatRp = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
  
  const buildHeader = (title: string) => {
    if (instansi.kopSuratUrl) {
      return `
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
          <img src="${instansi.kopSuratUrl}" alt="Kop Surat" style="max-height: 80px; width: 100%; object-fit: contain; margin-bottom: 8px;"/>
          <h1 style="font-size: 16pt; font-weight: bold; margin: 8px 0;">${title}</h1>
          <p style="font-size: 11pt; color: #333;">Periode: ${periode}</p>
        </div>
      `
    }
    return `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
        <div style="font-size: 10pt; color: #444;">${instansi.namaYayasan || ''}</div>
        <div style="font-size: 14pt; font-weight: bold; margin: 3px 0;">${instansi.namaPesantren || ''}</div>
        <h1 style="font-size: 16pt; font-weight: bold; margin: 8px 0; letter-spacing: 1px;">${title}</h1>
        <p style="font-size: 11pt; color: #333;">Periode: ${periode}</p>
      </div>
    `
  }

  const totalKas = data.bukuKas.reduce((s, k) => s + k.total_saldo_akhir, 0)
  const isPositif = data.summary.net >= 0

  const receiptsBreakdown = Object.entries(data.summary.receipts_breakdown || {})
    .map(([k, v]) => `<div style="display: flex; justify-content: space-between; padding: 4px 20px;"><span>${k}</span><span>${formatRp(v)}</span></div>`)
    .join('')

  const expensesBreakdown = data.expensesByCategory
    .map(e => `<div style="display: flex; justify-content: space-between; padding: 4px 20px;"><span>${e.kategori_name}</span><span>${formatRp(e.total)}</span></div>`)
    .join('')

  const kasBreakdown = data.bukuKas
    .map(k => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">${k.buku_kas.nama_kas}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatRp(k.saldo_akhir_cash)}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatRp(k.saldo_akhir_bank)}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">${formatRp(k.total_saldo_akhir)}</td>
      </tr>
    `)
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Keuangan Lengkap</title>
      <style>
        @page { size: A4 portrait; margin: 18mm 20mm 18mm 20mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #000; background: #fff; line-height: 1.4; }
        h1 { font-size: 16pt; font-weight: bold; }
        h2 { font-size: 13pt; font-weight: bold; margin: 16px 0 10px 0; }
        h3 { font-size: 12pt; font-weight: bold; margin: 12px 0 8px 0; }
        .page-break { page-break-before: always; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12pt; font-weight: bold; border-bottom: 2px solid #333; padding: 4px 0 6px 0; margin-bottom: 12px; }
        .subsection-title { font-size: 11pt; font-weight: bold; margin: 10px 0 6px 0; color: #333; }
        .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .row.indent { padding-left: 20px; }
        .row.total { border-top: 1.5px solid #333; margin-top: 6px; padding: 7px 0 5px 0; font-weight: bold; }
        .row.grand-total { border-top: 2px double #000; border-bottom: 2px double #000; padding: 8px 0; font-weight: bold; font-size: 12pt; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin: 16px 0 18px 0; }
        th { background: #e8e8e8; border: 1px solid #999; padding: 10px 14px; text-align: left; font-weight: bold; line-height: 1.4; }
        td { border: 1px solid #ccc; padding: 9px 14px; line-height: 1.4; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .green { color: #047857; }
        .red { color: #b91c1c; }
        .blue { color: #1d4ed8; }
        .footer { margin-top: 24px; font-size: 9pt; color: #555; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; font-size: 10pt; }
      </style>
    </head>
    <body>

      <!-- Page 1: Executive Summary & Posisi Keuangan -->
      ${buildHeader('LAPORAN KEUANGAN LENGKAP')}

      <div class="section">
        <div class="section-title">I. RINGKASAN EKSEKUTIF</div>
        <div class="subsection-title">Key Financial Metrics:</div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 10px 0;">
          <div class="row"><span>Total Penerimaan</span><span class="green" style="font-weight: bold;">${formatRp(data.summary.total_receipts)}</span></div>
          <div class="row"><span>Total Pengeluaran</span><span class="red" style="font-weight: bold;">${formatRp(data.summary.total_expenses)}</span></div>
          <div class="row grand-total">
            <span>${isPositif ? 'SURPLUS KEUANGAN' : 'DEFISIT KEUANGAN'}</span>
            <span class="${isPositif ? 'green' : 'red'}" style="font-weight: bold;">${formatRp(Math.abs(data.summary.net))}</span>
          </div>
        </div>
        
          <div class="subsection-title">Status Pembayaran Santri (Akumulatif):</div>
          <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin: 10px 0;">
            <div class="row"><span>Total Tagihan Santri</span><span style="font-weight: bold;">${formatRp(data.santriMetrics.total_tagihan)}</span></div>
            <div class="row"><span>Total Sudah Dibayar</span><span class="green" style="font-weight: bold;">${formatRp(data.santriMetrics.total_dibayar)}</span></div>
            <div class="row"><span>Total Tunggakan</span><span class="red" style="font-weight: bold;">${formatRp(data.santriMetrics.total_tunggakan)}</span></div>
            <div class="row"><span>Persentase Terbayar</span><span class="${data.santriMetrics.persentase_pembayaran >= 80 ? 'green' : data.santriMetrics.persentase_pembayaran >= 60 ? 'blue' : 'red'}" style="font-weight: bold;">${data.santriMetrics.persentase_pembayaran.toFixed(1)}%</span></div>
            <div style="font-size: 10pt; color: #666; margin-top: 6px;">Status pembayaran: ${data.santriMetrics.persentase_pembayaran >= 90 ? 'Sangat Baik' : data.santriMetrics.persentase_pembayaran >= 75 ? 'Baik' : data.santriMetrics.persentase_pembayaran >= 50 ? 'Cukup' : 'Perlu Perhatian'}</div>
          </div>

          ${crossPeriodPayments.length > 0 ? `
          <div class="subsection-title" style="margin-top:14px;">Rincian Penerimaan Tagihan Santri (Berdasarkan Periode Tagihan):</div>
          <table>
            <thead><tr><th>Jenis Tagihan</th><th>Bulan Tagihan</th><th>Tahun</th><th class="text-right">Total Diterima</th></tr></thead>
            <tbody>
              ${crossPeriodPayments.map(r => `<tr><td>${r.jenisTagihan}</td><td>${r.bulan}</td><td>${r.tahun}</td><td class="text-right">${formatRp(r.total)}</td></tr>`).join('')}
              <tr style="font-weight:bold;background:#f0f9ff;">
                <td colspan="3" style="border:1px solid #999;padding:8px;">TOTAL PENERIMAAN TAGIHAN</td>
                <td class="text-right" style="border:1px solid #999;padding:8px;color:#047857;">${formatRp(crossPeriodPayments.reduce((s,r)=>s+r.total,0))}</td>
              </tr>
            </tbody>
          </table>
          ` : ''}

      </div>

      <!-- Page 2: Posisi Keuangan (Neraca) -->
      <div class="page-break">
        ${buildHeader('LAPORAN POSISI KEUANGAN (NERACA)')}

        <div class="section">
          <div class="section-title">II. POSISI KEUANGAN (NERACA)</div>
          <div class="subsection-title">Posisi Kas &amp; Setara Kas:</div>
          <table>
          <thead>
            <tr><th>Nama Kas</th><th class="text-right">Kas Tunai</th><th class="text-right">Bank/Transfer</th><th class="text-right">Total</th></tr>
          </thead>
          <tbody>
            ${kasBreakdown}
            <tr style="font-weight: bold; background: #f0f9ff;">
              <td style="border: 1px solid #999; padding: 8px;">TOTAL KAS & SETARA KAS</td>
              <td style="border: 1px solid #999; padding: 8px; text-align: right;">${formatRp(data.bukuKas.reduce((s, k) => s + k.saldo_akhir_cash, 0))}</td>
              <td style="border: 1px solid #999; padding: 8px; text-align: right;">${formatRp(data.bukuKas.reduce((s, k) => s + k.saldo_akhir_bank, 0))}</td>
              <td style="border: 1px solid #999; padding: 8px; text-align: right; color: #1d4ed8;">${formatRp(totalKas)}</td>
            </tr>
          </tbody>
        </table>

        <div class="row total" style="margin: 15px 0;"><span>TOTAL ASET</span><span class="blue">${formatRp(totalKas)}</span></div>

        <div class="subsection-title">LIABILITAS &amp; EKUITAS</div>
        <div class="row indent"><span>Liabilitas Jangka Pendek</span><span>-</span></div>
        <div class="row indent"><span>Ekuitas/Dana Pesantren</span><span class="blue">${formatRp(totalKas)}</span></div>
        <div class="row total"><span>TOTAL LIABILITAS &amp; EKUITAS</span><span class="blue">${formatRp(totalKas)}</span></div>
        </div>
      </div>

      <!-- Page 4: Laporan Aktivitas -->
      <div class="page-break">
        ${buildHeader('LAPORAN AKTIVITAS KEUANGAN')}
        
        <div class="section">
          <div class="section-title">III. LAPORAN AKTIVITAS </div>
          
          <div class="subsection-title">PENERIMAAN:</div>
          ${receiptsBreakdown}
          <div class="row total"><span>Total Penerimaan</span><span class="green">${formatRp(data.summary.total_receipts)}</span></div>
          
          <div class="subsection-title" style="margin-top: 20px;">PENGELUARAN:</div>
          ${expensesBreakdown}
          <div class="row total"><span>Total Pengeluaran</span><span class="red">${formatRp(data.summary.total_expenses)}</span></div>
          
          <div class="row grand-total">
            <span>${isPositif ? 'SURPLUS AKTIVITAS' : 'DEFISIT AKTIVITAS'}</span>
            <span class="${isPositif ? 'green' : 'red'}">${formatRp(Math.abs(data.summary.net))}</span>
          </div>
        </div>
      </div>

      <!-- Page 5: Laporan Arus Kas -->
      <div class="page-break">
        ${buildHeader('LAPORAN ARUS KAS')}
        
        <div class="section">
          <div class="section-title">IV. LAPORAN ARUS KAS</div>
          
          <div class="subsection-title">Arus Kas dari Aktivitas Operasi:</div>
          <div class="row indent"><span>Penerimaan dari santri & operasional</span><span class="green">${formatRp(data.summary.total_receipts)}</span></div>
          <div class="row indent"><span>Pembayaran untuk operasional</span><span class="red">(${formatRp(data.summary.total_expenses)})</span></div>
          <div class="row total"><span>Arus Kas Bersih dari Aktivitas Operasi</span><span class="${isPositif ? 'green' : 'red'}">${formatRp(data.summary.net)}</span></div>
          
          <div class="subsection-title" style="margin-top: 20px;">Arus Kas dari Aktivitas Investasi:</div>
          <div class="row indent"><span>-</span><span>-</span></div>
          
          <div class="subsection-title">Arus Kas dari Aktivitas Pendanaan:</div>
          <div class="row indent"><span>-</span><span>-</span></div>
          
          <div class="row grand-total">
            <span>KENAIKAN (PENURUNAN) BERSIH KAS</span>
            <span class="${isPositif ? 'green' : 'red'}">${formatRp(data.summary.net)}</span>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div>Mengetahui,</div>
            <div style="font-weight: bold;">Pimpinan Pesantren</div>
            <div class="signature-line">(...........................)</div>
          </div>
          <div class="signature-box">
            <div>${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</div>
            <div style="font-weight: bold;">Bendahara</div>
            <div class="signature-line">(...........................)</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Laporan ini dibuat secara elektronik dan sah tanpa tanda tangan basah.</div>
        <div>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</div>
      </div>

    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=900,height=600')
  if (!printWindow) return
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}