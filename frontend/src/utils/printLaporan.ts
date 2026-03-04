const PRINT_CSS = `
  @page { size: A4 portrait; margin: 15mm 18mm 15mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #000; background: #fff; }
  h1 { font-size: 14pt; font-weight: bold; }
  h2 { font-size: 12pt; font-weight: bold; }
  h3 { font-size: 11pt; font-weight: bold; }
  h4 { font-size: 10.5pt; font-weight: bold; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 18px; }
  .header .instansi-kecil { font-size: 9pt; color: #444; }
  .header .instansi-besar { font-size: 13pt; font-weight: bold; margin: 2px 0; }
  .header .judul-laporan { font-size: 14pt; font-weight: bold; margin-top: 6px; letter-spacing: 1px; }
  .header .periode { font-size: 10pt; color: #333; margin-top: 4px; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid #333; padding: 4px 0 6px 0; margin-bottom: 10px; }
  .subsection-title { font-size: 10.5pt; font-weight: bold; margin: 10px 0 6px 0; }
  .row { display: flex; justify-content: space-between; padding: 5px 4px; }
  .row.indent { padding-left: 20px; }
  .row.total { border-top: 1.5px solid #333; margin-top: 6px; padding: 7px 4px 5px 4px; font-weight: bold; }
  .row.grand-total { border-top: 2px double #000; border-bottom: 2px double #000; padding: 8px 4px; font-weight: bold; font-size: 12pt; margin: 10px 0; }
  .row.sub-total { border-top: 1px solid #aaa; padding: 6px 4px 4px 4px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 14px; }
  th { background: #e8e8e8; border: 1px solid #999; padding: 8px 12px; text-align: left; font-weight: bold; line-height: 1.4; }
  td { border: 1px solid #bbb; padding: 7px 12px; line-height: 1.4; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .green { color: #047857; }
  .red { color: #b91c1c; }
  .blue { color: #1d4ed8; }
  .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
  .badge-green { background: #d1fae5; color: #047857; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .summary-table { width: 100%; border: 1.5px solid #333; padding: 10px 16px; margin-bottom: 16px; font-size: 10.5pt; }
  .summary-table .row { padding: 5px 0; }
  .footer { margin-top: 24px; font-size: 9pt; color: #555; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
  .kop-img { max-height: 70px; width: 100%; object-fit: contain; object-position: center; margin-bottom: 6px; }
`

function formatRp(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

function buildHeader(opts: { namaYayasan?: string; namaPesantren?: string; kopSuratUrl?: string; judulLaporan: string; periode?: string }) {
  if (opts.kopSuratUrl) {
    return `<div class="header">
      <img class="kop-img" src="${opts.kopSuratUrl}" alt="Kop Surat"/>
      <div class="judul-laporan">${opts.judulLaporan}</div>
      ${opts.periode ? `<div class="periode">Periode: ${opts.periode}</div>` : ''}
    </div>`
  }
  return `<div class="header">
    <div class="instansi-kecil">${opts.namaYayasan || ''}</div>
    <div class="instansi-besar">${opts.namaPesantren || ''}</div>
    <div class="judul-laporan">${opts.judulLaporan}</div>
    ${opts.periode ? `<div class="periode">Periode: ${opts.periode}</div>` : ''}
  </div>`
}

function openPrintWindow(htmlBody: string) {
  const w = window.open('', '', 'width=900,height=700')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan</title><style>${PRINT_CSS}</style></head><body>${htmlBody}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 300)
}

export interface InstansiInfo {
  namaYayasan?: string
  namaPesantren?: string
  kopSuratUrl?: string | null
}

export function printArusKas(data: any, instansi: InstansiInfo) {
  const header = buildHeader({
    ...instansi,
    kopSuratUrl: instansi.kopSuratUrl || undefined,
    judulLaporan: 'LAPORAN ARUS KAS',
    periode: data.period,
  })

  const masuks = data.receipts.by_category?.length
    ? data.receipts.by_category.map((c: any) => `<div class="row indent"><span>${c.kategori}</span><span>${formatRp(c.total)}</span></div>`).join('')
    : `<div class="row indent"><span>Pembayaran Santri</span><span>${formatRp(data.receipts.pembayaran_santri)}</span></div>
       ${data.receipts.lain_lain > 0 ? `<div class="row indent"><span>Penerimaan Lain-lain</span><span>${formatRp(data.receipts.lain_lain)}</span></div>` : ''}`

  const keluars = data.expenses.by_category.map((c: any) =>
    `<div class="row indent"><span>${c.kategori}</span><span>${formatRp(c.total)}</span></div>`
  ).join('')

  const isPositif = data.net_cash_flow >= 0

  const body = `
    ${header}
    <div class="section">
      <div class="section-title">ARUS KAS MASUK (Penerimaan)</div>
      ${masuks}
      <div class="row total"><span>Total Arus Kas Masuk</span><span class="green">${formatRp(data.receipts.total)}</span></div>
    </div>
    <div class="section">
      <div class="section-title">ARUS KAS KELUAR (Pengeluaran)</div>
      ${keluars}
      <div class="row total"><span>Total Arus Kas Keluar</span><span class="red">${formatRp(data.expenses.total)}</span></div>
    </div>
    <div class="row grand-total">
      <span>NET ARUS KAS</span>
      <span class="${isPositif ? 'green' : 'red'}">${formatRp(data.net_cash_flow)}</span>
    </div>
    <div class="footer">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  `
  openPrintWindow(body)
}

