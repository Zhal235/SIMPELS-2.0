<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of announcements for the authenticated user
     * GET /api/announcements?unread_only=true&limit=10
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $unreadOnly = $request->boolean('unread_only', false);
        $limit = $request->input('limit', 50);

        // Query announcements
        $query = Announcement::with(['creator', 'reads'])
            ->where(function ($q) use ($user) {
                // Target: semua wali santri
                $q->where('target_type', 'all')
                    // Target: kelas tertentu (akan di-handle nanti dengan relasi user->santri)
                    ->orWhere('target_type', 'class')
                    // Target: santri tertentu
                    ->orWhere('target_type', 'santri');
            })
            ->orderBy('created_at', 'desc');

        // Filter hanya yang belum dibaca
        if ($unreadOnly) {
            $query->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $announcements = $query->limit($limit)->get();

        // Add read status untuk setiap announcement
        $announcements = $announcements->map(function ($announcement) use ($user) {
            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'priority' => $announcement->priority,
                'target_type' => $announcement->target_type,
                'target_ids' => $announcement->target_ids,
                'push_notification' => $announcement->push_notification,
                'created_by' => $announcement->creator ? $announcement->creator->name : null,
                'created_at' => $announcement->created_at->toISOString(),
                'is_read' => $announcement->isReadBy($user->id),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $announcements,
            'unread_count' => Announcement::whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count(),
        ]);
    }

    /**
     * Get unread count for badge
     * GET /api/announcements/unread-count
     */
    public function unreadCount()
    {
        $user = Auth::user();
        
        $count = Announcement::whereDoesntHave('reads', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->count();

        return response()->json([
            'success' => true,
            'count' => $count,
        ]);
    }

    /**
     * Store a newly created announcement (Admin only)
     * POST /api/announcements
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|in:normal,important,urgent',
            'target_type' => 'required|in:all,class,santri',
            'target_ids' => 'nullable|array',
            'target_ids.*' => 'integer',
            'push_notification' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'priority' => $request->priority,
            'target_type' => $request->target_type,
            'target_ids' => $request->target_ids,
            'push_notification' => $request->boolean('push_notification', false),
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dibuat',
            'data' => $announcement,
        ], 201);
    }

    /**
     * Display the specified announcement
     * GET /api/announcements/{id}
     */
    public function show(string $id)
    {
        $announcement = Announcement::with('creator')->find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan',
            ], 404);
        }

        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'priority' => $announcement->priority,
                'target_type' => $announcement->target_type,
                'target_ids' => $announcement->target_ids,
                'push_notification' => $announcement->push_notification,
                'created_by' => $announcement->creator ? $announcement->creator->name : null,
                'created_at' => $announcement->created_at->toISOString(),
                'is_read' => $announcement->isReadBy($user->id),
            ],
        ]);
    }

    /**
     * Mark announcement as read
     * POST /api/announcements/{id}/mark-read
     */
    public function markAsRead(string $id)
    {
        $user = Auth::user();
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan',
            ], 404);
        }

        // Check if already read
        $existingRead = AnnouncementRead::where('announcement_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingRead) {
            return response()->json([
                'success' => true,
                'message' => 'Pengumuman sudah ditandai sebagai dibaca',
            ]);
        }

        // Create read record
        AnnouncementRead::create([
            'announcement_id' => $id,
            'user_id' => $user->id,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman ditandai sebagai dibaca',
        ]);
    }

    /**
     * Update the specified announcement (Admin only)
     * PUT /api/announcements/{id}
     */
    public function update(Request $request, string $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:normal,important,urgent',
            'target_type' => 'sometimes|required|in:all,class,santri',
            'target_ids' => 'nullable|array',
            'target_ids.*' => 'integer',
            'push_notification' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diupdate',
            'data' => $announcement,
        ]);
    }

    /**
     * Remove the specified announcement (Admin only)
     * DELETE /api/announcements/{id}
     */
    public function destroy(string $id)
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan',
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus',
        ]);
    }

    /**
     * Get list of kelas for filter
     * GET /api/announcements/options/kelas
     */
    public function getKelasOptions()
    {
        $kelas = \App\Models\Kelas::select('id', 'nama_kelas', 'tingkat')->get();

        return response()->json([
            'success' => true,
            'data' => $kelas,
        ]);
    }

    /**
     * Get list of santri for filter
     * GET /api/announcements/options/santri
     */
    public function getSantriOptions(Request $request)
    {
        $query = Santri::select('id', 'nis', 'nama_santri', 'kelas_id');

        // Filter by kelas if provided
        if ($request->has('kelas_id')) {
            $query->where('kelas_id', $request->kelas_id);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('nama_santri', 'like', '%' . $request->search . '%');
        }

        $santri = $query->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => $santri,
        ]);
    }
}
