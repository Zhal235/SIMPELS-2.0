<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SystemBackupController extends Controller
{
    public function backup(Request $request)
    {
        // Only superadmin / admin role can trigger backup
        $user = $request->user();
        $roles = $user->roles()->pluck('name')->toArray();
        if (!in_array('superadmin', $roles) && !in_array('admin', $roles)) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
        }

        try {
            $email = $request->input('email') ?: config('app.backup_email');

            if (!$email) {
                return response()->json([
                    'success' => false,
                    'message' => 'BACKUP_EMAIL belum dikonfigurasi di environment'
                ], 422);
            }

            // Run backup command synchronously
            $exitCode = Artisan::call('db:backup', ['--email' => $email]);

            if ($exitCode === 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Backup berhasil dikirim ke {$email}"
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Backup gagal, cek log server'], 500);

        } catch (\Exception $e) {
            \Log::error('Manual backup error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
