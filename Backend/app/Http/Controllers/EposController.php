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
        try {
            $wallet = Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);

            // debit internal wallet
            $wallet->balance -= $amount;
            $wallet->save();

            // Build description: include meta items (if provided) to allow showing purchased items in history
            $description = 'ePOS transaction';
            $meta = $request->input('meta');
            if ($meta) {
                try {
                    if (is_array($meta) && isset($meta['items']) && is_array($meta['items'])) {
                        $items = array_map(function ($i) {
                            if (is_array($i)) return ($i['name'] ?? json_encode($i));
                            return (string) $i;
                        }, $meta['items']);
                        $description .= ' - items: ' . implode(', ', $items);
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

            DB::commit();

            return response()->json(['success' => true, 'data' => ['wallet_balance' => $wallet->balance, 'pool_balance' => $pool->balance, 'transaction' => $txn]]);

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

    public function createWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $pool = EposPool::where('name', 'epos_main')->first();
        if (!$pool) return response()->json(['success' => false, 'message' => 'ePOS pool not found'], 404);

        $amount = $request->input('amount');

        // create withdrawal request (pending) — admin will process
        $withdrawal = WalletWithdrawal::create([
            'pool_id' => $pool->id,
            'amount' => $amount,
            'status' => 'pending',
            'requested_by' => auth()->id(),
            'notes' => $request->input('note')
        ]);

        return response()->json(['success' => true, 'data' => $withdrawal], 201);
    }

    public function listWithdrawals(Request $request)
    {
        $q = WalletWithdrawal::query();
        if ($request->has('status')) $q->where('status', $request->status);
        return response()->json(['success' => true, 'data' => $q->orderBy('created_at', 'desc')->get()]);
    }
}
