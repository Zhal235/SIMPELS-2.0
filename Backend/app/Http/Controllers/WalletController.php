<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;

class WalletController extends Controller
{
    public function index()
    {
        $wallets = Wallet::with('santri')->get();

        return response()->json(['success' => true, 'data' => $wallets]);
    }

    public function show($santriId)
    {
        $wallet = Wallet::where('santri_id', $santriId)->with('santri')->first();

        if (!$wallet) {
            return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $wallet]);
    }

    public function topup(Request $request, $santriId)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method' => 'nullable|in:cash,transfer'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $amount = $request->input('amount');
        $description = $request->input('description');

        DB::beginTransaction();
        try {
            $wallet = Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);

            $wallet->balance = $wallet->balance + $amount;
            $wallet->save();

            // generate unique reference for the transaction
            $reference = 'WAL-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));

            $txn = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => $description,
                'reference' => $reference,
                'method' => $request->input('method', 'cash'),
                'created_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json(['success' => true, 'data' => $wallet, 'transaction' => $txn], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Wallet topup error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Topup failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function debit(Request $request, $santriId)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method' => 'nullable|in:cash,transfer'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $amount = $request->input('amount');
        $description = $request->input('description');

        DB::beginTransaction();
        try {
            $wallet = Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);

            $wallet->balance = $wallet->balance - $amount;
            $wallet->save();

            $reference = 'WAL-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));

            $txn = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => $description,
                'reference' => $reference,
                'method' => $request->input('method', 'cash'),
                'created_by' => auth()->id()
            ]);

            DB::commit();

            return response()->json(['success' => true, 'data' => $wallet, 'transaction' => $txn]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Wallet debit error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Debit failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function transactions($santriId)
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();
        if (!$wallet) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $txns = WalletTransaction::where('wallet_id', $wallet->id)->with('author')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $txns]);
    }

    protected function ensureAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') {
            return false;
        }
        return true;
    }

    /**
     * Update a transaction: reverse original and apply new transaction
     * Only admin allowed
     */
    public function updateTransaction(Request $request, $id)
    {
        if (!$this->ensureAdmin($request)) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method' => 'nullable|in:cash,transfer,epos',
            'type' => 'nullable|in:credit,debit,epos_in,epos_out,withdraw'
        ]);

        if ($validator->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);

        $newAmount = $request->input('amount');
        $newDescription = $request->input('description');
        $newMethod = $request->input('method', null);
        $newType = $request->input('type', null);

        DB::beginTransaction();
        try {
            $orig = WalletTransaction::find($id);
            if (!$orig) return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
            if ($orig->voided) return response()->json(['success' => false, 'message' => 'Transaction already voided'], 422);

            $wallet = Wallet::find($orig->wallet_id);
            if (!$wallet) return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);

            // create reversal transaction (opposite of original)
            $reverseType = $orig->type === 'credit' ? 'debit' : ($orig->type === 'debit' ? 'credit' : 'debit');

            // adjust wallet balance for reversal
            if ($reverseType === 'debit') {
                $wallet->balance -= $orig->amount;
            } else {
                $wallet->balance += $orig->amount;
            }
            $wallet->save();

            $refReverse = 'REV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            $revTx = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $reverseType,
                'amount' => $orig->amount,
                'balance_after' => $wallet->balance,
                'description' => 'Reversal for ' . ($orig->reference ?? ('txn:' . $orig->id)),
                'reference' => $refReverse,
                'method' => 'admin-reverse',
                'created_by' => $request->user()->id,
                'reversed_of' => $orig->id
            ]);

            // mark original voided
            $orig->voided = true;
            $orig->voided_by = $request->user()->id;
            $orig->save();

            // now apply new transaction (same type as original unless overridden)
            $finalType = $newType ?: $orig->type;
            if ($finalType === 'credit') {
                $wallet->balance += $newAmount;
            } else {
                $wallet->balance -= $newAmount;
            }
            $wallet->save();

            $newRef = 'WAL-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            $newTxn = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $finalType,
                'amount' => $newAmount,
                'balance_after' => $wallet->balance,
                'description' => $newDescription,
                'reference' => $newRef,
                'method' => $newMethod ?? $orig->method,
                'created_by' => $request->user()->id
            ]);

            DB::commit();

            return response()->json(['success' => true, 'data' => ['wallet' => $wallet, 'reversal' => $revTx, 'transaction' => $newTxn]]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Update transaction error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Update failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Void (delete) a transaction by creating a reversal and marking original as voided
     */
    public function voidTransaction(Request $request, $id)
    {
        if (!$this->ensureAdmin($request)) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        DB::beginTransaction();
        try {
            $orig = WalletTransaction::find($id);
            if (!$orig) return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
            if ($orig->voided) return response()->json(['success' => false, 'message' => 'Transaction already voided'], 422);

            $wallet = Wallet::find($orig->wallet_id);
            if (!$wallet) return response()->json(['success' => false, 'message' => 'Wallet not found'], 404);

            // create reversal tx
            $reverseType = $orig->type === 'credit' ? 'debit' : ($orig->type === 'debit' ? 'credit' : 'debit');

            if ($reverseType === 'debit') {
                $wallet->balance -= $orig->amount;
            } else {
                $wallet->balance += $orig->amount;
            }
            $wallet->save();

            $refReverse = 'REV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            $revTx = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $reverseType,
                'amount' => $orig->amount,
                'balance_after' => $wallet->balance,
                'description' => 'Void reversal for ' . ($orig->reference ?? ('txn:' . $orig->id)),
                'reference' => $refReverse,
                'method' => 'admin-void',
                'created_by' => $request->user()->id,
                'reversed_of' => $orig->id
            ]);

            $orig->voided = true;
            $orig->voided_by = $request->user()->id;
            $orig->save();

            DB::commit();
            return response()->json(['success' => true, 'data' => ['wallet' => $wallet, 'reversal' => $revTx]]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Void transaction error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Void failed', 'error' => $e->getMessage()], 500);
        }
    }

    // Admin: list all transactions with optional filters (santri_id, type, date range)
    public function allTransactions(Request $request)
    {
        $q = WalletTransaction::query();

        if ($request->has('santri_id')) {
            $santriId = $request->query('santri_id');
            $wallet = Wallet::where('santri_id', $santriId)->first();
            if ($wallet) $q->where('wallet_id', $wallet->id);
            else return response()->json(['success' => true, 'data' => []]);
        }

        if ($request->has('type')) {
            $q->where('type', $request->query('type'));
        }

        if ($request->has('start') && $request->has('end')) {
            $q->whereBetween('created_at', [$request->query('start'), $request->query('end')]);
        }

        $items = $q->with(['wallet','author'])->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }
}
