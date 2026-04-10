<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use App\Http\Requests\Santri\ImportSantriRequest;
use App\Http\Requests\Santri\StoreSantriRequest;
use App\Http\Requests\Santri\UpdateSantriRequest;
use App\Services\Santri\SantriCrudService;
use App\Services\Santri\SantriImportExportService;
use Illuminate\Http\Request;
use Throwable;

class SantriController extends Controller
{
    public function __construct(
        protected SantriCrudService $crudService,
        protected SantriImportExportService $importExportService,
    ) {}

    public function index(Request $request)
    {
        try {
            return response()->json($this->crudService->getList($request));
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal memuat data santri'], 500);
        }
    }

    public function store(StoreSantriRequest $request)
    {
        try {
            $result = $this->crudService->create($request);
            return response()->json($result, $result['status_code'] ?? 201);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan server'], 500);
        }
    }

    public function show(string $id)
    {
        $result = $this->crudService->findById($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function update(UpdateSantriRequest $request, string $id)
    {
        try {
            $result = $this->crudService->update($request, $id);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan server'], 500);
        }
    }

    public function destroy(string $id)
    {
        $result = $this->crudService->delete($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function template()
    {
        try {
            return $this->importExportService->downloadTemplate();
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal membuat template: ' . $e->getMessage()], 500);
        }
    }

    public function export()
    {
        try {
            return $this->importExportService->exportToExcel();
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal export data santri: ' . $e->getMessage()], 500);
        }
    }

    public function validateImport(ImportSantriRequest $request)
    {
        try {
            $result = $this->importExportService->validateImportFile($request);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal memvalidasi file: ' . $e->getMessage()], 500);
        }
    }

    public function import(ImportSantriRequest $request)
    {
        try {
            $result = $this->importExportService->importFromExcel($request);
            return response()->json($result, $result['status_code'] ?? 200);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal import data: ' . $e->getMessage()], 500);
        }
    }
}