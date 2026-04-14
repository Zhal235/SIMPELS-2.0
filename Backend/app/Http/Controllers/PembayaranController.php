<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pembayaran\StorePembayaranRequest;
use App\Services\Pembayaran\PembayaranService;
use Illuminate\Http\Request;
use Throwable;

class PembayaranController extends Controller
{
    public function __construct(
        protected PembayaranService $pembayaranService,
    ) {}

    public function index(Request $request)
    {
        try {
            return response()->json($this->pembayaranService->getList($request));
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function history($santriId)
    {
        return response()->json($this->pembayaranService->getHistory($santriId));
    }

    public function store(StorePembayaranRequest $request)
    {
        $result = $this->pembayaranService->processPembayaran($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function show(string $id)
    {
        $result = $this->pembayaranService->getDetail($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getTagihanBySantri($santriId)
    {
        return response()->json($this->pembayaranService->getTagihanBySantri($santriId));
    }

    public function destroy(string $id)
    {
        $result = $this->pembayaranService->deletePembayaran($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function update(Request $request, string $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Update pembayaran tidak diperbolehkan. Silakan hapus dan buat pembayaran baru.'
        ], 405);
    }
}