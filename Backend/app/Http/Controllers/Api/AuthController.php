<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Debug failure (remove in production)
            // \Log::info('Login failed', ['email' => $request->email, 'user_exists' => (bool)$user, 'hash_check' => Hash::check($request->password, $user->password)]);
            
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Track mobile login if request comes from mobile app
        $userAgent = $request->header('User-Agent');
        $isMobile = $request->header('X-Mobile-App') === 'true' || 
                    str_contains(strtolower($userAgent ?? ''), 'mobile') ||
                    str_contains(strtolower($userAgent ?? ''), 'simpels-mobile');
        
        if ($isMobile) {
            $user->last_mobile_login_at = now();
            $user->mobile_login_count = ($user->mobile_login_count ?? 0) + 1;
            $user->last_mobile_device = $this->detectDevice($userAgent);
            $user->save();
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
            ],
        ], 200);
    }

    /**
     * Detect device type from user agent
     */
    private function detectDevice(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        
        $ua = strtolower($userAgent);
        
        if (str_contains($ua, 'android')) return 'Android';
        if (str_contains($ua, 'iphone') || str_contains($ua, 'ipad')) return 'iOS';
        if (str_contains($ua, 'mobile')) return 'Mobile Web';
        if (str_contains($ua, 'chrome')) return 'Chrome';
        if (str_contains($ua, 'firefox')) return 'Firefox';
        if (str_contains($ua, 'safari')) return 'Safari';
        
        return 'Desktop/Web';
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ], 200);
    }

    /**
     * Get current authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role ?? 'user',
            ]
        ], 200);
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password lama tidak sesuai',
                'errors' => [
                    'current_password' => ['Password lama tidak sesuai']
                ]
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password berhasil diubah'
        ], 200);
    }

    /**
     * Send password reset link to email
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Check if user exists
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            // Return success message even if user doesn't exist (security best practice)
            return response()->json([
                'message' => 'Jika email terdaftar, link reset password telah dikirim ke email Anda'
            ], 200);
        }

        // Send password reset link
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Link reset password telah dikirim ke email Anda'
            ], 200);
        }

        return response()->json([
            'message' => 'Gagal mengirim link reset password',
            'errors' => [
                'email' => ['Gagal mengirim link reset password']
            ]
        ], 500);
    }

    /**
     * Reset password using token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password berhasil direset'
            ], 200);
        }

        return response()->json([
            'message' => 'Token reset password tidak valid atau sudah kadaluarsa',
            'errors' => [
                'email' => ['Token reset password tidak valid atau sudah kadaluarsa']
            ]
        ], 422);
    }
}
