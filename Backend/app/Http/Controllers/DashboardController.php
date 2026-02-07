<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Santri;
use App\Models\Wallet;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary data
     */
    public function index(Request $request)
    {
        try {
            // Get total santri
            $totalSantri = Santri::where('status', 'aktif')->count();
            
            // Get total saldo from all wallets
            $totalSaldo = Wallet::sum('balance') ?? 0;
            
            // Get weekly attendance data (mock data for now)
            $absensiSeries = [10, 20, 12, 30, 18, 25, 22];
            
            return response()->json([
                'totalSantri' => $totalSantri,
                'totalSaldo' => $totalSaldo,
                'absensiSeries' => $absensiSeries,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
