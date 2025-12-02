<?php

namespace App\Http\Controllers;

use App\Models\CollectivePayment;
use App\Models\CollectivePaymentItem;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;
use Illuminate\Http\Request;
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
        ]);

        DB::beginTransaction();
        try {
            // Get target santri
            $santris = $this->getTargetSantri($request);

            if ($santris->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Tidak ada santri yang valid'], 422);
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
                'created_by' => $request->user()->id,
            ]);

            // Create items and process payment
            $collected = 0;
            $outstanding = 0;

            foreach ($santris as $santri) {
                $wallet = Wallet::where('santri_id', $santri->id)->first();
                
                if (!$wallet) continue;

                $item = CollectivePaymentItem::create([
                    'collective_payment_id' => $payment->id,
                    'santri_id' => $santri->id,
                    'wallet_id' => $wallet->id,
                    'amount' => $request->amount_per_santri,
                    'status' => 'pending',
                ]);

                // Try to process payment immediately
                $result = $this->processPaymentItem($item, $wallet, $request->user()->id);
                
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
            return response()->json([
                'success' => true,
                'message' => 'Tagihan kolektif berhasil dibuat',
                'data' => $payment->load('items.santri')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Create collective payment error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membuat tagihan', 'error' => $e->getMessage()], 500);
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
     * Helper: Get target santri based on request
     */
    private function getTargetSantri(Request $request)
    {
        if ($request->target_type === 'all') {
            return Santri::all();
        } elseif ($request->target_type === 'class') {
            return Santri::where('kelas_id', $request->class_id)->get();
        } else {
            return Santri::whereIn('id', $request->santri_ids)->get();
        }
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
