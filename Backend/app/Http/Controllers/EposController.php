<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\RfidTag;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\EposPool;
use App\Models\WalletWithdrawal;

class EposController extends Controller
{
    public function transaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uid' => 'nullable|string',
            'santri_id' => 'nullable|exists:santri,id',
            'amount' => 'required|numeric|min:0.01',
            'epos_txn_id' => 'string|nullable',
            'meta' => 'nullable'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $santriId = $request->input('santri_id');
        $uid = $request->input('uid');

        if (!$santriId && $uid) {
            $tag = RfidTag::where('uid', $uid)->where('active', true)->first();
            if (!$tag || !$tag->santri_id) {
                return response()->json(['success' => false, 'message' => 'RFID not linked to santri'], 404);
            }
            $santriId = $tag->santri_id;
        }

        if (!$santriId) {
            return response()->json(['success' => false, 'message' => 'santri_id or uid is required'], 422);
        }

        $amount = $request->input('amount');
        $eposTxnId = $request->input('epos_txn_id');

        DB::beginTransaction();
        // ensure wallet exists before computing spent today / checks
        $wallet = Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);

        // compute today's spending BEFORE applying this transaction
        // Since app timezone is Asia/Jakarta, DB timestamps are already in WIB
        $todayStart = now()->startOfDay();

        $spentTodayBefore = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'epos')
            ->where('voided', 0)
            ->where('created_at', '>=', $todayStart)
            ->sum('amount');

        // daily limit retrieval
        $limitModel = \App\Models\SantriTransactionLimit::where('santri_id', $santriId)->first();
        $dailyLimit = $limitModel ? (float) $limitModel->daily_limit : 15000;

        // if there's a daily limit > 0, prevent the transaction if it would exceed the limit
        if ($dailyLimit > 0 && (($spentTodayBefore + $amount) > $dailyLimit)) {
            DB::rollBack();
            $remainingBefore = max(0, $dailyLimit - $spentTodayBefore);
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ditolak: melebihi limit harian',
                'data' => [
                    'spent_today_before' => (float)$spentTodayBefore,
                    'limit_harian' => (float)$dailyLimit,
                    'remaining_before' => (float)$remainingBefore
                ]
            ], 422);
        }

        // enforce global minimum balance - use the new global_minimum_balance field
        $settingsRow = \App\Models\WalletSettings::first();
        $minBalance = $settingsRow ? (float)$settingsRow->global_minimum_balance : 10000;

        if (($wallet->balance - $amount) < $minBalance) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Saldo tidak mencukupi setelah memperhitungkan saldo minimal yang diizinkan',
                'data' => [
                    'current_balance' => (float)$wallet->balance,
                    'min_balance_required' => (float)$minBalance,
                    'attempted_debit' => (float)$amount,
                    'saldo_setelah_transaksi' => (float)($wallet->balance - $amount)
                ]
            ], 422);
        }
        try {

            // debit internal wallet
            $wallet->balance -= $amount;
            $wallet->save();

            // Build description: include meta items (if provided) to allow showing purchased items in history
            $description = 'ePOS transaction';
            $meta = $request->input('meta');
            if ($meta) {
                try {
                    if (is_array($meta) && isset($meta['items']) && is_array($meta['items'])) {
                        // Simplified description: only include product names.
                        $names = array_map(function ($i) {
                            if (is_array($i)) return ($i['product_name'] ?? $i['name'] ?? json_encode($i));
                            if (is_object($i)) return ($i->product_name ?? $i->name ?? json_encode($i));
                            return (string) $i;
                        }, $meta['items']);

                        // Limit long lists to first 5 names to keep description concise
                        $names = array_slice($names, 0, 5);
                        $description = 'Pembelian (' . implode(', ', $names) . ')';
                    } else {
                        $description .= ' - ' . json_encode($meta);
                    }
                } catch (\Throwable $e) {
                    // fallback - ignore meta if serialization fails
                }
            }

            $txn = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'reference' => $eposTxnId,
                'description' => $description,
                'method' => 'epos',
                'created_by' => null
            ]);

            // add to epos pool
            $pool = EposPool::where('name', 'epos_main')->first();
            if (!$pool) {
                $pool = EposPool::create(['name' => 'epos_main', 'balance' => 0]);
            }
            $pool->balance += $amount;
            $pool->save();

            // compute today's spending and remaining daily limit for the santri
            // recompute spent today (DB timestamps already in WIB since app timezone is Asia/Jakarta)
            $todayStart = now()->startOfDay();

            $spentToday = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('method', 'epos')
                ->where('voided', 0)
                ->where('created_at', '>=', $todayStart)
                ->sum('amount');

            $limitModel = \App\Models\SantriTransactionLimit::where('santri_id', $santriId)->first();
            $dailyLimit = $limitModel ? (float) $limitModel->daily_limit : 15000;
            $remainingLimit = max(0, $dailyLimit - $spentToday);

            DB::commit();

            $txnData = $txn->toArray();
            // ensure created_at/updated_at are returned in WIB
            if ($txn->created_at) {
                $txnData['created_at'] = $txn->created_at->timezone('Asia/Jakarta')->toDateTimeString();
            }
            if ($txn->updated_at) {
                $txnData['updated_at'] = $txn->updated_at->timezone('Asia/Jakarta')->toDateTimeString();
            }

            return response()->json(['success' => true, 'data' => [
                'wallet_balance' => $wallet->balance,
                'pool_balance' => $pool->balance,
                'transaction' => $txnData,
                'spent_today' => (float) $spentToday,
                'remaining_limit' => (float) $remainingLimit,
                'limit_harian' => (float) $dailyLimit
            ]]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('ePOS transaction error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Transaction failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function pool()
    {
        $pool = EposPool::where('name', 'epos_main')->first();
        return response()->json(['success' => true, 'data' => $pool]);
    }

    /**
     * Get sample santri data for EPOS testing
     */
    public function getSampleSantri()
    {
        try {
            $santri = \App\Models\Santri::with(['kelas', 'asrama', 'wallet', 'rfid_tag'])
                ->where('status', 'aktif')
                ->first();
                
            if (!$santri) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active santri found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'santri_id' => $santri->id,
                    'nis' => $santri->nis,
                    'nama_santri' => $santri->nama_santri,
                    'kelas' => $santri->kelas?->nama_kelas,
                    'has_wallet' => $santri->wallet ? true : false,
                    'wallet_balance' => $santri->wallet?->balance ?? 0,
                    'has_rfid' => $santri->rfid_tag ? true : false,
                    'rfid_uid' => $santri->rfid_tag?->uid,
                    'note' => 'Use this santri_id for EPOS testing'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting sample santri: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'string|nullable',
            'requested_by' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $pool = EposPool::where('name', 'epos_main')->first();
        if (!$pool) return response()->json(['success' => false, 'message' => 'ePOS pool not found'], 404);

        $amount = $request->input('amount');
        
        // --- Auto-Approval Logic for Admin ---
        // Since initiated by Admin/Dashboard, we auto-approve and deduct balance immediately.
        
        if ($pool->balance < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo PoolEPOS tidak mencukupi untuk penarikan ini.',
                'data' => ['pool_balance' => $pool->balance, 'requested' => $amount]
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Deduct from pool
            $pool->balance -= $amount;
            $pool->save();

            $requestedByName = $request->input('requested_by');
            $note = $request->input('note');
            
            // Generate Withdrawal Number
            $withdrawNumber = 'WDR-' . date('Ymd') . '-' . strtoupper(uniqid());

            // Create as EposWithdrawal (Unified Model) with status APPROVED/COMPLETED
            // We use EposWithdrawal instead of WalletWithdrawal so it appears in the main list
            $withdrawal = \App\Models\EposWithdrawal::create([
                'withdrawal_number' => $withdrawNumber,
                'amount' => $amount,
                'period_start' => now(), // Default to today/now
                'period_end' => now(),
                'total_transactions' => 0,
                'notes' => $note,
                'requested_by' => $requestedByName,
                'status' => 'approved', // Auto-approved
                'payment_method' => 'cash', // Default to cash for now
                'approved_at' => now(),
                'approved_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json(['success' => true, 'data' => $withdrawal], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to create withdrawal', 'error' => $e->getMessage()], 500);
        }
    }

    public function listWithdrawals(Request $request)
    {
        $q = WalletWithdrawal::query();
        if ($request->has('status')) $q->where('status', $request->status);
        return response()->json(['success' => true, 'data' => $q->orderBy('created_at', 'desc')->get()]);
    }
}
