<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\Wallet;
use App\Models\TagihanSantri;
use App\Models\JenisTagihan;
use App\Models\TahunAjaran;
use App\Models\Pembayaran;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const BULAN_ORDER = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    public function index(Request $request)
    {
        try {
            $bulan = $request->query('bulan');
            $tahun = $request->query('tahun');

            $totalSantri = Santri::where('status', 'aktif')->count();
            $totalSaldo = Wallet::sum('balance') ?? 0;

            $tagihanQuery = TagihanSantri::query();
            if ($bulan) $tagihanQuery->where('bulan', $bulan);
            if ($tahun) $tagihanQuery->where('tahun', $tahun);

            $tahunAjaranAktif = TahunAjaran::where('status', 'aktif')->first();

            return response()->json([
                'totalSantri' => $totalSantri,
                'totalSaldo' => (float) $totalSaldo,
                'totalTagihan' => (float) $tagihanQuery->sum('nominal'),
                'totalTerbayar' => (float) $tagihanQuery->sum('dibayar'),
                'totalTunggakan' => (float) $tagihanQuery->sum('sisa'),
                'tahunAjaranAktif' => $tahunAjaranAktif,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function tagihanSummary(Request $request)
    {
        try {
            $bulan = $request->query('bulan');
            $tahun = $request->query('tahun');

            $query = TagihanSantri::with('jenisTagihan:id,nama_tagihan')
                ->select(
                    'jenis_tagihan_id',
                    DB::raw('SUM(nominal) as total_nominal'),
                    DB::raw('SUM(dibayar) as total_dibayar'),
                    DB::raw('SUM(sisa) as total_sisa'),
                    DB::raw("SUM(CASE WHEN status = 'lunas' THEN 1 ELSE 0 END) as jumlah_lunas"),
                    DB::raw("SUM(CASE WHEN status != 'lunas' THEN 1 ELSE 0 END) as jumlah_belum_lunas"),
                    DB::raw('COUNT(*) as total_santri')
                )
                ->groupBy('jenis_tagihan_id');

            if ($bulan) $query->where('bulan', $bulan);
            if ($tahun) $query->where('tahun', $tahun);

            $results = $query->get()->map(function ($row) {
                $total = (int) $row->total_santri;
                $lunas = (int) $row->jumlah_lunas;
                $belum = (int) $row->jumlah_belum_lunas;

                return [
                    'jenisTagihanId' => $row->jenis_tagihan_id,
                    'namaTagihan' => $row->jenisTagihan?->nama_tagihan ?? '-',
                    'totalNominal' => (float) $row->total_nominal,
                    'totalDibayar' => (float) $row->total_dibayar,
                    'totalSisa' => (float) $row->total_sisa,
                    'jumlahLunas' => $lunas,
                    'jumlahBelumLunas' => $belum,
                    'totalSantri' => $total,
                    'persentaseLunas' => $total > 0 ? round(($lunas / $total) * 100, 1) : 0,
                ];
            });

            return response()->json(['data' => $results]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tagihan summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function trend(Request $request)
    {
        try {
            $tahunAjaranId = $request->query('tahun_ajaran_id');

            if (!$tahunAjaranId) {
                $ta = TahunAjaran::where('status', 'aktif')->first();
                if ($ta) $tahunAjaranId = $ta->id;
            }

            $jenisTagihanIds = JenisTagihan::where('tahun_ajaran_id', $tahunAjaranId)->pluck('id');

            $data = TagihanSantri::whereIn('jenis_tagihan_id', $jenisTagihanIds)
                ->select(
                    'bulan',
                    'tahun',
                    DB::raw('SUM(nominal) as total_nominal'),
                    DB::raw('SUM(dibayar) as total_dibayar')
                )
                ->groupBy('bulan', 'tahun')
                ->get()
                ->sortBy(fn($row) => ($row->tahun * 100) + (array_search($row->bulan, self::BULAN_ORDER) + 1))
                ->values()
                ->map(fn($row) => [
                    'bulan' => $row->bulan,
                    'tahun' => $row->tahun,
                    'totalNominal' => (float) $row->total_nominal,
                    'totalDibayar' => (float) $row->total_dibayar,
                ]);

            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data trend',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function kasSummary(Request $request)
    {
        try {
            $start = $request->query('start');
            $end   = $request->query('end');
            $bulan = $request->query('bulan');
            $tahun = $request->query('tahun');

            if ($bulan && $tahun && !$start) {
                $bulanMap = [
                    'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
                    'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
                    'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12,
                ];
                $bulanNum = $bulanMap[$bulan] ?? null;
                if ($bulanNum) {
                    $start = sprintf('%04d-%02d-01', $tahun, $bulanNum);
                    $lastDay = date('t', mktime(0, 0, 0, $bulanNum, 1, $tahun));
                    $end = sprintf('%04d-%02d-%02d', $tahun, $bulanNum, $lastDay);
                }
            }

            $query = DB::table('transaksi_kas as tk')
                ->join('buku_kas as bk', 'tk.buku_kas_id', '=', 'bk.id')
                ->whereNull('tk.deleted_at')
                ->where('tk.kategori', 'NOT LIKE', '%Transfer Internal%')
                ->select(
                    'tk.buku_kas_id',
                    'bk.nama_kas',
                    DB::raw("SUM(CASE WHEN tk.jenis = 'pemasukan' THEN tk.nominal ELSE 0 END) as total_pemasukan"),
                    DB::raw("SUM(CASE WHEN tk.jenis != 'pemasukan' THEN tk.nominal ELSE 0 END) as total_pengeluaran")
                )
                ->groupBy('tk.buku_kas_id', 'bk.nama_kas');

            if ($start) $query->whereDate('tk.tanggal', '>=', $start);
            if ($end)   $query->whereDate('tk.tanggal', '<=', $end);

            $rows = $query->get()->map(function ($row) {
                $pemasukan   = (float) $row->total_pemasukan;
                $pengeluaran = (float) $row->total_pengeluaran;
                return [
                    'buku_kas_id'      => $row->buku_kas_id,
                    'nama_kas'         => $row->nama_kas,
                    'total_pemasukan'  => $pemasukan,
                    'total_pengeluaran'=> $pengeluaran,
                    'saldo_berjalan'   => $pemasukan - $pengeluaran,
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $rows,
                'total'   => [
                    'pemasukan'   => $rows->sum('total_pemasukan'),
                    'pengeluaran' => $rows->sum('total_pengeluaran'),
                    'saldo'       => $rows->sum('saldo_berjalan'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function recentPayments()
    {
        try {
            $payments = Pembayaran::with([
                    'santri:id,nama_santri',
                    'tagihanSantri.jenisTagihan:id,nama_tagihan',
                ])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'noTransaksi' => $p->no_transaksi,
                    'namaSantri' => $p->santri?->nama_santri ?? '-',
                    'namaTagihan' => $p->tagihanSantri?->jenisTagihan?->nama_tagihan ?? '-',
                    'nominalBayar' => (float) $p->nominal_bayar,
                    'tanggalBayar' => $p->tanggal_bayar,
                    'metodePembayaran' => $p->metode_pembayaran,
                ]);

            return response()->json(['data' => $payments]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pembayaran terbaru',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
