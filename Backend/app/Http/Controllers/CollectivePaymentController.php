<?php

namespace App\Http\Controllers;

use App\Models\CollectivePayment;
use App\Models\CollectivePaymentItem;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CollectivePaymentController extends Controller
{
    /**
     * List all collective payments
     * GET /api/v1/collective-payments
     */
    public function index()
    {
        $payments = CollectivePayment::with(['creator', 'class'])
            ->withCount([
                'items as paid_count' => function($q) { $q->where('status', 'paid'); },
                'items as pending_count' => function($q) { $q->where('status', 'pending'); }
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $payments]);
    }

    /**
     * Collective payment history summary grouped by year and month
     * GET /api/v1/collective-payments/history/summary
     */
    public function historySummary()
    {
        $recent = CollectivePayment::with(['creator', 'class'])
            ->withCount([
                'items as paid_count' => function($q) { $q->where('status', 'paid'); },
                'items as pending_count' => function($q) { $q->where('status', 'pending'); }
            ])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $monthNames = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        $grouped = CollectivePayment::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as total')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at) DESC, MONTH(created_at) DESC')
            ->get()
            ->groupBy('year')
            ->map(function ($months, $year) use ($monthNames) {
                return [
                    'year' => (int) $year,
                    'months' => $months->map(function ($item) use ($monthNames) {
                        $month = (int) $item->month;
                        return [
                            'month' => $month,
                            'label' => $monthNames[$month] ?? (string) $month,
                            'total' => (int) $item->total,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'recent' => $recent,
                'years' => $grouped,
            ],
        ]);
    }

    /**
     * Collective payment history by selected year and month
     * GET /api/v1/collective-payments/history/by-month?year=2026&month=7
     */
    public function historyByMonth(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $year = (int) $request->query('year');
        $month = (int) $request->query('month');
        $perPage = (int) $request->query('per_page', 25);

        $payments = CollectivePayment::with(['creator', 'class'])
            ->withCount([
                'items as paid_count' => function($q) { $q->where('status', 'paid'); },
                'items as pending_count' => function($q) { $q->where('status', 'pending'); }
            ])
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Show detail of a collective payment with items
     * GET /api/v1/collective-payments/{id}
     */
    public function show($id)
    {
        $payment = CollectivePayment::with([
            'creator',
            'class',
            'items' => function($q) {
                $q->with(['santri', 'wallet', 'transaction'])
                  ->orderBy('status', 'asc') // pending first
                  ->orderBy('santri_id');
            }
        ])->find($id);

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
        }

        return response()->json(['success' => true, 'data' => $payment]);
    }

    /**
     * Create new collective payment
     * POST /api/v1/collective-payments
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount_per_santri' => 'required|numeric|min:0',
            'target_type' => 'required|in:individual,class,all',
            'class_id' => 'required_if:target_type,class|exists:kelas,id',
            'santri_ids' => 'required_if:target_type,individual|array',
            'santri_ids.*' => 'exists:santri,id',
        ]);

        $userId = (int) $request->user()->id;
        $payloadHash = $this->buildRequestHash($request);
        $doneCacheKey = "collective_payment:done:{$userId}:{$payloadHash}";
        $lockCacheKey = "collective_payment:lock:{$userId}:{$payloadHash}";

        $existingPaymentId = Cache::get($doneCacheKey);
        if ($existingPaymentId) {
            $existingPayment = CollectivePayment::with('items.santri')->find($existingPaymentId);
            if ($existingPayment) {
                return response()->json([
                    'success' => true,
                    'message' => 'Request duplikat terdeteksi, data sebelumnya dikembalikan',
                    'data' => $existingPayment,
                    'idempotent' => true,
                ]);
            }
        }

        $lock = Cache::lock($lockCacheKey, 30);
        if (! $lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'Permintaan yang sama sedang diproses, tunggu beberapa detik',
            ], 429);
        }

        try {
            DB::beginTransaction();

            // Get target santri
            $santris = $this->getTargetSantri($request);

            if ($request->target_type === 'individual') {
                $requestedSantriIds = collect($request->input('santri_ids', []))
                    ->map(fn ($id) => (string) $id)
                    ->unique();

                $activeSantriIds = $santris->pluck('id')->map(fn ($id) => (string) $id);
                $invalidSantriIds = $requestedSantriIds->diff($activeSantriIds)->values();

                if ($invalidSantriIds->isNotEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Hanya santri aktif yang dapat dipilih untuk tagihan kolektif',
                        'invalid_santri_ids' => $invalidSantriIds,
                    ], 422);
                }
            }

            if ($santris->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada santri aktif yang valid',
                ], 422);
            }

            // Create collective payment
            $payment = CollectivePayment::create([
                'title' => $request->title,
                'description' => $request->description,
                'amount_per_santri' => $request->amount_per_santri,
                'target_type' => $request->target_type,
                'class_id' => $request->class_id,
                'total_santri' => $santris->count(),
                'collected_amount' => 0,
                'outstanding_amount' => $santris->count() * $request->amount_per_santri,
                'status' => 'active',
                'created_by' => $userId,
            ]);

            // Create items and process payment
            $collected = 0;
            $outstanding = 0;
            $skipped = 0;

            foreach ($santris as $santri) {
                // Ensure wallet exists for santri
                $wallet = Wallet::where('santri_id', $santri->id)->first();
                
                if (!$wallet) {
                    // Create wallet if not exists
                    $wallet = Wallet::create([
                        'santri_id' => $santri->id,
                        'balance' => 0
                    ]);
                    $skipped++;
                }

                $item = CollectivePaymentItem::create([
                    'collective_payment_id' => $payment->id,
                    'santri_id' => $santri->id,
                    'wallet_id' => $wallet->id,
                    'amount' => $request->amount_per_santri,
                    'status' => 'pending',
                ]);

                // Try to process payment immediately
                $result = $this->processPaymentItem($item, $wallet, $userId);
                
                if ($result['success']) {
                    $collected += $request->amount_per_santri;
                } else {
                    $outstanding += $request->amount_per_santri;
                }
            }

            // Update payment totals
            $payment->update([
                'collected_amount' => $collected,
                'outstanding_amount' => $outstanding,
                'status' => $outstanding > 0 ? 'active' : 'completed'
            ]);

            DB::commit();
            Cache::put($doneCacheKey, $payment->id, now()->addSeconds(60));

            return response()->json([
                'success' => true,
                'message' => 'Tagihan kolektif berhasil dibuat',
                'data' => $payment->load('items.santri')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Create collective payment error: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Gagal membuat tagihan', 'error' => $e->getMessage()], 500);
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Retry failed/pending items
     * POST /api/v1/collective-payments/{id}/retry
     */
    public function retry(Request $request, $id)
    {
        $payment = CollectivePayment::find($id);
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
        }

        DB::beginTransaction();
        try {
            $pendingItems = $payment->items()->pending()->with(['wallet'])->get();
            $processed = 0;

            foreach ($pendingItems as $item) {
                $result = $this->processPaymentItem($item, $item->wallet, $request->user()->id);
                if ($result['success']) {
                    $processed++;
                }
            }

            // Recalculate totals
            $paidSum = $payment->items()->paid()->sum('amount');
            $pendingSum = $payment->items()->pending()->sum('amount');

            $payment->update([
                'collected_amount' => $paidSum,
                'outstanding_amount' => $pendingSum,
                'status' => $pendingSum > 0 ? 'active' : 'completed'
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => "$processed pembayaran berhasil diproses",
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Retry payment error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal retry pembayaran'], 500);
        }
    }

    /**
     * Cancel collective payment and refund deducted balances
     * POST /api/v1/collective-payments/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $payment = CollectivePayment::where('id', $id)->lockForUpdate()->first();

            if (!$payment) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
            }

            if ($payment->status === 'cancelled') {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'message' => 'Tagihan sudah dibatalkan sebelumnya',
                    'idempotent' => true,
                    'data' => $payment,
                ]);
            }

            $paidItems = CollectivePaymentItem::with(['santri'])
                ->where('collective_payment_id', $payment->id)
                ->where('status', 'paid')
                ->whereNotNull('transaction_id')
                ->lockForUpdate()
                ->get();

            $walletIds = $paidItems->pluck('wallet_id')->filter()->unique()->values();
            $wallets = Wallet::whereIn('id', $walletIds)->lockForUpdate()->get()->keyBy('id');

            $refundedCount = 0;
            $refundedAmount = 0;
            $refundedSantri = [];

            foreach ($paidItems as $item) {
                $wallet = $wallets->get($item->wallet_id);

                if (!$wallet) {
                    continue;
                }

                $amount = (float) $item->amount;
                $wallet->balance += $amount;
                $wallet->save();

                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'credit',
                    'amount' => $amount,
                    'balance_after' => $wallet->balance,
                    'description' => 'Pengembalian saldo pembatalan: ' . $payment->title,
                    'reference' => 'CP-CANCEL-' . $payment->id . '-' . $item->id,
                    'method' => 'cash',
                    'created_by' => (int) $request->user()->id,
                    'reversed_of' => $item->transaction_id,
                ]);

                $refundedCount++;
                $refundedAmount += $amount;
                $refundedSantri[] = [
                    'santri_id' => $item->santri_id,
                    'santri_name' => $item->santri->nama_santri ?? null,
                    'amount' => $amount,
                ];
            }

            $payment->update([
                'status' => 'cancelled',
                'collected_amount' => 0,
                'outstanding_amount' => 0,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tagihan dibatalkan dan saldo berhasil dikembalikan',
                'data' => [
                    'payment' => $payment->fresh(),
                    'refunded_count' => $refundedCount,
                    'refunded_amount' => $refundedAmount,
                    'refunded_santri' => $refundedSantri,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cancel collective payment error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membatalkan tagihan'], 500);
        }
    }

    /**
     * Delete cancelled collective payment
     * DELETE /api/v1/collective-payments/{id}
     */
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $payment = CollectivePayment::where('id', $id)->lockForUpdate()->first();

            if (!$payment) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Tagihan tidak ditemukan'], 404);
            }

            if ($payment->status !== 'cancelled') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya tagihan yang sudah dibatalkan yang bisa dihapus',
                ], 422);
            }

            $payment->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tagihan dibatalkan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Delete collective payment error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menghapus tagihan'], 500);
        }
    }

    /**
     * Helper: Get target santri based on request
     */
    private function getTargetSantri(Request $request)
    {
        if ($request->target_type === 'all') {
            return Santri::where('status', 'aktif')->get();
        } elseif ($request->target_type === 'class') {
            return Santri::where('kelas_id', $request->class_id)
                ->where('status', 'aktif')
                ->get();
        } else {
            return Santri::whereIn('id', $request->santri_ids)
                ->where('status', 'aktif')
                ->get();
        }
    }

    private function buildRequestHash(Request $request): string
    {
        $santriIds = collect($request->input('santri_ids', []))
            ->map(fn ($id) => (string) $id)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $payload = [
            'title' => trim((string) $request->input('title', '')),
            'description' => trim((string) $request->input('description', '')),
            'amount_per_santri' => (float) $request->input('amount_per_santri', 0),
            'target_type' => (string) $request->input('target_type', ''),
            'class_id' => $request->input('class_id') ? (int) $request->input('class_id') : null,
            'santri_ids' => $santriIds,
        ];

        return hash('sha256', json_encode($payload));
    }

    /**
     * Helper: Process payment for a single item
     */
    private function processPaymentItem(CollectivePaymentItem $item, Wallet $wallet, $userId)
    {
        // Check if sufficient balance
        if ($wallet->balance < $item->amount) {
            $item->update([
                'failure_reason' => 'Saldo tidak mencukupi (Rp ' . number_format($wallet->balance, 0, ',', '.') . ')'
            ]);
            return ['success' => false, 'reason' => 'insufficient_balance'];
        }

        // Create debit transaction
        $reference = 'CP-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
        
        $transaction = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $item->amount,
            'balance_after' => $wallet->balance - $item->amount,
            'description' => $item->collectivePayment->title,
            'reference' => $reference,
            'method' => 'cash',
            'created_by' => $userId,
        ]);

        // Update wallet balance
        $wallet->decrement('balance', $item->amount);

        // Update item status
        $item->update([
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_id' => $transaction->id,
            'failure_reason' => null,
        ]);

        return ['success' => true, 'transaction_id' => $transaction->id];
    }
}
