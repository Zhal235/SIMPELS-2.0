<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get notifications untuk wali (by santri_id)
     */
    public function getWaliNotifications($santriId)
    {
        try {
            $notifications = Notification::forUser($santriId, 'wali')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($notif) {
                    return [
                        'id' => $notif->id,
                        'type' => $notif->type,
                        'title' => $notif->title,
                        'message' => $notif->message,
                        'data' => $notif->data,
                        'is_read' => $notif->is_read,
                        'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                        'time_ago' => $notif->created_at->diffForHumans(),
                    ];
                });

            $unreadCount = Notification::forUser($santriId, 'wali')
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'unread_count' => $unreadCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        try {
            $notification = Notification::findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead($santriId)
    {
        try {
            Notification::forUser($santriId, 'wali')
                ->unread()
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get unread count
     */
    public function getUnreadCount($santriId)
    {
        try {
            $count = Notification::forUser($santriId, 'wali')
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'unread_count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
