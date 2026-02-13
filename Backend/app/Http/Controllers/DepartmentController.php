<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kode', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'nama');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        // Get data with optional pagination
        if ($request->has('per_page') && $request->per_page > 0) {
            $departments = $query->paginate($request->per_page);
        } else {
            $departments = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $departments,
            'message' => 'Data department berhasil diambil'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'nama' => 'required|string|max:100|unique:departments,nama',
            'kode' => 'required|string|max:10|unique:departments,kode',
            'deskripsi' => 'nullable|string|max:1000'
        ]);

        try {
            $department = Department::create($validatedData);

            return response()->json([
                'success' => true,
                'data' => $department,
                'message' => 'Department berhasil ditambahkan'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan department: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Department $department): JsonResponse
    {
        // Load related jabatan
        $department->load(['jabatan' => function($query) {
            $query->orderBy('level')->orderBy('nama');
        }]);

        return response()->json([
            'success' => true,
            'data' => $department,
            'message' => 'Data department berhasil diambil'
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Department $department): JsonResponse
    {
        $validatedData = $request->validate([
            'nama' => ['required', 'string', 'max:100', Rule::unique('departments')->ignore($department->id)],
            'kode' => ['required', 'string', 'max:10', Rule::unique('departments')->ignore($department->id)],
            'deskripsi' => 'nullable|string|max:1000'
        ]);

        try {
            $department->update($validatedData);

            return response()->json([
                'success' => true,
                'data' => $department->fresh(),
                'message' => 'Department berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui department: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Department  $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Department $department): JsonResponse
    {
        try {
            // Check if department has jabatan
            if ($department->jabatan()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Department tidak dapat dihapus karena masih memiliki jabatan terkait'
                ], 422);
            }

            $department->delete();

            return response()->json([
                'success' => true,
                'message' => 'Department berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus department: ' . $e->getMessage()
            ], 500);
        }
    }
}