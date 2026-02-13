<?php

namespace App\Http\Controllers;

use App\Models\Jabatan;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class JabatanController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Jabatan::with(['department', 'parent']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kode', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%")
                  ->orWhereHas('department', function($subQ) use ($search) {
                      $subQ->where('nama', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by level
        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'level');
        $sortDirection = $request->get('sort_direction', 'asc');
        
        if ($sortBy === 'department') {
            $query->join('departments', 'jabatan.department_id', '=', 'departments.id')
                  ->orderBy('departments.nama', $sortDirection)
                  ->select('jabatan.*');
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Secondary sort by nama
        if ($sortBy !== 'nama') {
            $query->orderBy('nama', 'asc');
        }

        // Get data with optional pagination
        if ($request->has('per_page') && $request->per_page > 0) {
            $jabatan = $query->paginate($request->per_page);
        } else {
            $jabatan = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $jabatan,
            'message' => 'Data jabatan berhasil diambil'
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
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:10|unique:jabatan,kode',
            'level' => 'required|integer|min:0|max:10',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:jabatan,id',
            'deskripsi' => 'nullable|string|max:1000'
        ]);

        // Validate nama unique within department (allow null department for pimpinan pesantren)
        if (isset($validatedData['department_id'])) {
            $existingJabatan = Jabatan::where('nama', $validatedData['nama'])
                                     ->where('department_id', $validatedData['department_id'])
                                     ->first();
                                     
            if ($existingJabatan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama jabatan sudah ada dalam department yang sama'
                ], 422);
            }
        }

        // Validate parent hierarchy (parent must be in same department and higher level)
        if (isset($validatedData['parent_id'])) {
            $parent = Jabatan::find($validatedData['parent_id']);
            
            // Only check department match if both have departments
            if ($parent->department_id && isset($validatedData['department_id'])) {
                if ($parent->department_id !== $validatedData['department_id']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Parent jabatan harus berada dalam department yang sama'
                    ], 422);
                }
            }

            if ($parent->level >= $validatedData['level']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent jabatan harus memiliki level yang lebih tinggi (angka lebih kecil)'
                ], 422);
            }
        }

        try {
            $jabatan = Jabatan::create($validatedData);
            $jabatan->load(['department', 'parent']);

            return response()->json([
                'success' => true,
                'data' => $jabatan,
                'message' => 'Jabatan berhasil ditambahkan'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jabatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Jabatan  $jabatan
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Jabatan $jabatan): JsonResponse
    {
        $jabatan->load(['department', 'parent', 'children']);

        return response()->json([
            'success' => true,
            'data' => $jabatan,
            'message' => 'Data jabatan berhasil diambil'
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Jabatan  $jabatan
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Jabatan $jabatan): JsonResponse
    {
        $validatedData = $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => ['required', 'string', 'max:10', Rule::unique('jabatan')->ignore($jabatan->id)],
            'level' => 'required|integer|min:0|max:10',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:jabatan,id',
            'deskripsi' => 'nullable|string|max:1000'
        ]);

        // Validate nama unique within department (excluding current record)
        if (isset($validatedData['department_id'])) {
            $existingJabatan = Jabatan::where('nama', $validatedData['nama'])
                                     ->where('department_id', $validatedData['department_id'])
                                     ->where('id', '!=', $jabatan->id)
                                     ->first();

            if ($existingJabatan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama jabatan sudah ada dalam department yang sama'
                ], 422);
            }
        }

        // Validate parent hierarchy
        if (isset($validatedData['parent_id'])) {
            // Cannot be parent of itself
            if ($validatedData['parent_id'] == $jabatan->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jabatan tidak bisa menjadi parent dari dirinya sendiri'
                ], 422);
            }

            $parent = Jabatan::find($validatedData['parent_id']);
            
            // Only check department match if both have departments
            if ($parent->department_id && isset($validatedData['department_id'])) {
                if ($parent->department_id !== $validatedData['department_id']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Parent jabatan harus berada dalam department yang sama'
                    ], 422);
                }
            }

            if ($parent->level >= $validatedData['level']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent jabatan harus memiliki level yang lebih tinggi (angka lebih kecil)'
                ], 422);
            }
        }

        try {
            $jabatan->update($validatedData);
            $jabatan->load(['department', 'parent']);

            return response()->json([
                'success' => true,
                'data' => $jabatan->fresh(['department', 'parent']),
                'message' => 'Jabatan berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jabatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Jabatan  $jabatan
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Jabatan $jabatan): JsonResponse
    {
        try {
            // Check if jabatan has children
            if ($jabatan->children()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jabatan tidak dapat dihapus karena masih memiliki jabatan bawahan'
                ], 422);
            }

            // Note: Check for pegawai relations will be handled when pegawai-jabatan is implemented

            $jabatan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jabatan berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jabatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get jabatan hierarchy for a specific department
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function hierarchy(Request $request): JsonResponse
    {
        $departmentId = $request->get('department_id');
        
        if (!$departmentId) {
            return response()->json([
                'success' => false,
                'message' => 'Department ID is required'
            ], 422);
        }

        // Get root level jabatan for the department
        $rootJabatan = Jabatan::with('allChildren.department')
                             ->where('department_id', $departmentId)
                             ->rootLevel()
                             ->orderBy('level')
                             ->orderBy('nama')
                             ->get();

        return response()->json([
            'success' => true,
            'data' => $rootJabatan,
            'message' => 'Hierarki jabatan berhasil diambil'
        ]);
    }
}