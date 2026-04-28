<?php

namespace App\Services\EposKebutuhan;

use Illuminate\Http\Request;

/**
 * KebutuhanOrderAuthorizationService
 * 
 * Handles authorization logic for Kebutuhan Orders
 * - Wali authorization for specific santri
 * - Admin role checking
 */
class KebutuhanOrderAuthorizationService
{
    /**
     * Authorize wali access to specific santri data
     * 
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function authorizeWaliForSantri(Request $request, string $santriId): void
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        // Admin can access anything
        if ($user->role === 'admin') {
            return;
        }

        // For wali, check if the santriId is in the token's abilities
        $allowedSantriIds = $token->abilities['santri_ids'] ?? [];

        if (!in_array($santriId, $allowedSantriIds)) {
            abort(403, 'Anda tidak memiliki akses ke data santri ini.');
        }
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(Request $request): bool
    {
        return $request->user()->role === 'admin';
    }

    /**
     * Get allowed santri IDs for the current user
     */
    public function getAllowedSantriIds(Request $request): array
    {
        $user = $request->user();
        
        // Admin can access all
        if ($user->role === 'admin') {
            return ['*']; // Special marker for admin
        }
        
        $token = $user->currentAccessToken();
        return $token->abilities['santri_ids'] ?? [];
    }

    /**
     * Check if user can access specific santri
     */
    public function canAccessSantri(Request $request, string $santriId): bool
    {
        $user = $request->user();
        
        // Admin can access all
        if ($user->role === 'admin') {
            return true;
        }
        
        $token = $user->currentAccessToken();
        $allowedSantriIds = $token->abilities['santri_ids'] ?? [];
        
        return in_array($santriId, $allowedSantriIds);
    }
}