<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SystemBackupController extends Controller
{
    public function backup(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Tidak terautentikasi'], 401);
        }

        $role = $user->role ?? '';
        if (!in_array($role, ['superadmin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
        }

        try {
            $email = $request->input('email') ?: config('app.backup_email');

            if (!$email) {
                return response()->json([
                    'success' => false,
                    'message' => 'BACKUP_EMAIL belum dikonfigurasi di environment',
                ], 422);
            }

            $exitCode = Artisan::call('db:backup', ['--email' => $email]);
            $output = Artisan::output();

            if ($exitCode !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => trim($output) ?: 'Backup gagal dijalankan',
                ], 200);
            }

            $hasR2 = str_contains($output, 'Uploaded to R2');

            $msg = "Backup selesai ke {$email}";
            if ($hasR2) {
                $msg .= ' + tersimpan di R2';
            } else {
                $msg .= ' (R2 upload dilewati, cek log)';
            }

            return response()->json(['success' => true, 'message' => $msg]);
        } catch (\Throwable $e) {
            \Log::error('Manual backup error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 200);
        }
    }
}