export function printLabaRugi(data: any, instansi: InstansiInfo) {
  const header = buildHeader({
    ...instansi,
    kopSuratUrl: instansi.kopSuratUrl || undefined,
    judulLaporan: 'LAPORAN AKTIVITAS KEUANGAN',
    periode: data.period,
  })

  const pOp = data.pendapatan.operasional.map((p: any) =>
    `<div class="row indent"><span>${p.nama}</span><span>${formatRp(p.jumlah)}</span></div>`
  ).join('')
  const pNon = data.pendapatan.non_operasional.map((p: any) =>
    `<div class="row indent"><span>${p.nama}</span><span>${formatRp(p.jumlah)}</span></div>`
  ).join('')
  const bOp = data.beban.operasional.map((b: any) =>
    `<div class="row indent"><span>${b.nama}</span><span>${formatRp(b.jumlah)}</span></div>`
  ).join('')
  const bNon = data.beban.non_operasional.map((b: any) =>
    `<div class="row indent"><span>${b.nama}</span><span>${formatRp(b.jumlah)}</span></div>`
  ).join('')

  const isPositif = data.laba_rugi >= 0
  const body = `
    ${header}
    <div class="section">
      <div class="section-title">PENERIMAAN</div>
      ${pOp.length ? `<div class="subsection-title">Penerimaan dari Santri &amp; Lainnya:</div>${pOp}` : ''}
      ${pNon.length ? `<div class="subsection-title">Penerimaan Lain-lain:</div>${pNon}` : ''}
      <div class="row total"><span>Total Penerimaan</span><span class="green">${formatRp(data.pendapatan.total)}</span></div>
    </div>
    <div class="section">
      <div class="section-title">PENGELUARAN</div>
      ${bOp.length ? `<div class="subsection-title">Pengeluaran Operasional:</div>${bOp}` : ''}
      ${bNon.length ? `<div class="subsection-title">Pengeluaran Lain-lain:</div>${bNon}` : ''}
      <div class="row total"><span>Total Pengeluaran</span><span class="red">${formatRp(data.beban.total)}</span></div>
    </div>
    <div class="row grand-total">
      <span>${isPositif ? 'SURPLUS' : 'DEFISIT'}</span>
      <span class="${isPositif ? 'green' : 'red'}">${formatRp(Math.abs(data.laba_rugi))}</span>
    </div>
    <div class="footer">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  `
  openPrintWindow(body)
}

export function printPerBukuKas(data: any[], periode: string, instansi: InstansiInfo) {
  const header = buildHeader({
    ...instansi,
    kopSuratUrl: instansi.kopSuratUrl || undefined,
    judulLaporan: 'LAPORAN PER BUKU KAS',
    periode,
  })

  const tables = data.map(kas => `
    <div class="section">
      <div class="section-title">${kas.buku_kas.nama_kas}</div>
      <table>
        <thead><tr><th>Keterangan</th><th class="text-right">Kas Tunai (Cash)</th><th class="text-right">Bank / Non-Tunai</th><th class="text-right">Total</th></tr></thead>
        <tbody>
          <tr><td>Saldo Awal</td><td class="text-right">${formatRp(kas.saldo_awal_cash)}</td><td class="text-right">${formatRp(kas.saldo_awal_bank)}</td><td class="text-right">${formatRp(kas.saldo_awal_cash + kas.saldo_awal_bank)}</td></tr>
          <tr><td>Mutasi Masuk (+)</td><td class="text-right green">${formatRp(kas.mutasi_masuk_cash)}</td><td class="text-right green">${formatRp(kas.mutasi_masuk_bank)}</td><td class="text-right green">${formatRp(kas.mutasi_masuk_cash + kas.mutasi_masuk_bank)}</td></tr>
          <tr><td>Mutasi Keluar (-)</td><td class="text-right red">${formatRp(kas.mutasi_keluar_cash)}</td><td class="text-right red">${formatRp(kas.mutasi_keluar_bank)}</td><td class="text-right red">${formatRp(kas.mutasi_keluar_cash + kas.mutasi_keluar_bank)}</td></tr>
          <tr style="font-weight:bold;background:#e8f0fe"><td>Saldo Akhir</td><td class="text-right blue">${formatRp(kas.saldo_akhir_cash)}</td><td class="text-right blue">${formatRp(kas.saldo_akhir_bank)}</td><td class="text-right blue">${formatRp(kas.total_saldo_akhir)}</td></tr>
        </tbody>
      </table>
    </div>
  `).join('')

  const total = data.reduce((s, k) => s + k.total_saldo_akhir, 0)
  const body = `
    ${header}
    ${tables}
    <div class="row grand-total"><span>TOTAL SALDO SELURUH KAS</span><span class="blue">${formatRp(total)}</span></div>
    <div class="footer">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  `
  openPrintWindow(body)
}

