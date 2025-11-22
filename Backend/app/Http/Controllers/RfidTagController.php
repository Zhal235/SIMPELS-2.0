<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\RfidTag;

class RfidTagController extends Controller
{
    public function index()
    {
        $tags = RfidTag::with('santri')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $tags]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uid' => 'required|string|unique:rfid_tags,uid',
            'santri_id' => 'nullable|exists:santri,id',
            'label' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $tag = RfidTag::create($request->only(['uid', 'santri_id', 'label']));
        return response()->json(['success' => true, 'data' => $tag], 201);
    }

    public function update(Request $request, $id)
    {
        $tag = RfidTag::find($id);
        if (!$tag) return response()->json(['success' => false, 'message' => 'Tag not found'], 404);

        $validator = Validator::make($request->all(), [
            'santri_id' => 'nullable|exists:santri,id',
            'label' => 'string|nullable',
            'active' => 'boolean|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $tag->update($request->only(['santri_id', 'label', 'active']));

        return response()->json(['success' => true, 'data' => $tag]);
    }

    public function destroy($id)
    {
        $tag = RfidTag::find($id);
        if (!$tag) return response()->json(['success' => false, 'message' => 'Tag not found'], 404);

        $tag->delete();
        return response()->json(['success' => true, 'message' => 'Tag removed']);
    }

    /**
     * Get santri data by RFID UID (for EPOS integration)
     */
    public function getByUid($uid)
    {
        $tag = RfidTag::where('uid', $uid)->where('active', true)->with(['santri.wallet'])->first();

        if (!$tag) {
            return response()->json([
                'success' => false,
                'message' => 'RFID tag tidak ditemukan atau tidak aktif'
            ], 404);
        }

        if (!$tag->santri) {
            return response()->json([
                'success' => false,
                'message' => 'RFID tag belum terdaftar ke santri'
            ], 404);
        }

        $santri = $tag->santri;
        $wallet = $santri->wallet;

        if (!$wallet) {
            return response()->json([
                'success' => false,
                'message' => 'Wallet santri belum dibuat'
            ], 404);
        }

        // Get transaction limit for the santri
        $limit = \App\Models\SantriTransactionLimit::where('santri_id', $santri->id)->first();
        $dailyLimit = $limit ? $limit->daily_limit : 15000;

        // Calculate today's spending from wallet transactions
        $todayStart = now()->startOfDay();
        
        \Log::info('RfidTagController::getByUid - calculating spent_today', [
            'wallet_id' => $wallet->id,
            'today_start' => $todayStart->toDateTimeString()
        ]);
        
        $todaySpent = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'epos')
            ->where('voided', 0)
            ->where('created_at', '>=', $todayStart)
            ->sum('amount');

        \Log::info('RfidTagController::getByUid - spent_today result', [
            'wallet_id' => $wallet->id,
            'spent_today' => $todaySpent
        ]);

        $remainingLimit = max(0, $dailyLimit - $todaySpent);

        return response()->json([
            'success' => true,
            'data' => [
                'santri_id' => $santri->id,
                'nis' => $santri->nis,
                'nama_santri' => $santri->nama_santri,
                'kelas' => $santri->kelas_nama,
                'asrama' => $santri->asrama_nama,
                'foto' => $santri->foto,
                'wallet_id' => $wallet->id,
                'saldo' => floatval($wallet->balance),
                'limit_harian' => floatval($dailyLimit),
                'spent_today' => floatval($todaySpent),
                'sisa_limit_hari_ini' => floatval($remainingLimit),
                'rfid_uid' => $tag->uid,
                'rfid_label' => $tag->label,
            ]
        ]);
    }
}
