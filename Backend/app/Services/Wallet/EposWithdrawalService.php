<?php

namespace App\Services\Wallet;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\EposPool;
use App\Models\EposWithdrawal;

/**
 * EPOS Withdrawal Service
 * 
 * Handles all EPOS withdrawal operations.
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - Create EPOS withdrawal requests
 * - Get withdrawal status
 * - Approve withdrawals (with balance validation)
 * - Reject withdrawals (from admin or ePOS)
 * - List all withdrawals
 * - Send callbacks to ePOS system
 */
class EposWithdrawalService
{
    protected WalletBalanceService $balanceService;

    public function __construct(WalletBalanceService $balanceService)
    {
        $this->balanceService = $balanceService;
    }

    /**
     * Create withdrawal request from EPOS
     * 
     * @param Request $request
     * @return array
     */
    public function createWithdrawal(Request $request): array
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
            return [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        try {
            $withdrawal = EposWithdrawal::create([
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

            return [
                'success' => true,
                'message' => 'Withdrawal request created',
                'data' => $withdrawal,
                'status_code' => 201
            ];

        } catch (\Exception $e) {
            \Log::error('Create EPOS withdrawal error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create withdrawal request',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Get withdrawal status by withdrawal number
     * 
     * @param string $withdrawalNumber
     * @return array
     */
    public function getWithdrawalStatus(string $withdrawalNumber): array
    {
        $withdrawal = EposWithdrawal::where('withdrawal_number', $withdrawalNumber)->first();

        if (!$withdrawal) {
            return [
                'success' => false,
                'message' => 'Withdrawal not found',
                'status_code' => 404
            ];
        }

        return [
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
            ],
            'status_code' => 200
        ];
    }

    /**
     * Approve EPOS withdrawal request
     * 
     * @param Request $request
     * @param int $id
     * @return array
     */
    public function approveWithdrawal(Request $request, int $id): array
    {
        $validator = Validator::make($request->all(), [
            'payment_method' => 'required|in:cash,transfer'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        $paymentMethod = $request->input('payment_method');

        DB::beginTransaction();
        try {
            $withdrawal = EposWithdrawal::findOrFail($id);

            if ($withdrawal->status !== EposWithdrawal::STATUS_PENDING) {
                return [
                    'success' => false,
                    'message' => 'Withdrawal sudah diproses sebelumnya',
                    'status_code' => 422
                ];
            }

            // Get EPOS pool
            $pool = EposPool::where('name', 'epos_main')->first();
            if (!$pool) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'EPOS pool tidak ditemukan',
                    'status_code' => 404
                ];
            }

            // Check if pool has enough balance
            if ($pool->balance < $withdrawal->amount) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Saldo pool tidak mencukupi',
                    'data' => [
                        'pool_balance' => $pool->balance,
                        'withdrawal_amount' => $withdrawal->amount
                    ],
                    'status_code' => 422
                ];
            }

            // VALIDASI: Cek saldo sesuai payment method
            if ($paymentMethod === 'cash') {
                $totalCashBalance = $this->balanceService->calculateTotalCashBalance();
                
                if ($totalCashBalance < $withdrawal->amount) {
                    DB::rollBack();
                    $shortage = $withdrawal->amount - $totalCashBalance;
                    return [
                        'success' => false,
                        'message' => 'Saldo Cash sekolah tidak mencukupi',
                        'data' => [
                            'available_cash' => $totalCashBalance,
                            'requested' => $withdrawal->amount,
                            'shortage' => $shortage,
                            'hint' => 'Silakan tarik dana dari Bank ke Cash terlebih dahulu'
                        ],
                        'status_code' => 422
                    ];
                }
            } else if ($paymentMethod === 'transfer') {
                $totalBankBalance = $this->balanceService->calculateTotalBankBalance();
                
                if ($totalBankBalance < $withdrawal->amount) {
                    DB::rollBack();
                    $shortage = $withdrawal->amount - $totalBankBalance;
                    return [
                        'success' => false,
                        'message' => 'Saldo Bank/Transfer sekolah tidak mencukupi',
                        'data' => [
                            'available_bank' => $totalBankBalance,
                            'requested' => $withdrawal->amount,
                            'shortage' => $shortage
                        ],
                        'status_code' => 422
                    ];
                }
            }

            // Deduct from pool
            $pool->balance -= $withdrawal->amount;
            $pool->save();

            // Update withdrawal status
            $withdrawal->status = EposWithdrawal::STATUS_APPROVED;
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
            $this->sendCallback($withdrawal, 'approved', auth()->user()->name ?? 'Admin SIMPELS', 'Penarikan disetujui oleh SIMPELS');

            return [
                'success' => true,
                'message' => 'Withdrawal berhasil disetujui',
                'data' => [
                    'withdrawal' => $withdrawal,
                    'pool_balance' => $pool->balance
                ],
                'status_code' => 200
            ];

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan',
                'status_code' => 404
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to approve EPOS withdrawal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Gagal menyetujui withdrawal: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Reject EPOS withdrawal request by withdrawal number (from ePOS)
     * 
     * @param Request $request
     * @param string $withdrawalNumber
     * @return array
     */
    public function rejectWithdrawalByNumber(Request $request, string $withdrawalNumber): array
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Alasan penolakan harus diisi (minimal 5 karakter)',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        DB::beginTransaction();
        try {
            $withdrawal = EposWithdrawal::where('withdrawal_number', $withdrawalNumber)->firstOrFail();

            if ($withdrawal->status === EposWithdrawal::STATUS_REJECTED) {
                return [
                    'success' => true,
                    'message' => 'Withdrawal sudah ditolak sebelumnya',
                    'status_code' => 200
                ];
            }

            if ($withdrawal->status === EposWithdrawal::STATUS_COMPLETED) {
                return [
                    'success' => false,
                    'message' => 'Withdrawal yang sudah selesai tidak bisa dibatalkan',
                    'status_code' => 422
                ];
            }

            // Update withdrawal status
            $withdrawal->status = EposWithdrawal::STATUS_REJECTED;
            $withdrawal->rejected_by = 1; // System/ePOS
            $withdrawal->rejected_at = now();
            $withdrawal->rejection_reason = $request->reason;
            $withdrawal->save();

            DB::commit();

            \Log::info('EPOS withdrawal rejected from ePOS', [
                'withdrawal_number' => $withdrawalNumber,
                'reason' => $request->reason
            ]);

            return [
                'success' => true,
                'message' => 'Withdrawal berhasil ditolak',
                'data' => [
                    'withdrawal' => $withdrawal
                ],
                'status_code' => 200
            ];

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan',
                'status_code' => 404
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reject EPOS withdrawal from ePOS', [
                'withdrawal_number' => $withdrawalNumber,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Gagal menolak withdrawal: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Reject EPOS withdrawal request by ID (from admin)
     * 
     * @param Request $request
     * @param int $id
     * @return array
     */
    public function rejectWithdrawal(Request $request, int $id): array
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Alasan penolakan harus diisi (minimal 5 karakter)',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
        }

        DB::beginTransaction();
        try {
            $withdrawal = EposWithdrawal::findOrFail($id);

            if ($withdrawal->status !== EposWithdrawal::STATUS_PENDING) {
                return [
                    'success' => false,
                    'message' => 'Withdrawal sudah diproses sebelumnya',
                    'status_code' => 422
                ];
            }

            // Update withdrawal status
            $withdrawal->status = EposWithdrawal::STATUS_REJECTED;
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
            $this->sendCallback($withdrawal, 'rejected', auth()->user()->name ?? 'Admin SIMPELS', 'Penarikan ditolak: ' . $request->reason);

            return [
                'success' => true,
                'message' => 'Withdrawal berhasil ditolak',
                'data' => $withdrawal,
                'status_code' => 200
            ];

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Withdrawal tidak ditemukan',
                'status_code' => 404
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reject EPOS withdrawal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'success' => false,
                'message' => 'Gagal menolak withdrawal: ' . $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * List all EPOS withdrawal requests
     * 
     * @param Request $request
     * @return array
     */
    public function listWithdrawals(Request $request): array
    {
        $query = EposWithdrawal::query()->orderBy('created_at', 'desc');

        // Filter by status - default tampilkan semua untuk history lengkap
        $status = $request->input('status', 'all');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $withdrawals = $query->get();

        return [
            'success' => true,
            'data' => $withdrawals,
            'meta' => [
                'status_filter' => $status,
                'total' => $withdrawals->count()
            ]
        ];
    }

    /**
     * Send callback to ePOS system
     * 
     * @param EposWithdrawal $withdrawal
     * @param string $status
     * @param string $updatedBy
     * @param string $notes
     * @return void
     */
    private function sendCallback(EposWithdrawal $withdrawal, string $status, string $updatedBy, string $notes): void
    {
        try {
            $eposApiUrl = config('services.epos.api_url');
            if ($eposApiUrl) {
                \Illuminate\Support\Facades\Http::timeout(10)
                    ->put($eposApiUrl . '/api/simpels/withdrawal/' . $withdrawal->withdrawal_number . '/status', [
                        'status' => $status,
                        'updated_by' => $updatedBy,
                        'notes' => $notes,
                        'updated_at' => now()->toDateTimeString(),
                    ]);

                \Log::info('Callback sent to EPOS for withdrawal ' . $status, [
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
    }
}