export function printTagihanSantri(data: any[], summary: any, instansi: InstansiInfo, periode: string) {
  const header = buildHeader({
    ...instansi,
    kopSuratUrl: instansi.kopSuratUrl || undefined,
    judulLaporan: 'LAPORAN TAGIHAN SANTRI',
    periode,
  })

  const statusLabel: Record<string, string> = { lunas: 'Lunas', belum_bayar: 'Belum Bayar', cicilan: 'Cicilan' }
  const rows = data.map((t, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td>${t.santri?.nama || ''}</td>
      <td>${t.santri?.nis || ''}</td>
      <td>${t.santri?.kelas?.nama_kelas || ''}</td>
      <td>${t.jenis_tagihan?.nama_tagihan || ''}</td>
      <td>${t.bulan || ''} ${t.tahun || ''}</td>
      <td class="text-right">${formatRp(t.nominal)}</td>
      <td class="text-right">${formatRp(t.dibayar)}</td>
      <td class="text-right">${formatRp(t.sisa)}</td>
      <td class="text-center"><span class="badge badge-${t.status === 'lunas' ? 'green' : t.status === 'cicilan' ? 'yellow' : 'red'}">${statusLabel[t.status] || t.status}</span></td>
    </tr>
  `).join('')

  const summaryHtml = summary ? `
    <div class="summary-table">
      <div class="row"><span>Total Tagihan:</span><span><b>${formatRp(summary.total_tagihan)}</b></span></div>
      <div class="row"><span>Total Dibayar:</span><span class="green"><b>${formatRp(summary.total_dibayar)}</b></span></div>
      <div class="row"><span>Total Sisa:</span><span class="red"><b>${formatRp(summary.total_sisa)}</b></span></div>
      <div class="row"><span>Lunas:</span><span>${summary.jumlah_lunas} santri</span></div>
      <div class="row"><span>Belum Lunas:</span><span>${summary.jumlah_belum_lunas} santri</span></div>
    </div>
  ` : ''

  const body = `
    ${header}
    ${summaryHtml}
    <table>
      <thead><tr>
        <th class="text-center">No</th><th>Nama Santri</th><th>NIS</th><th>Kelas</th>
        <th>Jenis Tagihan</th><th>Bulan</th>
        <th class="text-right">Nominal</th><th class="text-right">Dibayar</th><th class="text-right">Sisa</th><th class="text-center">Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;|&nbsp; Total data: ${data.length} tagihan</div>
  `
  openPrintWindow(body)
}

export function printTunggakanSantri(data: any[], summary: any, instansi: InstansiInfo) {
  const header = buildHeader({
    ...instansi,
    kopSuratUrl: instansi.kopSuratUrl || undefined,
    judulLaporan: 'LAPORAN TUNGGAKAN SANTRI',
  })

  const bulanNama = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const rows = data.flatMap((santri, si) =>
    santri.tagihan.map((t: any, ti: number) => `
      <tr>
        ${ti === 0 ? `<td class="text-center" rowspan="${santri.tagihan.length}">${si + 1}</td>
                     <td rowspan="${santri.tagihan.length}">${santri.santri.nama}</td>
                     <td rowspan="${santri.tagihan.length}">${santri.santri.nis}</td>
                     <td rowspan="${santri.tagihan.length}">${santri.santri.kelas?.nama_kelas || ''}</td>` : ''}
        <td>${t.jenis_tagihan?.nama_tagihan || ''}</td>
        <td>${bulanNama[parseInt(t.bulan)] || t.bulan} ${t.tahun}</td>
        <td class="text-right red"><b>${formatRp(t.sisa)}</b></td>
        <td class="text-center">${t.umur_tunggakan_hari} hari</td>
      </tr>
    `)
  ).join('')

  const summaryHtml = summary ? `
    <div class="summary-table">
      <div class="row"><span>Total Santri Menunggak:</span><span><b>${summary.total_santri_tunggakan} santri</b></span></div>
      <div class="row"><span>Total Tunggakan:</span><span class="red"><b>${formatRp(summary.total_tunggakan)}</b></span></div>
      <div class="row"><span>Total Tagihan Tertunggak:</span><span><b>${summary.total_tagihan_tertunggak} tagihan</b></span></div>
    </div>
  ` : ''

  const body = `
    ${header}
    ${summaryHtml}
    <table>
      <thead><tr>
        <th class="text-center" style="width:30px">No</th>
        <th>Nama Santri</th><th>NIS</th><th>Kelas</th>
        <th>Jenis Tagihan</th><th>Bulan</th>
        <th class="text-right">Sisa Tunggakan</th><th class="text-center">Umur</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  `
  openPrintWindow(body)
}
