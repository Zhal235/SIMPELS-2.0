<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BuktiTransfer\ApproveRequest;
use App\Http\Requests\BuktiTransfer\RejectRequest;
use App\Services\BuktiTransfer\BuktiTransferService;
use Illuminate\Http\Request;
use Throwable;

class AdminBuktiTransferController extends Controller
{
    public function __construct(
        protected BuktiTransferService $buktiTransferService,
    ) {}

    public function index(Request $request)
    {
        try {
            return response()->json($this->buktiTransferService->getList($request));
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function approve(ApproveRequest $request, $id)
    {
        $result = $this->buktiTransferService->approveBukti($request, $id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function reject(RejectRequest $request, $id)
    {
        $result = $this->buktiTransferService->rejectBukti($request, $id);
        return response()->json($result, $result['status_code'] ?? 200);
    }
}