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
        // EXCLUDE Transfer Internal (perpindahan Bank ↔ Cash dalam 1 buku kas)
        $expenseQuery = (clone $transaksiQuery)
            ->where(function ($q) {
                $q->where('jenis', '!=', 'pemasukan')->orWhereNull('jenis');
            })
            ->where('kategori', 'NOT LIKE', '%Transfer Internal%');
        $totalExpenses = (float) $expenseQuery->sum('nominal');

        // Breakdown Pemasukan (Receipts)
        // 1. Dari Pembayaran Santri (Group by Jenis Tagihan)
        $pembayaranBreakdown = (clone $pembayaranQuery)
            ->with(['tagihanSantri.jenisTagihan'])
            ->get()
            ->groupBy(function ($item) {
                // Gunakan nama jenis tagihan sebagai label pelaporan
                // Contoh: "SPP", "Uang Makan", "Uang Gedung"
                return $item->tagihanSantri->jenisTagihan->nama_tagihan ?? 'Tagihan Lainnya';
            })
            ->map(function ($group) {
                return (float) $group->sum('nominal_bayar');
            });

        // 2. Dari Transaksi Kas Lainnya (Bukan pembayaran santri, tapi jenis pemasukan)
        $otherReceiptsQuery = (clone $transaksiQuery)
            ->where('jenis', 'pemasukan')
            ->whereNull('pembayaran_id')
            ->where('kategori', 'NOT LIKE', '%Transfer Internal%');

        $otherReceiptsBreakdown = $otherReceiptsQuery
            ->get()
            ->groupBy(function ($item) {
                return $item->kategori ?? 'Pemasukan Lainnya';
            })
            ->map(function ($group) {
                return (float) $group->sum('nominal');
            });
            
        $totalOtherReceipts = $otherReceiptsBreakdown->sum();
        $totalAllReceipts = $totalReceipts + $totalOtherReceipts;

        // Merge breakdown keys
        $receiptsBreakdown = $pembayaranBreakdown->toArray() + $otherReceiptsBreakdown->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_receipts' => $totalAllReceipts,
                'total_expenses' => $totalExpenses,
                'net' => $totalAllReceipts - $totalExpenses,
                'receipts_breakdown' => $receiptsBreakdown,
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
        
        // EXCLUDE Transfer Internal (perpindahan Bank ↔ Cash dalam 1 buku kas)
        $query->where('kategori', 'NOT LIKE', '%Transfer Internal%');

        $grouped = $query->selectRaw('coalesce(kategori_id, 0) as kategori_id, coalesce(kategori, ? ) as kategori_name, SUM(nominal) as total', ['Lain-lain'])
            ->groupBy('kategori_id', 'kategori')
            ->get();

        return response()->json(['success' => true, 'data' => $grouped]);
    }
}
