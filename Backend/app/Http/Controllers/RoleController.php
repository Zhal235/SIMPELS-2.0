<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['success' => true, 'data' => Role::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $v = Validator::make($request->all(), ['name' => 'required|string|unique:roles,name', 'menus' => 'nullable|array']);
        if ($v->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $v->errors()], 422);

        $slug = strtolower(str_replace(' ', '-', $request->input('name')));

        $role = Role::create(['name' => $request->input('name'), 'slug' => $slug, 'menus' => $request->input('menus')]);
        return response()->json(['success' => true, 'data' => $role]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $role = Role::find($id);
        if (!$role) return response()->json(['success' => false, 'message' => 'Role not found'], 404);

        $v = Validator::make($request->all(), ['name' => 'required|string', 'menus' => 'nullable|array']);
        if ($v->fails()) return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $v->errors()], 422);

        $role->name = $request->input('name');
        $role->menus = $request->input('menus') ?? [];
        $role->save();
        return response()->json(['success' => true, 'data' => $role]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') return response()->json(['success' => false, 'message' => 'Forbidden'], 403);

        $role = Role::find($id);
        if (!$role) return response()->json(['success' => false, 'message' => 'Role not found'], 404);

        // Prevent deleting admin role
        if ($role->slug === 'admin') return response()->json(['success' => false, 'message' => 'Cannot delete admin role'], 422);

        $role->delete();
        return response()->json(['success' => true]);
    }
}
