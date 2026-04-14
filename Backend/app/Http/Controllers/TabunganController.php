<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tabungan\SetorTabunganRequest;
use App\Http\Requests\Tabungan\StoreTabunganRequest;
use App\Http\Requests\Tabungan\TarikTabunganRequest;
use App\Services\Tabungan\TabunganService;
use Illuminate\Http\Request;
use Throwable;

class TabunganController extends Controller
{
    public function __construct(
        protected TabunganService $tabunganService,
    ) {}

    public function index(Request $request)
    {
        try {
            return response()->json($this->tabunganService->getList($request));
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(StoreTabunganRequest $request)
    {
        $result = $this->tabunganService->createTabungan($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function show($santriId)
    {
        $result = $this->tabunganService->getDetail($santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function update(Request $request, $santriId)
    {
        $request->validate([
            'status' => 'sometimes|in:aktif,nonaktif',
            'notes' => 'nullable|string|max:500',
        ]);

        $result = $this->tabunganService->updateTabungan($request, $santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function setor(SetorTabunganRequest $request, $santriId)
    {
        $result = $this->tabunganService->setor($request, $santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function tarik(TarikTabunganRequest $request, $santriId)
    {
        $result = $this->tabunganService->tarik($request, $santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function history(Request $request, $santriId)
    {
        return response()->json($this->tabunganService->getHistory($santriId));
    }

    public function laporan()
    {
        return response()->json($this->tabunganService->getLaporanSummary());
    }

    public function editTransaction(Request $request, $transactionId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
            'method' => 'nullable|in:cash,transfer',
        ]);

        $result = $this->tabunganService->editTransaction($request, $transactionId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function destroy(Request $request, $santriId)
    {
        $result = $this->tabunganService->closeTabungan($request, $santriId);
        return response()->json($result, $result['status_code'] ?? 200);
    }
}