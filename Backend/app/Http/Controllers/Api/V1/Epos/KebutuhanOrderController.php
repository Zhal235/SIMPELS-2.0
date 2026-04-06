<?php

namespace App\Http\Controllers\Api\V1\Epos;

use App\Http\Controllers\Controller;
use App\Models\EposKebutuhanOrder;
use App\Models\EposPool;
use App\Models\Notification;
use App\Models\Santri;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\EposCallbackService;
use App\Services\WaMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class KebutuhanOrderController extends Controller
{
    // -----------------------------------------------------------------------
    // EPOS endpoints (public, sama pola dengan epos/transaction)
    // -----------------------------------------------------------------------

    /**
     * Terima pesanan kebutuhan dari EPOS
     * POST /api/v1/epos/kebutuhan-order
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'epos_order_id' => 'required|string|unique:epos_kebutuhan_orders,epos_order_id',
            'santri_id'     => 'required|exists:santri,id',
            'santri_name'   => 'required|string',
            'items'         => 'required|array|min:1',
            'items.*.name'  => 'required|string',
            'items.*.qty'   => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'total_amount'  => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Auto-confirm order lama sebelum buat baru
        EposKebutuhanOrder::autoConfirmOldOrders();

        $order = EposKebutuhanOrder::create([
            'epos_order_id' => $request->epos_order_id,
            'santri_id'     => $request->santri_id,
            'santri_name'   => $request->santri_name,
            'rfid_uid'      => $request->rfid_uid,
            'items'         => $request->items,
            'total_amount'  => $request->total_amount,
            'cashier_name'  => $request->cashier_name,
            'terminal_id'   => $request->terminal_id,
        ]);

        // Kirim notifikasi ke orang tua santri
        $this->notifyWali($order);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan kebutuhan diterima, notifikasi dikirim ke orang tua',
            'data'    => [
                'id'            => $order->id,
                'epos_order_id' => $order->epos_order_id,
                'status'        => $order->status,
                'expired_at'    => $order->expired_at->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Polling status pesanan kebutuhan santri (untuk EPOS, cache 1 jam di sisi EPOS)
     * GET /api/v1/epos/kebutuhan-order/santri/{santriId}/pending
     */
    public function pendingForSantri(string $santriId): JsonResponse
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        $orders = EposKebutuhanOrder::forSantri((string)$santriId)
            ->whereIn('status', ['pending', 'confirmed', 'rejected'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($o) => $this->formatOrder($o));

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ]);
    }

    // -----------------------------------------------------------------------
    // Wali (mobile) endpoints — auth:sanctum
    // -----------------------------------------------------------------------

    /**
     * Daftar pesanan kebutuhan santri untuk mobile wali
     * GET /api/v1/wali/kebutuhan-orders/{santriId}
     */
    public function indexForWali(Request $request, string $santriId): JsonResponse
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        $this->authorizeWaliForSantri($request, $santriId);

        $orders = EposKebutuhanOrder::forSantri($santriId)
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(fn($o) => $this->formatOrder($o));

        $pendingCount = EposKebutuhanOrder::forSantri($santriId)->pending()->count();

        return response()->json([
            'success'       => true,
            'data'          => $orders,
            'pending_count' => $pendingCount,
        ]);
    }

    /**
     * Konfirmasi atau tolak pesanan kebutuhan oleh wali
     * POST /api/v1/wali/kebutuhan-orders/{orderId}/respond
     */
    public function respondByWali(Request $request, int $orderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'action'           => 'required|in:confirm,reject',
            'rejection_reason' => 'required_if:action,reject|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $order = EposKebutuhanOrder::findOrFail($orderId);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah tidak bisa dikonfirmasi (status: ' . $order->status . ')',
            ], 422);
        }

        if ($order->isExpired()) {
            $order->update(['status' => 'expired']);
            return response()->json(['success' => false, 'message' => 'Pesanan telah kedaluwarsa'], 422);
        }

        // Pastikan wali ini merupakan wali dari santri pesanan ini
        $this->authorizeWaliForSantri($request, $order->santri_id);

        if ($request->action === 'confirm') {
            return $this->processConfirm($order, $request->user()->id, 'wali');
        }

        $order->update([
            'status'           => 'rejected',
            'confirmed_by_id'  => $request->user()->id,
            'confirmed_by'     => 'wali',
            'confirmed_at'     => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        // Push status ke EPOS
        (new EposCallbackService())->pushOrderStatus($order->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan ditolak',
            'data'    => $this->formatOrder($order->fresh()),
        ]);
    }

    // -----------------------------------------------------------------------
    // Admin endpoints — auth:sanctum + role:admin
    // -----------------------------------------------------------------------

    /**
     * Semua pesanan kebutuhan (admin)
     * GET /api/v1/admin/kebutuhan-orders
     */
    public function indexForAdmin(Request $request): JsonResponse
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        $query = EposKebutuhanOrder::with('santri')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->santri_id, fn($q) => $q->where('santri_id', $request->santri_id))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at');

        $orders = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data'    => $orders->getCollection()->map(fn($o) => $this->formatOrder($o)),
            'meta'    => [
                'total'        => $orders->total(),
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * Konfirmasi manual oleh admin
     * POST /api/v1/admin/kebutuhan-orders/{orderId}/confirm
     */
    public function confirmByAdmin(Request $request, int $orderId): JsonResponse
    {
        $order = EposKebutuhanOrder::findOrFail($orderId);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak dalam status pending (status: ' . $order->status . ')',
            ], 422);
        }

        return $this->processConfirm($order, $request->user()->id, 'admin');
    }

    /**
     * Tolak manual oleh admin
     * POST /api/v1/admin/kebutuhan-orders/{orderId}/reject
     */
    public function rejectByAdmin(Request $request, int $orderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $order = EposKebutuhanOrder::findOrFail($orderId);

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak dalam status pending',
            ], 422);
        }

        $order->update([
            'status'           => 'rejected',
            'confirmed_by_id'  => $request->user()->id,
            'confirmed_by'     => 'admin',
            'confirmed_at'     => now(),
            'rejection_reason' => $request->rejection_reason ?? 'Ditolak oleh admin',
        ]);

        // Push status ke EPOS
        (new EposCallbackService())->pushOrderStatus($order->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Pesanan ditolak oleh admin',
            'data'    => $this->formatOrder($order->fresh()),
        ]);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function processConfirm(EposKebutuhanOrder $order, int $userId, string $byType): JsonResponse
    {
        DB::beginTransaction();
        try {
            $wallet = Wallet::where('santri_id', $order->santri_id)->first();

            if (!$wallet) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Wallet santri tidak ditemukan'], 422);
            }

            $settingsRow = \App\Models\WalletSettings::first();
            $minBalance  = $settingsRow ? (float) $settingsRow->global_minimum_balance : 10000;

            if (($wallet->balance - $order->total_amount) < $minBalance) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo santri tidak mencukupi',
                    'data'    => [
                        'saldo'        => (float) $wallet->balance,
                        'min_balance'  => $minBalance,
                        'total_order'  => (float) $order->total_amount,
                    ],
                ], 422);
            }

            // Deduct saldo
            $wallet->balance -= $order->total_amount;
            $wallet->save();

            $itemNames = collect($order->items)->pluck('name')->take(5)->implode(', ');
            $txn = WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'type'        => 'debit',
                'amount'      => $order->total_amount,
                'method'      => 'epos_kebutuhan',
                'description' => 'Kebutuhan: ' . $itemNames,
                'voided'      => false,
            ]);

            // Tambahkan ke EposPool (sama seperti transaksi RFID biasa)
            $pool = EposPool::firstOrCreate(['name' => 'epos_main'], ['balance' => 0]);
            $pool->balance += $order->total_amount;
            $pool->save();

            $order->update([
                'status'               => 'confirmed',
                'confirmed_by_id'      => $userId,
                'confirmed_by'         => $byType,
                'confirmed_at'         => now(),
                'wallet_transaction_id'=> $txn->id,
            ]);

            DB::commit();

            // Push status ke EPOS (fire-and-forget, tidak block response)
            (new EposCallbackService())->pushOrderStatus($order->fresh());

            Log::info('KebutuhanOrder confirmed', [
                'order_id'     => $order->id,
                'by'           => $byType,
                'amount'       => $order->total_amount,
                'new_balance'  => $wallet->balance,
            ]);

            return response()->json([
                'success'     => true,
                'message'     => 'Pesanan dikonfirmasi, saldo santri berhasil dipotong',
                'data'        => $this->formatOrder($order->fresh()),
                'new_balance' => (float) $wallet->balance,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('KebutuhanOrder confirm failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Gagal konfirmasi: ' . $e->getMessage()], 500);
        }
    }

    private function notifyWali(EposKebutuhanOrder $order): void
    {
        try {
            $santri = $order->santri;
            if (!$santri) {
                Log::error('Santri not found for KebutuhanOrder, cannot send notification.', ['order_id' => $order->id]);
                return;
            }

            // Find wali user by matching phone number in users table (where `name` is used for phone login)
            $waliUser = User::where('name', $santri->hp_ayah)
                            ->orWhere('name', $santri->hp_ibu)
                            ->first();

            if (!$waliUser) {
                Log::warning('Wali user not found for santri, cannot send notification.', [
                    'santri_id' => $santri->id,
                    'hp_ayah' => $santri->hp_ayah,
                    'hp_ibu' => $santri->hp_ibu,
                ]);
                // Commented out return to allow WhatsApp notification even without waliUser
                // return;
            }

            $total     = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
            $itemCount = count($order->items);
            $itemNames = collect($order->items)->take(3)->map(function($item) {
                return $item['name'] . ' x' . $item['qty'] . ' @ Rp ' . number_format($item['price'], 0, ',', '.') . ' = Rp ' . number_format($item['subtotal'], 0, ',', '.');
            })->implode("\n");
            $moreCount = $itemCount - 3;
            $more      = $moreCount > 0 ? " (+{$moreCount} lainnya)" : '';
            // Only create in-app notification if wali user exists
            if ($waliUser) {

            // Create in-app notification
            Notification::create([
                'user_id'   => $waliUser->id,
                'user_type' => 'wali',
                'type'      => 'kebutuhan_order',
                'title'     => '🛒 Pesanan Kebutuhan Menunggu Konfirmasi',
                'message'   => "{$order->santri_name} memesan kebutuhan senilai {$total}. Akan dikonfirmasi otomatis dalam 1×24 jam.",
                'data'      => [
                    'order_id'      => $order->id,
                    'epos_order_id' => $order->epos_order_id,
                    'total_amount'  => (float) $order->total_amount,
                    'items_preview' => $itemNames . $more,
                    'expired_at'    => $order->expired_at->format('Y-m-d H:i:s'),
                ],
            ]);

            }
            // Send WhatsApp notification with PWA link
            $this->sendWaNotification($santri, $order, $total, $itemNames, $more);

        } catch (\Exception $e) {
            Log::error('Gagal kirim notif kebutuhan order', ['error' => $e->getMessage()]);
        }
    }

    private function sendWaNotification(Santri $santri, EposKebutuhanOrder $order, string $total, string $itemNames, string $more): void
    {
        try {
            $pwaUrl = rtrim(config('services.mobile.pwa_url', 'https://app-simpels.saza.sch.id'), '/');
            
            $expiredDate = $order->expired_at->timezone('Asia/Jakarta')->format('d M Y H:i');
            $itemCount = count($order->items);
            $orderNumber = $order->epos_order_id;
            
            $waService = app(WaMessageService::class);
            $message = $waService->buildKebutuhanOrderMessage(
                namaSantri: $order->santri_name,
                jumlahItem: $itemCount,
                total: $total,
                daftarBarang: $itemNames . $more,
                nomorPesanan: $orderNumber,
                batasKonfirmasi: $expiredDate,
                linkPwa: $pwaUrl
            );

            $waService->sendToSantriWali($santri, 'kebutuhan_order', $message);

            Log::info('WhatsApp notification sent for kebutuhan order', [
                'order_id' => $order->id,
                'order_number' => $orderNumber,
                'santri_id' => $santri->id,
                'pwa_url' => $pwaUrl,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification for kebutuhan order', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - notification failure shouldn't block order creation
        }
    }

    private function authorizeWaliForSantri(Request $request, string $santriId): void
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        // Admin can access anything (check by role, not by tokenCan to avoid array_flip() issue)
        if ($user->role === 'admin') {
            return;
        }

        // For wali, check if the santriId is in the token's abilities
        $allowedSantriIds = $token->abilities['santri_ids'] ?? [];

        if (!in_array($santriId, $allowedSantriIds)) {
            abort(403, 'Anda tidak memiliki akses ke data santri ini.');
        }
    }

    private function formatOrder(EposKebutuhanOrder $order): array
    {
        return [
            'id'               => $order->id,
            'epos_order_id'    => $order->epos_order_id,
            'santri_id'        => $order->santri_id,
            'santri_name'      => $order->santri_name,
            'items'            => $order->items,
            'total_amount'     => (float) $order->total_amount,
            'status'           => $order->status,
            'confirmed_by'     => $order->confirmed_by,
            'confirmed_at'     => $order->confirmed_at?->format('Y-m-d H:i:s'),
            'expired_at'       => $order->expired_at->format('Y-m-d H:i:s'),
            'rejection_reason' => $order->rejection_reason,
            'created_at'       => $order->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
