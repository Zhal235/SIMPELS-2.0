<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;
use App\Models\EposPool;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\Storage;
use App\Services\Wallet\WalletBalanceService;
use App\Services\Wallet\WalletCrudService;
use App\Services\Wallet\WalletTransactionService;
use App\Services\Wallet\EposWithdrawalService;
use App\Services\Wallet\CashWithdrawalService;
use App\Services\Wallet\WalletImportService;

class WalletController extends Controller
{
    protected WalletBalanceService $balanceService;
    protected WalletCrudService $crudService;
    protected WalletTransactionService $transactionService;
    protected EposWithdrawalService $eposWithdrawalService;
    protected CashWithdrawalService $cashWithdrawalService;
    protected WalletImportService $importService;

    public function __construct(
        WalletBalanceService $balanceService,
        WalletCrudService $crudService,
        WalletTransactionService $transactionService,
        EposWithdrawalService $eposWithdrawalService,
        CashWithdrawalService $cashWithdrawalService,
        WalletImportService $importService
    ) {
        $this->balanceService = $balanceService;
        $this->crudService = $crudService;
        $this->transactionService = $transactionService;
        $this->eposWithdrawalService = $eposWithdrawalService;
        $this->cashWithdrawalService = $cashWithdrawalService;
        $this->importService = $importService;
    }

    /**
     * Get total cash and bank balances
    * GET /api/v1/wallets/balances
     */
    public function getBalances()
    {
        $balances = $this->balanceService->getBalances();
        
        return response()->json([
            'success' => true,
            'data' => $balances
        ]);
    }

    public function index(Request $request)
    {
        $wallets = $this->crudService->getAllWallets($request);
        return response()->json(['success' => true, 'data' => $wallets]);
    }

    public function show($santriId)
    {
        $wallet = $this->crudService->getWalletBySantriId($santriId);
        return response()->json(['success' => true, 'data' => $wallet]);
    }

    public function destroy($santriId)
    {
        $result = $this->crudService->deactivateWallet($santriId);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    public function topup(Request $request, $santriId)
    {
        $result = $this->transactionService->topup($request, $santriId);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    public function debit(Request $request, $santriId)
    {
        $result = $this->transactionService->debit($request, $santriId);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    public function transactions($santriId)
    {
        $txns = $this->transactionService->getTransactions($santriId, request());
        return response()->json(['success' => true, 'data' => $txns]);
    }

    protected function ensureAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || ($user->role ?? 'user') !== 'admin') {
            return false;
        }
        return true;
    }

    /**
     * Update a transaction: edit in place and save original values as audit trail.
     * No reversal entry is created — history remains clean for wali santri.
     * Only admin allowed.
     */
    public function updateTransaction(Request $request, $id)
    {
        if (!$this->ensureAdmin($request)) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $result = $this->transactionService->updateTransaction($request, $id);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Void (delete) a transaction: buat reversal dan tandai transaksi asli sebagai voided.
     * Alasan void wajib diisi admin agar wali santri dapat memahami konteksnya.
     */
    public function voidTransaction(Request $request, $id)
    {
        if (!$this->ensureAdmin($request)) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        $result = $this->transactionService->voidTransaction($request, $id);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    // Admin: list all transactions with optional filters (santri_id, type, date range)
    public function allTransactions(Request $request)
    {
        $result = $this->transactionService->getAllTransactions($request);
        return response()->json($result);
    }

    /**
     * Create withdrawal request from EPOS
     * POST /api/v1/wallets/epos/withdrawal
     */
    public function createEposWithdrawal(Request $request)
    {
        $result = $this->eposWithdrawalService->createWithdrawal($request);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Get withdrawal status by withdrawal number
     * GET /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/status
     */
    public function getEposWithdrawalStatus($withdrawalNumber)
    {
        $result = $this->eposWithdrawalService->getWithdrawalStatus($withdrawalNumber);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Approve EPOS withdrawal request
     * PUT /api/v1/wallets/epos/withdrawal/{id}/approve
     * Body: { "payment_method": "cash" | "transfer" }
     */
    public function approveEposWithdrawal(Request $request, $id)
    {
        $result = $this->eposWithdrawalService->approveWithdrawal($request, $id);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Reject EPOS withdrawal request by withdrawal number (from ePOS)
     * POST /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/reject
     */
    public function rejectEposWithdrawalByNumber(Request $request, $withdrawalNumber)
    {
        $result = $this->eposWithdrawalService->rejectWithdrawalByNumber($request, $withdrawalNumber);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Reject EPOS withdrawal request
     * PUT /api/v1/wallets/epos/withdrawal/{id}/reject
     */
    public function rejectEposWithdrawal(Request $request, $id)
    {
        $result = $this->eposWithdrawalService->rejectWithdrawal($request, $id);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * List all EPOS withdrawal requests
     * GET /api/v1/wallets/epos/withdrawals
     */
    public function listEposWithdrawals(Request $request)
    {
        $result = $this->eposWithdrawalService->listWithdrawals($request);
        return response()->json($result);
    }

    /**
     * Cash withdrawal: transfer dari saldo bank/transfer ke cash
     * POST /api/v1/wallets/cash-withdrawal
     */
    public function cashWithdrawal(Request $request)
    {
        $result = $this->cashWithdrawalService->processCashWithdrawal($request);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Health check / Ping endpoint for EPOS
     * GET /api/v1/wallets/ping
     */
    public function ping()
    {
        return response()->json([
            'success' => true,
            'message' => 'SIMPELS API is running',
            'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString(),
            'version' => '2.0'
        ]);
    }

    /**
     * Delete ALL import history (MIGRATION transactions) AND reset wallet balances to 0
     * so the next import starts completely fresh.
     * DELETE /api/v1/wallets/import-history
     */
    public function deleteImportHistory()
    {
        $result = $this->importService->deleteImportHistory();
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Import wallet balances from Excel file
     * POST /api/v1/wallets/import-excel
     */
    public function importExcel(Request $request)
    {
        $result = $this->importService->importFromExcel($request);
        $statusCode = $result['status_code'] ?? 200;
        unset($result['status_code']);
        
        return response()->json($result, $statusCode);
    }

    /**
     * Download Excel template with santri data
     * GET /api/v1/wallets/download-template
     */
    public function downloadTemplate()
    {
        $result = $this->importService->downloadTemplate();
        
        if (!$result['success']) {
            $statusCode = $result['status_code'] ?? 500;
            unset($result['status_code']);
            return response()->json($result, $statusCode);
        }
        
        return response()->download($result['file_path'], $result['filename'], [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
