<?php

namespace App\Http\Controllers;

use App\Models\InstansiSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class InstansiSettingController extends Controller
{
    public function index()
    {
        $setting = InstansiSetting::first();
        return response()->json(['success' => true, 'data' => $setting]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_yayasan' => 'required|string|max:255',
            'nama_pesantren' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'telp' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = InstansiSetting::firstOrCreate([]);
        $setting->update($request->only(['nama_yayasan', 'nama_pesantren', 'alamat', 'telp', 'email', 'website']));

        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Profil instansi berhasil disimpan']);
    }

    public function uploadKopSurat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kop_surat' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = InstansiSetting::firstOrCreate([]);

        if ($setting->kop_surat_path) {
            Storage::disk('r2')->delete($setting->kop_surat_path);
        }

        $path = $request->file('kop_surat')->store('instansi', 'r2');
        $setting->update(['kop_surat_path' => $path]);

        return response()->json(['success' => true, 'data' => $setting, 'message' => 'Kop surat berhasil diupload']);
    }

    public function deleteKopSurat()
    {
        $setting = InstansiSetting::firstOrCreate([]);

        if ($setting->kop_surat_path) {
            Storage::disk('r2')->delete($setting->kop_surat_path);
            $setting->update(['kop_surat_path' => null]);
        }

        return response()->json(['success' => true, 'message' => 'Kop surat berhasil dihapus']);
    }
}
