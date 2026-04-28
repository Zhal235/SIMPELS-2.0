<?php

namespace App\Services\EposKebutuhan;

use App\Models\EposKebutuhanOrder;
use App\Models\Notification;
use App\Models\Santri;
use App\Models\User;
use App\Services\WaMessageService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * KebutuhanOrderNotificationService
 * 
 * Handles all notification logic for Kebutuhan Orders
 * Supports both in-app notifications and WhatsApp notifications
 */
class KebutuhanOrderNotificationService
{
    private WaMessageService $waService;

    public function __construct(WaMessageService $waService)
    {
        $this->waService = $waService;
    }

    /**
     * Send notification to wali when new order is created
     */
    public function notifyWaliNewOrder(EposKebutuhanOrder $order): void
    {
        try {
            $santri = $order->santri;
            
            if (!$santri) {
                Log::error('Santri not found for KebutuhanOrder, cannot send notification.', [
                    'order_id' => $order->id
                ]);
                return;
            }

            // Find wali user by matching phone number
            $waliUser = $this->findWaliUser($santri);
            
            // Prepare notification data
            $notificationData = $this->prepareNotificationData($order);

            // Create in-app notification if wali user exists
            if ($waliUser) {
                $this->createInAppNotification($waliUser, $order, $notificationData);
            } else {
                Log::warning('Wali user not found for santri, skipping in-app notification.', [
                    'santri_id' => $santri->id,
                    'hp_ayah' => $santri->hp_ayah,
                    'hp_ibu' => $santri->hp_ibu,
                ]);
            }

            // Send WhatsApp notification (independent of in-app notification)
            $this->sendWhatsAppNotification($santri, $order, $notificationData);

        } catch (\Exception $e) {
            Log::error('Failed to send kebutuhan order notification', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Don't throw - notification failure shouldn't break order creation
        }
    }

    /**
     * Find wali user by phone number
     */
    private function findWaliUser(Santri $santri): ?User
    {
        return User::where('name', $santri->hp_ayah)
                   ->orWhere('name', $santri->hp_ibu)
                   ->first();
    }

    /**
     * Prepare notification data for consistent formatting
     */
    private function prepareNotificationData(EposKebutuhanOrder $order): array
    {
        $total = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
        $itemCount = count($order->items);
        
        $itemsPreview = $this->formatItemsPreview($order->items);
        $moreCount = $itemCount - 3;
        $moreText = $moreCount > 0 ? " (+{$moreCount} lainnya)" : '';

        return [
            'total_formatted' => $total,
            'item_count' => $itemCount,
            'items_preview' => $itemsPreview,
            'more_text' => $moreText,
            'items_preview_with_more' => $itemsPreview . $moreText,
        ];
    }

    /**
     * Format items preview for notification
     */
    private function formatItemsPreview(array $items): string
    {
        return collect($items)
            ->take(3)
            ->map(function($item) {
                $subtotal = $item['qty'] * $item['price'];
                return $item['name'] . ' x' . $item['qty'] . 
                       ' @ Rp ' . number_format($item['price'], 0, ',', '.') . 
                       ' = Rp ' . number_format($subtotal, 0, ',', '.');
            })
            ->implode("\n");
    }

    /**
     * Create in-app notification for wali
     */
    private function createInAppNotification(User $waliUser, EposKebutuhanOrder $order, array $data): void
    {
        Notification::create([
            'user_id'   => $waliUser->id,
            'user_type' => 'wali',
            'type'      => 'kebutuhan_order',
            'title'     => '🛒 Pesanan Kebutuhan Menunggu Konfirmasi',
            'message'   => "{$order->santri_name} memesan kebutuhan senilai {$data['total_formatted']}. Akan dikonfirmasi otomatis dalam 1×24 jam.",
            'data'      => [
                'order_id'      => $order->id,
                'epos_order_id' => $order->epos_order_id,
                'total_amount'  => (float) $order->total_amount,
                'items_preview' => $data['items_preview_with_more'],
                'expired_at'    => $order->expired_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Send WhatsApp notification to wali
     */
    private function sendWhatsAppNotification(Santri $santri, EposKebutuhanOrder $order, array $data): void
    {
        try {
            // Get phone numbers to notify
            $phoneNumbers = $this->getWaliPhoneNumbers($santri);
            
            if (empty($phoneNumbers)) {
                Log::warning('No valid phone numbers found for wali notification', [
                    'santri_id' => $santri->id,
                    'order_id' => $order->id
                ]);
                return;
            }

            // Generate PWA URL and order number
            $pwaUrl = config('app.pwa_url') . '/kebutuhan-orders';
            $orderNumber = str_pad($order->id, 6, '0', STR_PAD_LEFT);

            // Send to each valid phone number
            foreach ($phoneNumbers as $phone) {
                $this->waService->sendKebutuhanOrderNotification($phone, [
                    'santri_name' => $santri->nama_santri,
                    'total_amount' => $data['total_formatted'],
                    'items_preview' => $data['items_preview_with_more'],
                    'expired_at' => $order->expired_at->format('d/m/Y H:i'),
                    'order_number' => $orderNumber,
                    'santri_id' => $santri->id,
                    'pwa_url' => $pwaUrl,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification for kebutuhan order', [
                'order_id' => $order->id,
                'santri_id' => $santri->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - notification failure shouldn't block order creation
        }
    }

    /**
     * Get valid wali phone numbers for notification
     */
    private function getWaliPhoneNumbers(Santri $santri): array
    {
        $phones = [];
        
        if (!empty($santri->hp_ayah) && $this->isValidPhoneNumber($santri->hp_ayah)) {
            $phones[] = $santri->hp_ayah;
        }
        
        if (!empty($santri->hp_ibu) && $this->isValidPhoneNumber($santri->hp_ibu)) {
            $phones[] = $santri->hp_ibu;
        }
        
        return array_unique($phones);
    }

    /**
     * Basic phone number validation
     */
    private function isValidPhoneNumber(string $phone): bool
    {
        $cleaned = preg_replace('/[^\d]/', '', $phone);
        return strlen($cleaned) >= 10 && strlen($cleaned) <= 15;
    }
}