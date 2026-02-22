<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Check if user has required permission
        if (!$this->hasPermission($user, $permission)) {
            return response()->json(['success' => false, 'message' => 'Forbidden - Insufficient permissions'], 403);
        }

        return $next($request);
    }

    /**
     * Check if user has the required permission
     */
    private function hasPermission($user, string $permission): bool
    {
        // Admin always has full access
        if ($user->role === 'admin') {
            return true;
        }

        // Get user's role and check permissions
        $role = \App\Models\Role::where('slug', $user->role)->first();
        
        if (!$role) {
            return false;
        }

        // If menus is null (like admin), grant full access
        if ($role->menus === null) {
            return true;
        }

        // If menus is not an array, deny access
        if (!is_array($role->menus)) {
            return false;
        }

        // Check for exact permission match
        if (in_array($permission, $role->menus)) {
            return true;
        }

        // Check for parent permission (e.g., 'dompet' allows 'dompet.settings')
        $permissionParts = explode('.', $permission);
        if (count($permissionParts) > 1) {
            $parentPermission = implode('.', array_slice($permissionParts, 0, -1));
            if (in_array($parentPermission, $role->menus)) {
                return true;
            }
        }

        return false;
    }
}