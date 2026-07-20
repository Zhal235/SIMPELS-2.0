<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tagihan\BulkTagihanRequest;
use App\Http\Requests\Tagihan\CreateTagihanRequest;
use App\Http\Requests\Tagihan\UpdateTagihanRequest;
use App\Services\Tagihan\TagihanBulkService;
use App\Services\Tagihan\TagihanCrudService;
use App\Services\Tagihan\TagihanGenerateService;
use Illuminate\Http\Request;
use Throwable;

class TagihanSantriController extends Controller
{
    public function __construct(
        protected TagihanCrudService $crudService,
        protected TagihanGenerateService $generateService,
        protected TagihanBulkService $bulkService,
    ) {}

    public function index(Request $request)
    {
        try {
            $includeDetail = filter_var($request->query('include_detail', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
            $page = max((int) $request->query('page', 1), 1);
            $perPage = max((int) $request->query('perPage', 50), 1);
            $search = trim((string) $request->query('q', ''));

            return response()->json($this->crudService->getRekapPerSantri($includeDetail ?? true, $page, $perPage, $search));
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memuat tagihan'], 500);
        }
    }

    public function generate(CreateTagihanRequest $request)
    {
        $result = $this->generateService->generate($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function show(string $id)
    {
        $result = $this->crudService->findById($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getBySantri(Request $request, string $santriId)
    {
        return response()->json($this->crudService->getBySantri($santriId, $request->boolean('show_lunas', false)));
    }

    public function update(UpdateTagihanRequest $request, string $id)
    {
        $result = $this->crudService->updateTagihan($request, $id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function destroy(string $id)
    {
        $result = $this->crudService->deleteTagihan($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function createTunggakan(BulkTagihanRequest $request)
    {
        $result = $this->bulkService->createTunggakan($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function bulkDelete(Request $request)
    {
        $result = $this->bulkService->bulkDelete($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function bulkUpdateNominal(Request $request)
    {
        $result = $this->bulkService->bulkUpdateNominal($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function cleanupOrphan()
    {
        $result = $this->bulkService->cleanupOrphan();
        return response()->json($result, $result['status_code'] ?? 200);
    }
}