<?php

namespace App\Http\Controllers\Keuangan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\TransaksiKas;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Summary report - total pemasukan and pengeluaran for a date range
     */
    public function summary(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $cacheKey = 'reports.summary.' . md5(json_encode([$start, $end]));

        $payload = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($start, $end) {
            $pembayaranBase = DB::table('pembayaran as p')
                ->whereNull('p.deleted_at')
                ->when($start, fn($q) => $q->whereDate('p.tanggal_bayar', '>=', $start))
                ->when($end, fn($q) => $q->whereDate('p.tanggal_bayar', '<=', $end));

            $transaksiBase = DB::table('transaksi_kas as tk')
                ->whereNull('tk.deleted_at')
                ->when($start, fn($q) => $q->whereDate('tk.tanggal', '>=', $start))
                ->when($end, fn($q) => $q->whereDate('tk.tanggal', '<=', $end));

            $totalReceipts = (float) (clone $pembayaranBase)->sum('p.nominal_bayar');

            $totalExpenses = (float) (clone $transaksiBase)
                ->where(function ($q) {
                    $q->where('tk.jenis', '!=', 'pemasukan')->orWhereNull('tk.jenis');
                })
                ->where('tk.kategori', 'NOT LIKE', '%Transfer Internal%')
                ->sum('tk.nominal');

            $pembayaranBreakdownRows = (clone $pembayaranBase)
                ->leftJoin('tagihan_santri as ts', 'ts.id', '=', 'p.tagihan_santri_id')
                ->leftJoin('jenis_tagihan as jt', 'jt.id', '=', 'ts.jenis_tagihan_id')
                ->selectRaw("COALESCE(jt.nama_tagihan, 'Tagihan Lainnya') as label, SUM(p.nominal_bayar) as total")
                ->groupBy('label')
                ->get();

            $otherReceiptsRows = (clone $transaksiBase)
                ->where('tk.jenis', 'pemasukan')
                ->whereNull('tk.pembayaran_id')
                ->where('tk.kategori', 'NOT LIKE', '%Transfer Internal%')
                ->selectRaw("COALESCE(tk.kategori, 'Pemasukan Lainnya') as label, SUM(tk.nominal) as total")
                ->groupBy('label')
                ->get();

            $pembayaranBreakdown = [];
            foreach ($pembayaranBreakdownRows as $row) {
                $pembayaranBreakdown[$row->label] = (float) $row->total;
            }

            $otherReceiptsBreakdown = [];
            foreach ($otherReceiptsRows as $row) {
                $otherReceiptsBreakdown[$row->label] = (float) $row->total;
            }

            $totalOtherReceipts = array_sum($otherReceiptsBreakdown);
            $totalAllReceipts = $totalReceipts + $totalOtherReceipts;
            $receiptsBreakdown = $pembayaranBreakdown + $otherReceiptsBreakdown;

            return [
                'total_receipts' => $totalAllReceipts,
                'total_expenses' => $totalExpenses,
                'net' => $totalAllReceipts - $totalExpenses,
                'receipts_breakdown' => $receiptsBreakdown,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    /**
     * Group expenses by category
     */
    public function expensesByCategory(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $cacheKey = 'reports.expensesByCategory.' . md5(json_encode([$start, $end]));

        $grouped = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($start, $end) {
            $query = TransaksiKas::query();
            if ($start) $query->whereDate('tanggal', '>=', $start);
            if ($end) $query->whereDate('tanggal', '<=', $end);

            $query->where(function ($q) {
                $q->where('jenis', '!=', 'pemasukan')->orWhereNull('jenis');
            });

            $query->where('kategori', 'NOT LIKE', '%Transfer Internal%');

            return $query->selectRaw('coalesce(kategori_id, 0) as kategori_id, coalesce(kategori, ? ) as kategori_name, SUM(nominal) as total', ['Lain-lain'])
                ->groupBy('kategori_id', 'kategori')
                ->get();
        });

        return response()->json(['success' => true, 'data' => $grouped]);
    }
}
