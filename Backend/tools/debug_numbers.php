<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== PEMBAYARAN TABLE ===\n";
$totalPembayaran = DB::table('pembayaran')->whereNull('deleted_at')->sum('nominal_bayar');
echo "Total pembayaran.nominal_bayar: " . number_format($totalPembayaran) . "\n";
$count = DB::table('pembayaran')->whereNull('deleted_at')->count();
echo "Jumlah record pembayaran: $count\n\n";

echo "=== TAGIHAN_SANTRI TABLE ===\n";
$totalDibayar = DB::table('tagihan_santri')->sum('dibayar');
echo "SUM(dibayar): " . number_format($totalDibayar) . "\n";
$totalNominal = DB::table('tagihan_santri')->sum('nominal');
echo "SUM(nominal): " . number_format($totalNominal) . "\n";
// Filter bulan Maret 2026
$dibayarMaret = DB::table('tagihan_santri')->where('bulan','Maret')->where('tahun',2026)->sum('dibayar');
echo "SUM(dibayar) Maret 2026: " . number_format($dibayarMaret) . "\n\n";

echo "=== TRANSAKSI_KAS TABLE ===\n";
$rows = DB::table('transaksi_kas')->whereNull('deleted_at')->orderBy('id')->get();
foreach ($rows as $t) {
    echo "ID:{$t->id} | {$t->jenis} | {$t->kategori} | " . number_format($t->nominal) . " | {$t->tanggal} | {$t->keterangan}\n";
}
echo "\nTotal pemasukan (excl Transfer Internal): " . number_format(
    DB::table('transaksi_kas')->whereNull('deleted_at')->where('jenis','pemasukan')->where('kategori','NOT LIKE','%Transfer Internal%')->sum('nominal')
) . "\n";
echo "Total pemasukan (ALL): " . number_format(
    DB::table('transaksi_kas')->whereNull('deleted_at')->where('jenis','pemasukan')->sum('nominal')
) . "\n";
echo "Total pengeluaran (excl Transfer Internal): " . number_format(
    DB::table('transaksi_kas')->whereNull('deleted_at')->where('jenis','pengeluaran')->where('kategori','NOT LIKE','%Transfer Internal%')->sum('nominal')
) . "\n\n";

echo "=== PEMBAYARAN PER BULAN (Maret 2026) ===\n";
$perBulan = DB::table('pembayaran')
    ->whereNull('deleted_at')
    ->whereYear('tanggal_bayar', 2026)
    ->whereMonth('tanggal_bayar', 3)
    ->join('tagihan_santri','pembayaran.tagihan_santri_id','=','tagihan_santri.id')
    ->join('jenis_tagihan','tagihan_santri.jenis_tagihan_id','=','jenis_tagihan.id')
    ->select('jenis_tagihan.nama_tagihan', DB::raw('SUM(pembayaran.nominal_bayar) as total'), DB::raw('COUNT(*) as cnt'))
    ->groupBy('jenis_tagihan.nama_tagihan')
    ->get();
foreach ($perBulan as $r) {
    echo "{$r->nama_tagihan}: " . number_format($r->total) . " ({$r->cnt} transaksi)\n";
}

echo "\n=== HOW PEMBAYARAN UPDATES TAGIHAN DIBAYAR ===\n";
// Cek apakah ada pembayaran yg nominal_bayar != sisa update
$sample = DB::table('pembayaran')
    ->whereNull('deleted_at')
    ->limit(5)
    ->get(['id','santri_id','tagihan_santri_id','nominal_bayar','sisa_sebelum','sisa_sesudah','status_pembayaran']);
foreach ($sample as $p) {
    echo "pay#{$p->id}: nominal={$p->nominal_bayar} sisa_sblm={$p->sisa_sebelum} sisa_ssdh={$p->sisa_sesudah} status={$p->status_pembayaran}\n";
}

// Cek tagihan_santri dibayar vs pembayaran sum
echo "\n=== CROSS CHECK tagihan_santri.dibayar vs SUM(pembayaran) per tagihan ===\n";
$crossCheck = DB::select("
    SELECT ts.id, ts.dibayar as ts_dibayar, COALESCE(SUM(p.nominal_bayar),0) as pay_sum
    FROM tagihan_santri ts
    LEFT JOIN pembayaran p ON p.tagihan_santri_id = ts.id AND p.deleted_at IS NULL
    GROUP BY ts.id
    HAVING ABS(ts.dibayar - COALESCE(SUM(p.nominal_bayar),0)) > 0.01
    LIMIT 10
");
if (empty($crossCheck)) {
    echo "OK - tagihan_santri.dibayar sesuai dengan SUM(pembayaran)\n";
} else {
    echo "ADA SELISIH:\n";
    foreach ($crossCheck as $r) {
        echo "tagihan#{$r->id}: dibayar={$r->ts_dibayar} sumPay={$r->pay_sum}\n";
    }
}
