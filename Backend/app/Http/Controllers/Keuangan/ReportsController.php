<?php

namespace App\Http\Controllers\Keuangan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\TransaksiKas;

class ReportsController extends Controller
{
    /**
     * Summary report - total pemasukan and pengeluaran for a date range
     */
    public function summary(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $pembayaranQuery = Pembayaran::query();
        $transaksiQuery = TransaksiKas::query();

        if ($start) $pembayaranQuery->whereDate('tanggal_bayar', '>=', $start);
        if ($end) $pembayaranQuery->whereDate('tanggal_bayar', '<=', $end);

        if ($start) $transaksiQuery->whereDate('tanggal', '>=', $start);
        if ($end) $transaksiQuery->whereDate('tanggal', '<=', $end);

        $totalReceipts = (float) $pembayaranQuery->sum('nominal_bayar');

        // Treat transaksi with jenis == 'pemasukan' as receipts, others as expenses
        $expenseQuery = (clone $transaksiQuery)->where(function ($q) {
            $q->where('jenis', '!=', 'pemasukan')->orWhereNull('jenis');
        });
        $totalExpenses = (float) $expenseQuery->sum('nominal');

        return response()->json([
            'success' => true,
            'data' => [
                'total_receipts' => $totalReceipts,
                'total_expenses' => $totalExpenses,
                'net' => $totalReceipts - $totalExpenses,
            ],
        ]);
    }

    /**
     * Group expenses by category
     */
    public function expensesByCategory(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $query = TransaksiKas::query();
        if ($start) $query->whereDate('tanggal', '>=', $start);
        if ($end) $query->whereDate('tanggal', '<=', $end);

        $query->where(function ($q) {
            $q->where('jenis', '!=', 'pemasukan')->orWhereNull('jenis');
        });

        $grouped = $query->selectRaw('coalesce(kategori_id, 0) as kategori_id, coalesce(kategori, ? ) as kategori_name, SUM(nominal) as total', ['Lain-lain'])
            ->groupBy('kategori_id', 'kategori')
            ->get();

        return response()->json(['success' => true, 'data' => $grouped]);
    }
}
