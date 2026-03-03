import { formatRupiah } from '../../../utils/pembayaranHelpers'

interface Props {
  kwitansiData: any
  onClose: () => void
}

export default function ModalKwitansi({ kwitansiData, onClose }: Props) {
  const kwitansiNumber = kwitansiData.noKwitansi || Math.random().toString(36).substr(2, 9).toUpperCase()
  const statusLabel = kwitansiData.type === 'lunas' ? 'LUNAS' : 'BAYAR SEBAGIAN'
  const totalSisa = kwitansiData.sisaSesudah !== undefined
    ? kwitansiData.sisaSesudah
    : (kwitansiData.type === 'sebagian'
        ? kwitansiData.tagihan.reduce((sum: number, t: any) => {
            const dibayar = kwitansiData.paymentDetails?.[String(t.id)] || 0
            return sum + (t.nominal - dibayar)
          }, 0)
        : 0)

  const handlePrint = () => {
    const kwitansiElement = document.getElementById('kwitansi')
    if (!kwitansiElement) return
    const styles = Array.from(document.styleSheets).map(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n') } catch { return '' }
    }).join('\n')
    const printWindow = window.open('', '', 'height=400,width=800')
    printWindow?.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kwitansi Pembayaran</title><style>@page{size:210mm 150mm portrait;margin:8mm 10mm;}@media print{html,body{width:210mm;height:150mm;margin:0;padding:0;overflow:hidden;}#kwitansi{width:100%;height:100%;margin:0!important;padding:8mm!important;box-sizing:border-box!important;overflow:hidden!important;}.no-print{display:none!important;}}${styles}</style></head><body>${kwitansiElement.outerHTML}</body></html>`)
    printWindow?.document.close()
    printWindow?.focus()
    setTimeout(() => { printWindow?.print() }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-lg" style={{ width: '210mm', maxHeight: '90vh', overflow: 'auto' }}>
        <div id="kwitansi" className="relative" style={{ width: '210mm', height: '150mm', display: 'flex', flexDirection: 'column', padding: '8mm', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div className="text-center mb-2 pb-2 border-b border-gray-800">
            <h1 className="text-xl font-bold tracking-wider">KWITANSI PEMBAYARAN</h1>
            <p className="text-gray-700 text-xs mt-0.5">Bukti Pembayaran Tagihan</p>
          </div>
          <div className="flex gap-3 mb-1.5 text-xs">
            <div className="flex-1">
              <div className="font-bold mb-0.5 text-xs underline">DATA SANTRI</div>
              <p className="mb-0.5"><span className="font-semibold">Nama</span> : {kwitansiData.santri?.nama_santri}</p>
              <p className="mb-0.5"><span className="font-semibold">NIS</span> : {kwitansiData.santri?.nis}</p>
              <p><span className="font-semibold">Kelas</span> : {kwitansiData.santri?.kelas}</p>
            </div>
            <div className="flex-1 text-right text-xs">
              <p className="mb-0.5"><span className="font-semibold">Nomor</span></p>
              <p className="mb-0.5"><span className="font-semibold">Kwitansi</span> : {kwitansiNumber}</p>
              <p className="mb-0.5"><span className="font-semibold">Tanggal</span> : {kwitansiData.tanggal}</p>
              <p><span className="font-semibold">Jam</span> : {kwitansiData.jam}</p>
            </div>
          </div>
          <div className="mb-1.5">
            <div className="font-bold mb-0.5 text-xs underline">DETAIL PEMBAYARAN</div>
            <table className="w-full text-xs border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-800 px-6 py-3 text-left font-bold">Jenis Tagihan</th>
                  <th className="border border-gray-800 px-6 py-3 text-left font-bold">Bulan</th>
                  <th className="border border-gray-800 px-6 py-3 text-right font-bold">Nominal</th>
                  {kwitansiData.type === 'sebagian' && (<><th className="border border-gray-800 px-6 py-3 text-right font-bold">Dibayar</th><th className="border border-gray-800 px-6 py-3 text-right font-bold">Sisa</th></>)}
                </tr>
              </thead>
              <tbody>
                {kwitansiData.tagihan.map((t: any, idx: number) => {
                  const dibayar = kwitansiData.type === 'sebagian' ? (kwitansiData.nominalBayar || kwitansiData.paymentDetails?.[String(t.id)] || 0) : (kwitansiData.nominalBayar || t.nominal)
                  const nominalTagihan = kwitansiData.sisaSebelum !== undefined ? kwitansiData.sisaSebelum : t.nominal
                  const sisa = kwitansiData.sisaSesudah !== undefined ? kwitansiData.sisaSesudah : (nominalTagihan - dibayar)
                  return (
                    <tr key={idx}>
                      <td className="border border-gray-800 px-6 py-3">{t.jenisTagihan || t.jenis_tagihan}</td>
                      <td className="border border-gray-800 px-6 py-3">{t.bulan} {t.tahun}</td>
                      <td className="border border-gray-800 px-6 py-3 text-right">{formatRupiah(nominalTagihan)}</td>
                      {kwitansiData.type === 'sebagian' && (<><td className="border border-gray-800 px-6 py-3 text-right">{formatRupiah(dibayar)}</td><td className="border border-gray-800 px-6 py-3 text-right font-semibold">{formatRupiah(sisa)}</td></>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mb-1 bg-gray-100 p-3 border border-gray-800 text-xs">
            <div className="flex justify-between mb-0.5 px-2"><span className="font-semibold">Total Tagihan:</span><span>{formatRupiah(kwitansiData.sisaSebelum || kwitansiData.totalTagihan || kwitansiData.totalBayar)}</span></div>
            <div className="flex justify-between px-2"><span className="font-semibold">Nominal Bayar:</span><span>{formatRupiah(kwitansiData.nominalBayar)}</span></div>
            {kwitansiData.kembalian > 0 && (
              <>
                <div className="flex justify-between border-t pt-0.5 mt-0.5 px-2"><span className="font-semibold">Kembalian:</span><span>{formatRupiah(kwitansiData.kembalian)}</span></div>
                <div className="flex justify-between pt-0.5 px-2"><span className="font-semibold">Opsi:</span><span className="text-xs">{kwitansiData.opsiKembalian === 'dompet' ? '✓ Masukkan ke Dompet Santri' : kwitansiData.opsiKembalian === 'tabungan' ? '✓ Simpan ke Tabungan Santri' : '✓ Kembalian Tunai'}</span></div>
              </>
            )}
            {kwitansiData.type === 'sebagian' && totalSisa > 0 && (
              <div className="flex justify-between border-t pt-0.5 mt-0.5 px-2"><span className="font-semibold">Sisa Tagihan:</span><span className="font-bold text-blue-600">{formatRupiah(totalSisa)}</span></div>
            )}
          </div>
          <div className="flex-1 flex items-end">
            <div className="w-full text-center">
              <div className="border-b border-gray-800" style={{ height: '35px', marginBottom: '4px' }}></div>
              <p className="text-xs font-semibold">{kwitansiData.admin}</p>
            </div>
          </div>
          <div className="text-center text-xs text-gray-600 mt-1">
            <p>Terima kasih telah melakukan pembayaran</p>
            <p>Harap simpan kwitansi ini sebagai bukti pembayaran</p>
          </div>
          <style>{`@media print{*{margin:0;padding:0;}body{margin:0;padding:0;}#kwitansi{width:210mm!important;height:150mm!important;margin:0!important;padding:8mm!important;page-break-after:always;display:flex!important;flex-direction:column!important;box-sizing:border-box!important;overflow:hidden!important;}.no-print{display:none!important;}}`}</style>
        </div>
        <div className="no-print p-6 border-t flex gap-3 justify-end bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Tutup</button>
          <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">🖨️ Print Kwitansi</button>
        </div>
      </div>
    </div>
  )
}
