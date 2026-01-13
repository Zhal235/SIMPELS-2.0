<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WalletSettings;
use App\Models\SantriTransactionLimit;
use App\Models\Santri;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class WalletSettingsController extends Controller
{
    // get global settings and all per-santri limits
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $row = DB::table('wallet_settings')->where('key', 'min_balance_jajan')->where('scope', 'global')->first();
        $amount = 0;
        if ($row) {
            $val = json_decode($row->value ?? '{}', true);
            $amount = isset($val['amount']) ? (float)$val['amount'] : 0;
        }

        // Get global_minimum_balance from wallet_settings table (new field)
        $settingsRow = WalletSettings::first();
        $globalMinBalance = $settingsRow ? $settingsRow->global_minimum_balance : 10000;

        $santriLimits = SantriTransactionLimit::with('santri:id,nis,nama_santri')
            ->orderBy('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => [
            'global_settings' => [
                'min_balance' => $amount,
                'global_minimum_balance' => (float)$globalMinBalance
            ],
            'santri_limits' => $santriLimits
        ]]);
    }

    // get all santri with their limits (for bulk edit)
    public function allSantriWithLimits(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $santri = Santri::where('status', 'aktif')->get(['id', 'nis', 'nama_santri']);
        
        // Attach limit data for each santri
        $santri = $santri->map(function($s) {
            $limit = SantriTransactionLimit::where('santri_id', $s->id)->first();
            return [
                'id' => $s->id,
                'nis' => $s->nis,
                'nama_santri' => $s->nama_santri,
                'daily_limit' => $limit ? $limit->daily_limit : 0
            ];
        });

        return response()->json(['success' => true, 'data' => $santri]);
    }

    // update global settings (min_balance and global_minimum_balance)
    public function updateGlobalSettings(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $v = Validator::make($request->all(), [
            'min_balance' => 'nullable|numeric|min:0',
            'global_minimum_balance' => 'nullable|numeric|min:0'
        ]);

        if ($v->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $v->errors()], 422);

        // Update old min_balance for RFID jajan control (if provided)
        if ($request->has('min_balance')) {
            DB::table('wallet_settings')->updateOrInsert(
                ['key' => 'min_balance_jajan', 'scope' => 'global'],
                ['value' => json_encode(['amount' => (float)$request->input('min_balance')]), 'updated_at' => now(), 'created_at' => now()]
            );
        }

        // Update global_minimum_balance for warning alert (if provided)
        if ($request->has('global_minimum_balance')) {
            $settingsRow = WalletSettings::firstOrCreate([]);
            $settingsRow->update([
                'global_minimum_balance' => (float)$request->input('global_minimum_balance')
            ]);
        }

        // Return both values
        $row = DB::table('wallet_settings')->where('key', 'min_balance_jajan')->where('scope', 'global')->first();
        $val = json_decode($row->value ?? '{}', true);
        $minBalance = isset($val['amount']) ? (float)$val['amount'] : 0;

        $settingsRow = WalletSettings::first();
        $globalMinBalance = $settingsRow ? $settingsRow->global_minimum_balance : 10000;

        return response()->json(['success' => true, 'data' => [
            'min_balance' => $minBalance,
            'global_minimum_balance' => (float)$globalMinBalance
        ]]);
    }

    // set per-santri daily limit
    public function setSantriLimit(Request $request, $santriId)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $v = Validator::make($request->all(), [
            'daily_limit' => 'required|numeric|min:0'
        ]);

        if ($v->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $v->errors()], 422);

        $santri = Santri::find($santriId);
        if (!$santri) return response()->json(['success' => false, 'message' => 'Santri not found'], 404);

        $limit = SantriTransactionLimit::updateOrCreate(
            ['santri_id' => $santriId],
            ['daily_limit' => $request->input('daily_limit')]
        );

        return response()->json(['success' => true, 'data' => $limit]);
    }

    // delete per-santri limit (reset to global)
    public function deleteSantriLimit(Request $request, $santriId)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $limit = SantriTransactionLimit::where('santri_id', $santriId)->first();
        if ($limit) $limit->delete();

        return response()->json(['success' => true]);
    }

    // bulk update santri limits
    public function bulkUpdateSantriLimits(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $v = Validator::make($request->all(), [
            'limits' => 'required|array',
            'limits.*.santri_id' => 'required|integer',
            'limits.*.daily_limit' => 'required|numeric|min:0'
        ]);

        if ($v->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $v->errors()], 422);

        $limits = $request->input('limits');
        foreach ($limits as $item) {
            SantriTransactionLimit::updateOrCreate(
                ['santri_id' => $item['santri_id']],
                ['daily_limit' => $item['daily_limit']]
            );
        }

        return response()->json(['success' => true, 'message' => 'Limits updated']);
    }
}