<?php

namespace App\Http\Controllers;

use App\Models\KategoriPengeluaran;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $oldName = $kategoriPengeluaran->name;
        $newName = $data['name'];

        DB::transaction(function () use ($kategoriPengeluaran, $data, $oldName, $newName) {
            $kategoriPengeluaran->update($data);
            TransaksiKas::where('kategori', $oldName)->update(['kategori' => $newName]);
        });

        return response()->json($kategoriPengeluaran->fresh());
    }

    public function destroy(Request $request, KategoriPengeluaran $kategoriPengeluaran)
    {
        // authorization is handled by role management elsewhere; allow controller to be used by finance roles
        $kategoriPengeluaran->delete();
        return response()->json(null, 204);
    }
}
