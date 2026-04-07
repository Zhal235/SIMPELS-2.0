<?php

namespace App\Services\Wallet;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;

/**
 * Wallet Transaction Service
 * 
 * Handles all transaction operations for wallet system.
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - Topup (add balance)
 * - Debit (deduct balance)
 * - Get transaction history
 * - Update transactions (admin only)
 * - Void transactions (admin only)
 * - List all transactions (admin only)
 */
class WalletTransactionService
{
    protected WalletBalanceService $balanceService;

    public function __construct(WalletBalanceService $balanceService)
    {
        $this->balanceService = $balanceService;
    }

    /**
     * Add balance to wallet (topup)
     * 
     * @param Request $request
     * @param string $santriId
     * @return array
     */
    public function topup(Request $request, string $santriId): array
    {
        $santri = Santri::find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Santri tidak ditemukan',
                'status_code' => 404
            ];
        }

        if ($santri->status !== 'aktif') {
            return [
                'success' => false,
                'message' => 'Transaksi dompet hanya diizinkan untuk santri aktif',
                'status_code' => 422
            ];
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method' => 'nullable|in:cash,transfer'
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
        $description = $request->input('description');

        DB::beginTransaction();
        try {
            $wallet = Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);
            if (!$wallet->is_active) {
                $wallet->is_active = true;
            }

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

            return [
                'success' => true,
                'data' => $wallet,
                'transaction' => $txn,
                'status_code' => 201
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Wallet topup error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Topup failed',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Deduct balance from wallet (debit)
     * 
     * @param Request $request
     * @param string $santriId
     * @return array
     */
    public function debit(Request $request, string $santriId): array
    {
        $santri = Santri::find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Santri tidak ditemukan',
                'status_code' => 404
            ];
        }

        if ($santri->status !== 'aktif') {
            return [
                'success' => false,
                'message' => 'Transaksi dompet hanya diizinkan untuk santri aktif',
                'status_code' => 422
            ];
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method' => 'nullable|in:cash,transfer'
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
        $description = $request->input('description');
        $method = $request->input('method', 'cash'); // Default cash untuk tarik tunai

        // VALIDASI: Jika method=cash, cek saldo cash sekolah
        if ($method === 'cash') {
            $totalCashBalance = $this->balanceService->calculateTotalCashBalance();
            
            if ($totalCashBalance < $amount) {
                $shortage = $amount - $totalCashBalance;
                return [
                    'success' => false,
                    'message' => 'Saldo Cash tidak mencukupi',
                    'data' => [
                        'available_cash' => $totalCashBalance,
                        'requested' => $amount,
                        'shortage' => $shortage,
                        'hint' => 'Silakan melakukan penarikan dari Bank terlebih dahulu'
                    ],
                    'status_code' => 422
                ];
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

            return [
                'success' => true,
                'data' => $wallet,
                'transaction' => $txn,
                'status_code' => 200
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Wallet debit error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Debit failed',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Get transaction history for a santri
     * 
     * @param string $santriId
     * @param Request $request
     * @return array
     */
    public function getTransactions(string $santriId, Request $request): array
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();
        if (!$wallet) {
            return [];
        }

        $query = WalletTransaction::where('wallet_id', $wallet->id)
            ->with('author')
            ->orderBy('created_at', 'desc');

        // ?view=wali → sembunyikan transaksi voided dan entri reversal admin
        // Digunakan oleh mobile / tampilan wali santri agar riwayat tetap bersih
        $isWaliView = $request->query('view') === 'wali';
        if ($isWaliView) {
            $query->where(function ($q) {
                $q->where('voided', '!=', 1)->orWhereNull('voided');
            })->whereNotIn('method', ['admin-void', 'admin-reverse']);
        }

        $txns = $query->get()->map(function ($t) {
            return $this->formatTransaction($t);
        });
            
        return $txns->toArray();
    }

    /**
     * Update a transaction: edit in place and save original values as audit trail.
     * No reversal entry is created — history remains clean for wali santri.
     * Only admin allowed.
     * 
     * @param Request $request
     * @param int $id
     * @return array
     */
    public function updateTransaction(Request $request, int $id): array
    {
        $validator = Validator::make($request->all(), [
            'amount'      => 'required|numeric|min:0.01',
            'description' => 'string|nullable',
            'method'      => 'nullable|in:cash,transfer,epos',
            'type'        => 'nullable|in:credit,debit,epos_in,epos_out,withdraw'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        $newAmount      = $request->input('amount');
        $newDescription = $request->input('description');
        $newMethod      = $request->input('method', null);
        $newType        = $request->input('type', null);

        DB::beginTransaction();
        try {
            $txn = WalletTransaction::find($id);
            if (!$txn) {
                return [
                    'success' => false,
                    'message' => 'Transaction not found',
                    'status_code' => 404
                ];
            }
            
            if ($txn->voided) {
                return [
                    'success' => false,
                    'message' => 'Transaction already voided',
                    'status_code' => 422
                ];
            }

            $wallet = Wallet::find($txn->wallet_id);
            if (!$wallet) {
                return [
                    'success' => false,
                    'message' => 'Wallet not found',
                    'status_code' => 404
                ];
            }

            // Audit: simpan nilai lama hanya untuk edit pertama kali
            if (is_null($txn->original_amount)) {
                $txn->original_amount      = $txn->amount;
                $txn->original_method      = $txn->method;
                $txn->original_description = $txn->description;
            }

            // Sesuaikan saldo: balik efek lama, terapkan efek baru
            $finalType = $newType ?: $txn->type;
            if ($txn->type === 'credit') {
                $wallet->balance -= $txn->amount;   // balik lama
            } else {
                $wallet->balance += $txn->amount;
            }
            if ($finalType === 'credit') {
                $wallet->balance += $newAmount;     // terapkan baru
            } else {
                $wallet->balance -= $newAmount;
            }
            $wallet->save();

            // Update transaksi asli — TIDAK membuat entri baru
            // timestamps = false agar created_at dan updated_at tidak berubah
            $txn->timestamps = false;
            $txn->amount       = $newAmount;
            $txn->description  = $newDescription;
            $txn->method       = $newMethod ?? $txn->method;
            $txn->type         = $finalType;
            $txn->balance_after = $wallet->balance;
            $txn->edited_at    = now();
            $txn->edited_by    = $request->user()->id;
            $txn->save();
            $txn->timestamps = true;

            DB::commit();

            return [
                'success' => true,
                'data' => ['wallet' => $wallet, 'transaction' => $txn],
                'status_code' => 200
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Update transaction error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Update failed',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Void (delete) a transaction: buat reversal dan tandai transaksi asli sebagai voided.
     * Alasan void wajib diisi admin agar wali santri dapat memahami konteksnya.
     * 
     * @param Request $request
     * @param int $id
     * @return array
     */
    public function voidTransaction(Request $request, int $id): array
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Alasan hapus transaksi wajib diisi',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        $reason = $request->input('reason');

        DB::beginTransaction();
        try {
            $orig = WalletTransaction::find($id);
            if (!$orig) {
                return [
                    'success' => false,
                    'message' => 'Transaction not found',
                    'status_code' => 404
                ];
            }
            
            if ($orig->voided) {
                return [
                    'success' => false,
                    'message' => 'Transaction already voided',
                    'status_code' => 422
                ];
            }

            $wallet = Wallet::find($orig->wallet_id);
            if (!$wallet) {
                return [
                    'success' => false,
                    'message' => 'Wallet not found',
                    'status_code' => 404
                ];
            }

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
                'wallet_id'   => $wallet->id,
                'type'        => $reverseType,
                'amount'      => $orig->amount,
                'balance_after' => $wallet->balance,
                'description' => 'Koreksi admin: ' . $reason,
                'reference'   => $refReverse,
                'method'      => 'admin-void',
                'created_by'  => $request->user()->id,
                'reversed_of' => $orig->id,
            ]);

            $orig->voided     = true;
            $orig->voided_by  = $request->user()->id;
            $orig->void_reason = $reason;
            $orig->save();

            DB::commit();
            
            return [
                'success' => true,
                'data' => ['wallet' => $wallet, 'reversal' => $revTx],
                'status_code' => 200
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Void transaction error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Void failed',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Admin: list all transactions with optional filters (santri_id, type, date range)
     * 
     * @param Request $request
     * @return array
     */
    public function getAllTransactions(Request $request): array
    {
        $q = WalletTransaction::query();

        if ($request->has('santri_id')) {
            $santriId = $request->query('santri_id');
            $wallet = Wallet::where('santri_id', $santriId)->first();
            if ($wallet) {
                $q->where('wallet_id', $wallet->id);
            } else {
                return [
                    'success' => true,
                    'data' => [],
                    'meta' => ['total' => 0, 'page' => 1, 'per_page' => 25, 'last_page' => 0]
                ];
            }
        }

        if ($request->has('type')) {
            $q->where('type', $request->query('type'));
        }

        if ($request->has('start') && $request->has('end')) {
            $q->whereBetween('created_at', [$request->query('start'), $request->query('end')]);
        }

        if ($request->has('method') && $request->query('method') !== '') {
            $q->where('method', $request->query('method'));
        }

        if ($request->has('search') && $request->query('search') !== '') {
            $search = $request->query('search');
            $q->whereHas('wallet.santri', function($sq) use ($search) {
                $sq->where('nama_santri', 'like', "%{$search}%")
                   ->orWhere('nis', 'like', "%{$search}%");
            });
        }

        if ($request->has('created_by') && $request->query('created_by') !== '') {
            $q->where('created_by', $request->query('created_by'));
        }

        $perPage = (int)($request->query('per_page', 25));
        if ($perPage > 10000) {
            $perPage = 10000;
        }
        $page = max((int)($request->query('page', 1)), 1);

        $total = $q->count();
        $items = $q->with(['wallet.santri','author'])
            ->orderBy('created_at', 'desc')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return [
            'success' => true,
            'data' => $items,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int)ceil($total / $perPage),
            ]
        ];
    }

    /**
     * Format transaction for API response
     * 
     * @param WalletTransaction $t
     * @return array
     */
    private function formatTransaction($t): array
    {
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
            'void_reason' => $t->void_reason,
            // Audit edit
            'edited_at' => $t->edited_at ? $t->edited_at->toIso8601String() : null,
            'edited_by' => $t->edited_by,
            'original_amount' => $t->original_amount,
            'original_method' => $t->original_method,
            'original_description' => $t->original_description,
        ];
    }
}
