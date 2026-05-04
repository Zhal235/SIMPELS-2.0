<?php

namespace App\Http\Controllers\Api\V1\Epos;

use App\Http\Controllers\Controller;
use App\Models\EposKebutuhanOrder;
use App\Services\EposKebutuhan\EposKebutuhanOrderCrudService;
use App\Services\EposKebutuhan\KebutuhanOrderNotificationService;
use App\Services\EposKebutuhan\KebutuhanOrderPaymentService;
use App\Services\EposKebutuhan\KebutuhanOrderAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * KebutuhanOrderController - Refactored Thin Controller
 * 
 * Handles EPOS Kebutuhan Orders with clean separation of concerns:
 * - EPOS endpoints (public) 
 * - Wali endpoints (auth:sanctum)
 * - Admin endpoints (auth:sanctum + admin role)
 * 
 * Business logic delegated to specialized services:
 * - EposKebutuhanOrderCrudService: CRUD operations
 * - KebutuhanOrderNotificationService: Notifications  
 * - KebutuhanOrderPaymentService: Payment processing
 * - KebutuhanOrderAuthorizationService: Authorization
 */
class KebutuhanOrderController extends Controller
{
    public function __construct(
        private EposKebutuhanOrderCrudService $crudService,
        private KebutuhanOrderNotificationService $notificationService,
        private KebutuhanOrderPaymentService $paymentService,
        private KebutuhanOrderAuthorizationService $authService
    ) {}

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

        // Create order using service
        $order = $this->crudService->createOrder($request->all());

        // Send notification to wali
        $this->notificationService->notifyWaliNewOrder($order);

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
        $orders = $this->crudService->getPendingForSantri($santriId)
            ->map(fn($order) => $this->crudService->formatOrder($order));

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
        $this->authService->authorizeWaliForSantri($request, $santriId);

        $orders = $this->crudService->getOrdersForWali($santriId)
            ->map(fn($order) => $this->crudService->formatOrder($order));
            
        $pendingCount = $this->crudService->getPendingCountForSantri($santriId);

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

        // Validate order can be processed
        $validation = $this->crudService->validateOrderForConfirmation($order);
        if (!$validation['valid']) {
            return response()->json(['success' => false, 'message' => $validation['message']], 422);
        }

        // Authorize wali access
        $this->authService->authorizeWaliForSantri($request, $order->santri_id);

        if ($request->action === 'confirm') {
            return $this->processConfirmation($order, $request->user()->id, 'wali');
        }

        // Handle rejection
        $rejectedOrder = $this->crudService->rejectOrder(
            $order, 
            $request->user()->id, 
            'wali', 
            $request->rejection_reason
        );

        return response()->json([
            'success' => true,
            'message' => 'Pesanan ditolak',
            'data'    => $this->crudService->formatOrder($rejectedOrder),
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
        $orders = $this->crudService->getOrdersForAdmin($request);

        return response()->json([
            'success' => true,
            'data'    => $orders->getCollection()->map(fn($order) => $this->crudService->formatOrder($order)),
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

        return $this->processConfirmation($order, $request->user()->id, 'admin');
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

        $rejectedOrder = $this->crudService->rejectOrder(
            $order, 
            $request->user()->id, 
            'admin', 
            $request->rejection_reason
        );

        return response()->json([
            'success' => true,
            'message' => 'Pesanan ditolak oleh admin',
            'data'    => $this->crudService->formatOrder($rejectedOrder),
        ]);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Process order confirmation (shared by wali and admin)
     */
    private function processConfirmation(EposKebutuhanOrder $order, int $userId, string $byType): JsonResponse
    {
        try {
            $result = $this->paymentService->processConfirmation($order, $userId, $byType);

            return response()->json([
                'success'     => true,
                'message'     => 'Pesanan dikonfirmasi, saldo santri berhasil dipotong',
                'data'        => $this->crudService->formatOrder($result['order']),
                'new_balance' => $result['new_balance'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Gagal konfirmasi: ' . $e->getMessage()
            ], 500);
        }
    }
}