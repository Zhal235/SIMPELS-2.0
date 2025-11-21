<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
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
        $u->role = $request->input('role');
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
