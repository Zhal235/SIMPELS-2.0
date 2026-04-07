<?php

namespace App\Services\Wallet;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\WalletTransaction;

/**
 * Cash Withdrawal Service
 * 
 * Handles cash withdrawal operations (transfer bank balance to cash).
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - Process cash withdrawal requests
 * - Validate transfer balance availability
 * - Create withdrawal records
 */
class CashWithdrawalService
{
    /**
     * Cash withdrawal: transfer dari saldo bank/transfer ke cash
     * 
     * @param Request $request
     * @return array
     */
    public function processCashWithdrawal(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        $amount = $request->input('amount');
        $note = $request->input('note', '');

        DB::beginTransaction();
        try {
            // Calculate total transfer balance across all santri wallets
            $totalTransferCredit = WalletTransaction::where('type', 'credit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');

            $totalTransferDebit = WalletTransaction::where('type', 'debit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');

            $availableTransferBalance = $totalTransferCredit - $totalTransferDebit;

            // Check if transfer balance is sufficient
            if ($availableTransferBalance < $amount) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Saldo transfer tidak mencukupi',
                    'data' => [
                        'requested' => $amount,
                        'available' => $availableTransferBalance
                    ],
                    'status_code' => 422
                ];
            }

            // Create cash withdrawal record (tidak menggunakan pool_id)
            // Gunakan wallet_withdrawals dengan pool_id = NULL untuk membedakan dari EPOS withdrawal
            $reference = 'CWDRAW-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            
            $userId = auth()->id() ?? 1; // Fallback to admin ID 1 if not authenticated
            
            $withdrawal = DB::table('wallet_withdrawals')->insertGetId([
                'pool_id' => null, // NULL untuk cash withdrawal, bukan NULL untuk EPOS
                'amount' => $amount,
                'status' => 'done',
                'requested_by' => $userId,
                'processed_by' => $userId,
                'epos_ref' => $reference, // Gunakan field ini untuk reference cash withdrawal
                'notes' => 'CASH_TRANSFER: Tarik dana Transfer → Cash' . ($note ? ' - ' . $note : ''),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return [
                'success' => true,
                'data' => [
                    'withdrawal_id' => $withdrawal,
                    'amount' => $amount,
                    'status' => 'done',
                    'reference' => $reference,
                    'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString()
                ],
                'status_code' => 201
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cash withdrawal error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Tarik dana gagal',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }
}
