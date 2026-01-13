<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;
use App\Models\EposPool;

class WalletController extends Controller
{
    /**
     * Calculate total Cash balance across all santri wallets
     */
    private function calculateTotalCashBalance()
    {
        // Credit cash dari top-up manual (exclude voided & admin-void)
        $cashCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Debit cash (tarik tunai santri, EPOS belanja) - exclude voided & admin-void
        $cashDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'cash')
            ->where('method', '!=', 'admin-void')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Tambah dari penarikan Bank→Cash
        $withdrawals = DB::table('wallet_withdrawals')
            ->where('pool_id', null) // Cash withdrawals (bukan EPOS)
            ->where('status', 'done')
            ->sum('amount');
        
        // Kurangi pencairan EPOS yang pakai cash
        $eposWithdrawalsCash = DB::table('epos_withdrawals')
            ->where('status', 'approved')
            ->where('payment_method', 'cash')
            ->sum('amount');
        
        return ($cashCredit - $cashDebit) + $withdrawals - $eposWithdrawalsCash;
    }

    /**
     * Calculate total Transfer/Bank balance across all santri wallets
     */
    private function calculateTotalBankBalance()
    {
        $transferCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        $transferDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Kurangi penarikan Bank→Cash
        $withdrawals = DB::table('wallet_withdrawals')
            ->where('pool_id', null)
            ->where('status', 'done')
            ->sum('amount');
        
        // Kurangi pencairan EPOS yang pakai transfer
        $eposWithdrawalsTransfer = DB::table('epos_withdrawals')
            ->where('status', 'approved')
            ->where('payment_method', 'transfer')
            ->sum('amount');
        
        return ($transferCredit - $transferDebit) - $withdrawals - $eposWithdrawalsTransfer;
    }

    /**
     * Get total cash and bank balances
     * GET /api/v1/wallets/balances
     */
    public function getBalances()
    {
        $cashBalance = $this->calculateTotalCashBalance();
        $bankBalance = $this->calculateTotalBankBalance();
        
        return response()->json([
            'success' => true,
            'data' => [
                'cash_balance' => $cashBalance,
                'bank_balance' => $bankBalance,
                'total_balance' => $cashBalance + $bankBalance
            ]
        ]);
    }

    public function index()
    {
        $wallets = Wallet::with('santri')->get();

        // Add transaction totals per wallet
        $wallets->transform(function ($wallet) {
            // Exclude voided transactions (voided=1/true) AND admin-void reversal transactions
            $wallet->total_credit = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'credit')
                ->where('method', '!=', 'admin-void') // Exclude reversal transactions
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_debit = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('method', '!=', 'admin-void') // Exclude reversal transactions
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_credit_cash = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'credit')
                ->where('method', 'cash')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_credit_transfer = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'credit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_debit_cash = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('method', 'cash')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_debit_transfer = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            $wallet->total_debit_epos = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where('method', 'epos')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');
            
            return $wallet;
        });

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
        $method = $request->input('method', 'cash'); // Default cash untuk tarik tunai

        // VALIDASI: Jika method=cash, cek saldo cash sekolah
        if ($method === 'cash') {
            $totalCashBalance = $this->calculateTotalCashBalance();
            
            if ($totalCashBalance < $amount) {
                $shortage = $amount - $totalCashBalance;
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo Cash tidak mencukupi',
                    'data' => [
                        'available_cash' => $totalCashBalance,
                        'requested' => $amount,
                        'shortage' => $shortage,
                        'hint' => 'Silakan melakukan penarikan dari Bank terlebih dahulu'
                    ]
                ], 422);
            }
        }

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
                'method' => $method,
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

        $txns = WalletTransaction::where('wallet_id', $wallet->id)
            ->with('author')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                // Use the 'type' field from database, fallback to amount sign
                $tipe = $t->type ?? (($t->amount ?? 0) < 0 ? 'debit' : 'credit');
                
                // Generate reference if not exists
                $reference = $t->reference;
                if (!$reference) {
                    // Generate reference based on type and created date
                    $prefix = strtoupper(substr($tipe, 0, 3));
                    $reference = $prefix . '-' . $t->created_at->format('YmdHis') . '-' . str_pad($t->id, 6, '0', STR_PAD_LEFT);
                }
                
                // Determine method - if null, infer from context
                $method = $t->method;
                if (!$method) {
                    // Try to infer from description
                    if (stripos($t->description, 'epos') !== false || $tipe === 'epos_in' || $tipe === 'epos_out') {
                        $method = 'epos';
                    } elseif (stripos($t->description, 'transfer') !== false) {
                        $method = 'transfer';
                    } else {
                        $method = 'cash';
                    }
                }
                
                // Determine author/admin name
                $authorName = null;
                if ($t->author) {
                    $authorName = $t->author->name;
                } elseif ($method === 'epos' || in_array($tipe, ['epos_in', 'epos_out'])) {
                    $authorName = 'System ePOS';
                } elseif ($t->created_by) {
                    $authorName = 'Admin (ID: ' . $t->created_by . ')';
                } else {
                    $authorName = 'System';
                }
                
                return [
                    'id' => $t->id,
                    'reference' => $reference,
                    'created_at' => $t->created_at ? $t->created_at->toIso8601String() : null,
                    'tanggal' => $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : null,
                    'description' => $t->description ?: 'Transaksi ' . ucfirst($tipe),
                    'keterangan' => $t->description ?: 'Transaksi ' . ucfirst($tipe),
                    'amount' => abs($t->amount ?? 0),
                    'jumlah' => abs($t->amount ?? 0),
                    'type' => $tipe,
                    'tipe' => $tipe,
                    'saldo_akhir' => $t->balance_after ?? 0,
                    'balance_after' => $t->balance_after ?? 0,
                    'method' => $method,
                    'metode' => $method,
                    'created_by' => $t->created_by,
                    'author' => $t->author ? [
                        'id' => $t->author->id,
                        'name' => $t->author->name,
                    ] : [
                        'id' => null,
                        'name' => $authorName,
                    ],
                    'voided' => $t->voided ?? false,
                ];
            });
            
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

        $items = $q->with(['wallet.santri','author'])->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * Create withdrawal request from EPOS
     * POST /api/v1/wallets/epos/withdrawal
     */
    public function createEposWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'withdrawal_number' => 'required|string|unique:epos_withdrawals,withdrawal_number',
            'amount' => 'required|numeric|min:0.01',
            'period_start' => 'required|date',
            'period_end' => 'required|date',
            'total_transactions' => 'integer|nullable',
            'notes' => 'string|nullable',
            'requested_by' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $withdrawal = \App\Models\EposWithdrawal::create([
                'withdrawal_number' => $request->withdrawal_number,
                'amount' => $request->amount,
                'period_start' => $request->period_start,
                'period_end' => $request->period_end,
                'total_transactions' => $request->total_transactions ?? 0,
                'notes' => $request->notes,
                'requested_by' => $request->requested_by ?? 'EPOS System',
                'status' => 'pending',
            ]);

            \Log::info('EPOS withdrawal request created', [
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'amount' => $withdrawal->amount
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request created',
                'data' => $withdrawal
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Create EPOS withdrawal error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create withdrawal request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get withdrawal status by withdrawal number
     * GET /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/status
     */
    public function getEposWithdrawalStatus($withdrawalNumber)
    {
        $withdrawal = \App\Models\EposWithdrawal::where('withdrawal_number', $withdrawalNumber)->first();

        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'amount' => floatval($withdrawal->amount),
                'status' => $withdrawal->status,
                'status_label' => $withdrawal->status_label ?? ucfirst($withdrawal->status),
                'approved_at' => $withdrawal->approved_at,
                'approved_by' => $withdrawal->approved_by,
                'completed_at' => $withdrawal->completed_at,
                'notes' => $withdrawal->notes,
                'created_at' => $withdrawal->created_at,
                'updated_at' => $withdrawal->updated_at,
            ]
        ]);
    }

    /**
     * Approve EPOS withdrawal request
     * PUT /api/v1/wallets/epos/withdrawal/{id}/approve
     * Body: { "payment_method": "cash" | "transfer" }
     */
    public function approveEposWithdrawal(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_method' => 'required|in:cash,transfer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $paymentMethod = $request->input('payment_method');

        DB::beginTransaction();
        try {
            $withdrawal = \App\Models\EposWithdrawal::findOrFail($id);

            if ($withdrawal->status !== \App\Models\EposWithdrawal::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal sudah diproses sebelumnya'
                ], 422);
            }

            // Get EPOS pool
            $pool = EposPool::where('name', 'epos_main')->first();
            if (!$pool) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'EPOS pool tidak ditemukan'
                ], 404);
            }

            // Check if pool has enough balance
            if ($pool->balance < $withdrawal->amount) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo pool tidak mencukupi',
                    'data' => [
                        'pool_balance' => $pool->balance,
                        'withdrawal_amount' => $withdrawal->amount
                    ]
                ], 422);
            }

            // VALIDASI: Cek saldo sesuai payment method
            if ($paymentMethod === 'cash') {
                $totalCashBalance = $this->calculateTotalCashBalance();
                
                if ($totalCashBalance < $withdrawal->amount) {
                    DB::rollBack();
                    $shortage = $withdrawal->amount - $totalCashBalance;
                    return response()->json([
                        'success' => false,
                        'message' => 'Saldo Cash sekolah tidak mencukupi',
                        'data' => [
                            'available_cash' => $totalCashBalance,
                            'requested' => $withdrawal->amount,
                            'shortage' => $shortage,
                            'hint' => 'Silakan tarik dana dari Bank ke Cash terlebih dahulu'
                        ]
                    ], 422);
                }
            } else if ($paymentMethod === 'transfer') {
                $totalBankBalance = $this->calculateTotalBankBalance();
                
                if ($totalBankBalance < $withdrawal->amount) {
                    DB::rollBack();
                    $shortage = $withdrawal->amount - $totalBankBalance;
                    return response()->json([
                        'success' => false,
                        'message' => 'Saldo Bank/Transfer sekolah tidak mencukupi',
                        'data' => [
                            'available_bank' => $totalBankBalance,
                            'requested' => $withdrawal->amount,
                            'shortage' => $shortage
                        ]
                    ], 422);
                }
            }

            // Deduct from pool
            $pool->balance -= $withdrawal->amount;
            $pool->save();

            // Update withdrawal status
            $withdrawal->status = \App\Models\EposWithdrawal::STATUS_APPROVED;
            $withdrawal->payment_method = $paymentMethod;
            $withdrawal->approved_by = auth()->id();
            $withdrawal->approved_at = now();
            $withdrawal->save();

            DB::commit();

            \Log::info('EPOS withdrawal approved', [
                'withdrawal_id' => $withdrawal->id,
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'amount' => $withdrawal->amount,
                'pool_balance_after' => $pool->balance
            ]);

            // Send callback to EPOS
            try {
                $eposApiUrl = config('services.epos.api_url');
                if ($eposApiUrl) {
                    \Illuminate\Support\Facades\Http::timeout(10)
                        ->put($eposApiUrl . '/api/simpels/withdrawal/' . $withdrawal->withdrawal_number . '/status', [
                            'status' => 'approved',
                            'updated_by' => auth()->user()->name ?? 'Admin SIMPELS',
                            'notes' => 'Penarikan disetujui oleh SIMPELS',
                            'updated_at' => now()->toDateTimeString(),
                        ]);

                    \Log::info('Callback sent to EPOS for withdrawal approval', [
                        'withdrawal_number' => $withdrawal->withdrawal_number
                    ]);
                }
            } catch (\Exception $callbackError) {
                \Log::warning('Failed to send callback to EPOS', [
                    'withdrawal_number' => $withdrawal->withdrawal_number,
                    'error' => $callbackError->getMessage()
                ]);
                // Continue even if callback fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal berhasil disetujui',
                'data' => [
                    'withdrawal' => $withdrawal,
                    'pool_balance' => $pool->balance
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to approve EPOS withdrawal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui withdrawal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject EPOS withdrawal request by withdrawal number (from ePOS)
     * POST /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/reject
     */
    public function rejectEposWithdrawalByNumber(Request $request, $withdrawalNumber)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Alasan penolakan harus diisi (minimal 5 karakter)',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $withdrawal = \App\Models\EposWithdrawal::where('withdrawal_number', $withdrawalNumber)->firstOrFail();

            if ($withdrawal->status === \App\Models\EposWithdrawal::STATUS_REJECTED) {
                return response()->json([
                    'success' => true,
                    'message' => 'Withdrawal sudah ditolak sebelumnya'
                ]);
            }

            if ($withdrawal->status === \App\Models\EposWithdrawal::STATUS_COMPLETED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal yang sudah selesai tidak bisa dibatalkan'
                ], 422);
            }

            // Update withdrawal status
            $withdrawal->status = \App\Models\EposWithdrawal::STATUS_REJECTED;
            $withdrawal->rejected_by = 1; // System/ePOS
            $withdrawal->rejected_at = now();
            $withdrawal->rejection_reason = $request->reason;
            $withdrawal->save();

            DB::commit();

            \Log::info('EPOS withdrawal rejected from ePOS', [
                'withdrawal_number' => $withdrawalNumber,
                'reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal berhasil ditolak',
                'data' => [
                    'withdrawal' => $withdrawal
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reject EPOS withdrawal from ePOS', [
                'withdrawal_number' => $withdrawalNumber,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak withdrawal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject EPOS withdrawal request
     * PUT /api/v1/wallets/epos/withdrawal/{id}/reject
     */
    public function rejectEposWithdrawal(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Alasan penolakan harus diisi (minimal 5 karakter)',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $withdrawal = \App\Models\EposWithdrawal::findOrFail($id);

            if ($withdrawal->status !== \App\Models\EposWithdrawal::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal sudah diproses sebelumnya'
                ], 422);
            }

            // Update withdrawal status
            $withdrawal->status = \App\Models\EposWithdrawal::STATUS_REJECTED;
            $withdrawal->rejected_by = auth()->id();
            $withdrawal->rejected_at = now();
            $withdrawal->rejection_reason = $request->reason;
            $withdrawal->save();

            DB::commit();

            \Log::info('EPOS withdrawal rejected', [
                'withdrawal_id' => $withdrawal->id,
                'withdrawal_number' => $withdrawal->withdrawal_number,
                'reason' => $request->reason
            ]);

            // Send callback to EPOS
            try {
                $eposApiUrl = config('services.epos.api_url');
                if ($eposApiUrl) {
                    \Illuminate\Support\Facades\Http::timeout(10)
                        ->put($eposApiUrl . '/api/simpels/withdrawal/' . $withdrawal->withdrawal_number . '/status', [
                            'status' => 'rejected',
                            'updated_by' => auth()->user()->name ?? 'Admin SIMPELS',
                            'notes' => 'Penarikan ditolak: ' . $request->reason,
                            'updated_at' => now()->toDateTimeString(),
                        ]);

                    \Log::info('Callback sent to EPOS for withdrawal rejection', [
                        'withdrawal_number' => $withdrawal->withdrawal_number
                    ]);
                }
            } catch (\Exception $callbackError) {
                \Log::warning('Failed to send callback to EPOS', [
                    'withdrawal_number' => $withdrawal->withdrawal_number,
                    'error' => $callbackError->getMessage()
                ]);
                // Continue even if callback fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal berhasil ditolak',
                'data' => $withdrawal
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reject EPOS withdrawal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak withdrawal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all EPOS withdrawal requests
     * GET /api/v1/wallets/epos/withdrawals
     */
    public function listEposWithdrawals(Request $request)
    {
        $query = \App\Models\EposWithdrawal::query()->orderBy('created_at', 'desc');

        // Filter by status - default tampilkan semua untuk history lengkap
        $status = $request->input('status', 'all');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $withdrawals = $query->get();

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
            'meta' => [
                'status_filter' => $status,
                'total' => $withdrawals->count()
            ]
        ]);
    }

    /**
     * Cash withdrawal: transfer dari saldo bank/transfer ke cash
     * POST /api/v1/wallets/cash-withdrawal
     */
    public function cashWithdrawal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
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
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo transfer tidak mencukupi',
                    'data' => [
                        'requested' => $amount,
                        'available' => $availableTransferBalance
                    ]
                ], 422);
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

            return response()->json([
                'success' => true,
                'data' => [
                    'withdrawal_id' => $withdrawal,
                    'amount' => $amount,
                    'status' => 'done',
                    'reference' => $reference,
                    'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString()
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cash withdrawal error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Tarik dana gagal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check / Ping endpoint for EPOS
     * GET /api/v1/wallets/ping
     */
    public function ping()
    {
        return response()->json([
            'success' => true,
            'message' => 'SIMPELS API is running',
            'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString(),
            'version' => '2.0'
        ]);
    }
}
