<?php

namespace App\Services\EposKebutuhan;

use App\Models\EposKebutuhanOrder;
use App\Models\Santri;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * EposKebutuhanOrderCrudService
 * 
 * Handles CRUD operations for EPOS Kebutuhan Orders
 * Extracted from KebutuhanOrderController to follow single responsibility principle
 */
class EposKebutuhanOrderCrudService
{
    /**
     * Create new kebutuhan order from EPOS
     */
    public function createOrder(array $data): EposKebutuhanOrder
    {
        // Auto-confirm old orders before creating new one
        EposKebutuhanOrder::autoConfirmOldOrders();

        return EposKebutuhanOrder::create([
            'epos_order_id' => $data['epos_order_id'],
            'santri_id'     => $data['santri_id'],
            'santri_name'   => $data['santri_name'],
            'rfid_uid'      => $data['rfid_uid'] ?? null,
            'items'         => $data['items'],
            'total_amount'  => $data['total_amount'],
            'cashier_name'  => $data['cashier_name'] ?? null,
            'terminal_id'   => $data['terminal_id'] ?? null,
        ]);
    }

    /**
     * Get pending orders for specific santri (EPOS polling)
     */
    public function getPendingForSantri(string $santriId): Collection
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        return EposKebutuhanOrder::forSantri($santriId)
            ->whereIn('status', ['pending', 'confirmed', 'rejected'])
            ->latest()
            ->take(10)
            ->get();
    }

    /**
     * Get orders for wali (mobile app)
     */
    public function getOrdersForWali(string $santriId, int $limit = 20): Collection
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        return EposKebutuhanOrder::forSantri($santriId)
            ->orderByDesc('created_at')
            ->take($limit)
            ->get();
    }

    /**
     * Get pending count for santri
     */
    public function getPendingCountForSantri(string $santriId): int
    {
        return EposKebutuhanOrder::forSantri($santriId)->pending()->count();
    }

    /**
     * Get orders for admin with filters and pagination
     */
    public function getOrdersForAdmin(Request $request): LengthAwarePaginator
    {
        EposKebutuhanOrder::autoConfirmOldOrders();

        $query = EposKebutuhanOrder::with('santri')
            ->when($request->status, fn(Builder $q) => $q->where('status', $request->status))
            ->when($request->santri_id, fn(Builder $q) => $q->where('santri_id', $request->santri_id))
            ->when($request->date_from, fn(Builder $q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn(Builder $q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at');

        return $query->paginate($request->per_page ?? 20);
    }

    /**
     * Update order status to rejected
     */
    public function rejectOrder(
        EposKebutuhanOrder $order, 
        int $userId, 
        string $byType, 
        ?string $reason = null
    ): EposKebutuhanOrder {
        $order->update([
            'status'           => 'rejected',
            'confirmed_by_id'  => $userId,
            'confirmed_by'     => $byType,
            'confirmed_at'     => now(),
            'rejection_reason' => $reason ?? ($byType === 'admin' ? 'Ditolak oleh admin' : null),
        ]);

        return $order->fresh();
    }

    /**
     * Check if order can be confirmed (not expired, still pending)
     */
    public function validateOrderForConfirmation(EposKebutuhanOrder $order): array
    {
        if ($order->status !== 'pending') {
            return [
                'valid' => false,
                'message' => 'Pesanan ini sudah tidak bisa dikonfirmasi (status: ' . $order->status . ')'
            ];
        }

        if ($order->isExpired()) {
            $order->update(['status' => 'expired']);
            return [
                'valid' => false, 
                'message' => 'Pesanan telah kedaluwarsa'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Format order for API response
     */
    public function formatOrder(EposKebutuhanOrder $order): array
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