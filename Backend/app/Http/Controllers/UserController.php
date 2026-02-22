<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    // list users (admin only)
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $users = User::select('id', 'name', 'email', 'role')->orderBy('name')->get();
        return response()->json(['success' => true, 'data' => $users]);
    }

    // create user (admin only)
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string'
        ]);

        if ($validator->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);

        $u = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
            'role' => $request->input('role') ?? 'user',
            'email_verified_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $u], 201);
    }

    // update user (admin only) — allow changing role
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $validator = Validator::make($request->all(), [
            'role' => 'required|string'
        ]);

        if ($validator->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);

        $u = User::find($id);
        if (!$u) return response()->json(['success' => false, 'message' => 'User not found'], 404);
        
        // Ensure role is updated correctly
        $u->role = $request->input('role');
        
        // Prevent accidental self-demotion if the admin behaves recklessly (optional safeguard)
        // if ($u->id === $user->id && $u->role !== 'admin') { ... }

        $u->save();
        return response()->json(['success' => true, 'data' => $u]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        if ($user->id == $id) return response()->json(['success' => false, 'message' => 'Cannot delete yourself'], 422);

        $u = User::find($id);
        if (!$u) return response()->json(['success' => false, 'message' => 'User not found'], 404);
        $u->delete();
        return response()->json(['success' => true]);
    }
}
