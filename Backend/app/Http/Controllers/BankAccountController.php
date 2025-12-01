<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BankAccountController extends Controller
{
    /**
     * Display a listing of bank accounts.
     */
    public function index()
    {
        $accounts = BankAccount::orderBy('sort_order')->orderBy('bank_name')->get();
        
        return response()->json([
            'success' => true,
            'data' => $accounts,
        ]);
    }

    /**
     * Store a newly created bank account.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bank_name' => 'required|string|max:100',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $account = BankAccount::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rekening bank berhasil ditambahkan',
            'data' => $account,
        ], 201);
    }

    /**
     * Display the specified bank account.
     */
    public function show($id)
    {
        $account = BankAccount::find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Rekening bank tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $account,
        ]);
    }

    /**
     * Update the specified bank account.
     */
    public function update(Request $request, $id)
    {
        $account = BankAccount::find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Rekening bank tidak ditemukan',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'bank_name' => 'string|max:100',
            'account_number' => 'string|max:50',
            'account_name' => 'string|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $account->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Rekening bank berhasil diperbarui',
            'data' => $account,
        ]);
    }

    /**
     * Remove the specified bank account.
     */
    public function destroy($id)
    {
        $account = BankAccount::find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Rekening bank tidak ditemukan',
            ], 404);
        }

        // Check if there are any bukti transfers using this bank
        $usageCount = $account->buktiTransfers()->count();
        
        if ($usageCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat menghapus rekening bank karena sudah digunakan dalam {$usageCount} transaksi. Nonaktifkan saja rekening ini.",
            ], 400);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rekening bank berhasil dihapus',
        ]);
    }

    /**
     * Toggle active status of bank account.
     */
    public function toggleActive($id)
    {
        $account = BankAccount::find($id);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Rekening bank tidak ditemukan',
            ], 404);
        }

        $account->is_active = !$account->is_active;
        $account->save();

        return response()->json([
            'success' => true,
            'message' => $account->is_active ? 'Rekening bank diaktifkan' : 'Rekening bank dinonaktifkan',
            'data' => $account,
        ]);
    }
}
