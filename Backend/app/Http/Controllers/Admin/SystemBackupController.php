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
        $role = $user->role ?? '';
        if (!in_array($role, ['superadmin', 'admin'])) {
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
            Artisan::call('db:backup', ['--email' => $email]);
            $output = Artisan::output();

            // Consider success as long as no exception was thrown
            $hasR2   = str_contains($output, 'Uploaded to R2');
            $hasEmail = str_contains($output, 'Email sent');

            $msg = "Backup selesai ke {$email}";
            if ($hasR2)    $msg .= " + tersimpan di R2";
            if (!$hasR2)   $msg .= " (R2 upload dilewati, cek log)";

            return response()->json(['success' => true, 'message' => $msg]);

        } catch (\Exception $e) {
            \Log::error('Manual backup error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
