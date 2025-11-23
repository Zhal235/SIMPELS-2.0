<?php

namespace App\Http\Controllers;

use App\Models\KategoriPengeluaran;
use Illuminate\Http\Request;

class KategoriPengeluaranController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->get('q');
        $query = KategoriPengeluaran::query();

        if ($q) {
            $query->where('name', 'like', "%{$q}%");
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {

        $data = $request->validate([
            'name' => 'required|string|unique:kategori_pengeluaran,name',
        ]);

        $data['slug'] = str()->slug($data['name']);
        $data['created_by'] = $request->user()->id ?? null;

        $kategori = KategoriPengeluaran::create($data);

        return response()->json($kategori, 201);
    }

    public function update(Request $request, KategoriPengeluaran $kategoriPengeluaran)
    {

        $data = $request->validate([
            'name' => 'required|string|unique:kategori_pengeluaran,name,' . $kategoriPengeluaran->id,
        ]);

        $data['slug'] = str()->slug($data['name']);

        $kategoriPengeluaran->update($data);

        return response()->json($kategoriPengeluaran);
    }

    public function destroy(Request $request, KategoriPengeluaran $kategoriPengeluaran)
    {
        // authorization is handled by role management elsewhere; allow controller to be used by finance roles
        $kategoriPengeluaran->delete();
        return response()->json(null, 204);
    }
}
