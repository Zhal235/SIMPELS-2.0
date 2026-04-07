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

class WalletController extends Controller
{
    protected WalletBalanceService $balanceService;
    protected WalletCrudService $crudService;
    protected WalletTransactionService $transactionService;
    protected EposWithdrawalService $eposWithdrawalService;

    public function __construct(
        WalletBalanceService $balanceService,
        WalletCrudService $crudService,
        WalletTransactionService $transactionService,
        EposWithdrawalService $eposWithdrawalService
    ) {
        $this->balanceService = $balanceService;
        $this->crudService = $crudService;
        $this->transactionService = $transactionService;
        $this->eposWithdrawalService = $eposWithdrawalService;
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
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'note' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $amount = $request->input('amount');
        $note = $request->input('note', '');

        DB::beginTransaction();
        try {
            // Calculate total transfer balance across all santri wallets
            $totalTransferCredit = WalletTransaction::where('type', 'credit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');

            $totalTransferDebit = WalletTransaction::where('type', 'debit')
                ->where('method', 'transfer')
                ->where(function($q) {
                    $q->where('voided', '!=', 1)
                      ->orWhereNull('voided');
                })
                ->sum('amount');

            $availableTransferBalance = $totalTransferCredit - $totalTransferDebit;

            // Check if transfer balance is sufficient
            if ($availableTransferBalance < $amount) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo transfer tidak mencukupi',
                    'data' => [
                        'requested' => $amount,
                        'available' => $availableTransferBalance
                    ]
                ], 422);
            }

            // Create cash withdrawal record (tidak menggunakan pool_id)
            // Gunakan wallet_withdrawals dengan pool_id = NULL untuk membedakan dari EPOS withdrawal
            $reference = 'CWDRAW-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            
            $userId = auth()->id() ?? 1; // Fallback to admin ID 1 if not authenticated
            
            $withdrawal = DB::table('wallet_withdrawals')->insertGetId([
                'pool_id' => null, // NULL untuk cash withdrawal, bukan NULL untuk EPOS
                'amount' => $amount,
                'status' => 'done',
                'requested_by' => $userId,
                'processed_by' => $userId,
                'epos_ref' => $reference, // Gunakan field ini untuk reference cash withdrawal
                'notes' => 'CASH_TRANSFER: Tarik dana Transfer → Cash' . ($note ? ' - ' . $note : ''),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'withdrawal_id' => $withdrawal,
                    'amount' => $amount,
                    'status' => 'done',
                    'reference' => $reference,
                    'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString()
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cash withdrawal error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Tarik dana gagal',
                'error' => $e->getMessage()
            ], 500);
        }
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
        try {
            DB::beginTransaction();

            // Get wallet IDs that have MIGRATION transactions
            $walletIds = WalletTransaction::where('reference', 'like', 'MIGRATION-%')
                ->distinct()
                ->pluck('wallet_id');

            // Delete all MIGRATION transactions
            $deleted = WalletTransaction::where('reference', 'like', 'MIGRATION-%')
                ->delete();

            // Reset wallet balances to 0 for those wallets
            // so re-import starts from a clean state
            $resetCount = Wallet::whereIn('id', $walletIds)->update(['balance' => 0]);

            // Reset auto-increment to current MAX(id)+1 so IDs don't keep growing unbounded
            // Only supported on MySQL/MariaDB
            if (DB::getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE wallet_transactions AUTO_INCREMENT = 1;');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil menghapus {$deleted} transaksi import dan mereset {$resetCount} saldo dompet ke 0. Silakan upload ulang file Excel.",
                'deleted' => $deleted,
                'wallets_reset' => $resetCount,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Import wallet balances from Excel file
     * POST /api/v1/wallets/import-excel
     */
    public function importExcel(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // Max 10MB
            'mode' => 'required|in:preview,execute'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'message' => 'Validation error', 
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $mode = $request->input('mode', 'preview');
            
            // Ensure directory exists
            $importDir = storage_path('app/imports/wallets');
            if (!is_dir($importDir)) {
                mkdir($importDir, 0755, true);
            }
            
            // Save uploaded file temporarily with better handling
            $fileName = 'wallet-import-' . now()->format('Y-m-d-H-i-s') . '.' . $file->getClientOriginalExtension();
            
            // Use move instead of storeAs for better reliability
            $fullPath = $importDir . '/' . $fileName;
            
            if (!$file->move($importDir, $fileName)) {
                throw new \Exception("Failed to upload file to: $fullPath");
            }

            // Verify file exists and is readable
            if (!file_exists($fullPath) || !is_readable($fullPath)) {
                throw new \Exception("File was not saved properly or is not readable: $fullPath");
            }

            // Read Excel file
            $spreadsheet = IOFactory::load($fullPath);
            $worksheet = $spreadsheet->getActiveSheet();
            $data = $worksheet->toArray();

            // Remove header row if exists
            if (count($data) > 0 && $this->isHeaderRow($data[0])) {
                array_shift($data);
            }

            // Process data
            $results = $this->processExcelData($data, $mode);

            // Clean up temporary file
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return response()->json([
                'success' => true,
                'mode' => $mode,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            \Log::error('Excel import error: ' . $e->getMessage() . ' in file: ' . ($e->getFile() ?? 'unknown') . ' at line: ' . ($e->getLine() ?? 'unknown'));
            return response()->json([
                'success' => false,
                'message' => 'Failed to process Excel file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Excel template with santri data
     * GET /api/v1/wallets/download-template
     */
    public function downloadTemplate()
    {
        try {
            // Get all active santri
            $santriList = Santri::orderBy('nis')->get();

            // Create new spreadsheet
            $spreadsheet = new Spreadsheet();
            $worksheet = $spreadsheet->getActiveSheet();

            // Set headers
            $worksheet->setCellValue('A1', 'NIS');
            $worksheet->setCellValue('B1', 'NAMA_SANTRI');
            $worksheet->setCellValue('C1', 'KELAS');
            $worksheet->setCellValue('D1', 'SALDO');

            // Style headers
            $headerRange = 'A1:D1';
            $worksheet->getStyle($headerRange)->getFont()->setBold(true);
            $worksheet->getStyle($headerRange)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFD9EDF7');

            // Add santri data
            $row = 2;
            foreach ($santriList as $santri) {
                $worksheet->setCellValue('A' . $row, $santri->nis);
                $worksheet->setCellValue('B' . $row, $santri->nama_santri);
                $worksheet->setCellValue('C' . $row, $santri->kelas_nama ?? 'N/A');
                $worksheet->setCellValue('D' . $row, 0); // Default saldo 0
                $row++;
            }

            // Auto-size columns
            foreach (range('A', 'D') as $col) {
                $worksheet->getColumnDimension($col)->setAutoSize(true);
            }

            // Add instructions in a separate sheet
            $instructionSheet = $spreadsheet->createSheet();
            $instructionSheet->setTitle('Petunjuk');
            
            $instructions = [
                'PETUNJUK PENGGUNAAN TEMPLATE IMPORT SALDO DOMPET',
                '',
                '1. Sheet "Sheet" berisi data santri yang terdaftar di sistem',
                '2. Kolom yang tersedia:',
                '   - NIS: Nomor Induk Santri (WAJIB, jangan diubah)',
                '   - NAMA_SANTRI: Nama lengkap santri (referensi saja)',
                '   - KELAS: Kelas santri (referensi saja)',
                '   - SALDO: Isi dengan nominal saldo awal (WAJIB)',
                '',
                '3. Cara mengisi:',
                '   - Hanya ubah kolom SALDO sesuai kebutuhan',
                '   - Isi dengan angka saja, tanpa format (contoh: 50000)',
                '   - Jangan hapus atau ubah data NIS',
                '   - Jangan hapus header (baris pertama)',
                '',
                '4. Simpan file dalam format Excel (.xlsx)',
                '5. Upload file di halaman Pengaturan Dompet > Import Excel',
                '',
                'PERHATIAN:',
                '- Pastikan NIS tidak diubah agar sistem dapat mengenali santri',
                '- Saldo yang diimport akan menggantikan saldo saat ini',
                '- Lakukan preview terlebih dahulu sebelum import'
            ];

            $instrRow = 1;
            foreach ($instructions as $instruction) {
                $instructionSheet->setCellValue('A' . $instrRow, $instruction);
                if ($instrRow === 1) {
                    $instructionSheet->getStyle('A' . $instrRow)->getFont()->setBold(true);
                }
                $instrRow++;
            }
            $instructionSheet->getColumnDimension('A')->setWidth(80);

            // Set active sheet back to data sheet
            $spreadsheet->setActiveSheetIndex(0);

            // Generate filename
            $filename = 'template_import_saldo_' . now()->format('Y-m-d_H-i-s') . '.xlsx';

            // Save to temp file
            $tempPath = storage_path('app/temp/' . $filename);
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0755, true);
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save($tempPath);

            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('Template download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if first row is header row
     */
    private function isHeaderRow($row)
    {
        if (!is_array($row) || count($row) < 4) return false;
        
        $firstCell = strtoupper(trim($row[0] ?? ''));
        return in_array($firstCell, ['NIS', 'NO', 'NOMOR']);
    }

    /**
     * Process Excel data for import
     */
    private function processExcelData($data, $mode)
    {
        $results = [
            'total_rows' => count($data),
            'processed' => 0,
            'success' => 0,
            'errors' => 0,
            'details' => []
        ];

        if ($mode === 'execute') {
            DB::beginTransaction();
        }

        try {
            foreach ($data as $rowIndex => $row) {
                $rowNumber = $rowIndex + 2; // +2 because of 0-based index and potential header
                $results['processed']++;

                // Validate row structure
                if (!is_array($row) || count($row) < 4) {
                    $results['errors']++;
                    $results['details'][] = [
                        'row' => $rowNumber,
                        'status' => 'error',
                        'message' => 'Invalid row structure (need 4 columns: NIS, NAMA, KELAS, SALDO)'
                    ];
                    continue;
                }

                $nis = trim($row[0] ?? '');
                $nama = trim($row[1] ?? '');
                $kelas = trim($row[2] ?? '');
                $saldo = $this->parseSaldoAmount($row[3] ?? '');

                // Validate data
                $validation = $this->validateImportRow($nis, $nama, $kelas, $saldo, $rowNumber);
                if (!$validation['valid']) {
                    $results['errors']++;
                    $results['details'][] = $validation;
                    continue;
                }

                $santri = $validation['santri'];

                if ($mode === 'preview') {
                    // Preview mode - just validate without executing
                    $results['success']++;
                    $results['details'][] = [
                        'row' => $rowNumber,
                        'status' => 'ready',
                        'nis' => $nis,
                        'nama' => $santri->nama_santri,
                        'kelas' => $santri->kelas_nama,
                        'saldo' => number_format($saldo, 0, ',', '.'),
                        'message' => "Will import Rp " . number_format($saldo, 0, ',', '.')
                    ];
                } else {
                    // Execute mode - actually import the data
                    $importResult = $this->executeWalletImport($santri, $saldo, $rowNumber);
                    if ($importResult['status'] === 'success') {
                        $results['success']++;
                    } else {
                        $results['errors']++;
                    }
                    $results['details'][] = $importResult;
                }
            }

            if ($mode === 'execute') {
                DB::commit();
            }

        } catch (\Exception $e) {
            if ($mode === 'execute') {
                DB::rollBack();
            }
            throw $e;
        }

        return $results;
    }

    /**
     * Parse saldo amount from various formats
     */
    private function parseSaldoAmount($saldo)
    {
        if (is_numeric($saldo)) {
            return floatval($saldo);
        }

        // Remove common formatting
        $cleaned = preg_replace('/[^\d,.]/', '', $saldo);
        $cleaned = str_replace(',', '', $cleaned);
        
        return floatval($cleaned);
    }

    /**
     * Validate import row data
     */
    private function validateImportRow($nis, $nama, $kelas, $saldo, $rowNumber)
    {
        // Check if NIS is provided
        if (empty($nis)) {
            return [
                'valid' => false,
                'row' => $rowNumber,
                'status' => 'error',
                'message' => 'NIS is required'
            ];
        }

        // Check if saldo is valid
        if (!is_numeric($saldo) || $saldo < 0) {
            return [
                'valid' => false,
                'row' => $rowNumber,
                'status' => 'error',
                'message' => 'Invalid saldo amount: ' . $saldo
            ];
        }

        // Find santri by NIS
        $santri = Santri::where('nis', $nis)->first();
        if (!$santri) {
            return [
                'valid' => false,
                'row' => $rowNumber,
                'status' => 'error',
                'message' => "Santri with NIS {$nis} not found"
            ];
        }

        // Optional: Check if nama matches (warning, not error)
        $namaMatch = empty($nama) || stripos($santri->nama_santri, $nama) !== false || stripos($nama, $santri->nama_santri) !== false;
        
        return [
            'valid' => true,
            'santri' => $santri,
            'nama_match' => $namaMatch,
            'warning' => !$namaMatch ? "Name mismatch: Excel '{$nama}' vs DB '{$santri->nama_santri}'" : null
        ];
    }

    /**
     * Execute wallet import for a santri
     */
    private function executeWalletImport($santri, $saldo, $rowNumber)
    {
        try {
            // Get or create wallet
            $wallet = Wallet::firstOrCreate(
                ['santri_id' => $santri->id], 
                ['balance' => 0]
            );

            // Delete any previous MIGRATION transactions for this wallet
            // (handles re-import after failed attempts where balance was saved but transaction was not)
            WalletTransaction::where('wallet_id', $wallet->id)
                ->where(function($q) {
                    $q->where('reference', 'like', 'MIGRATION-%')
                      ->orWhere('method', 'migration');
                })
                ->delete();

            // Set new balance
            $wallet->balance = $saldo;
            $wallet->save();

            // Create transaction record with full saldo as amount (not delta)
            // because this is an initial balance setting, not a top-up
            $reference = 'MIGRATION-' . now()->format('Ymd') . '-' . str_pad($rowNumber, 4, '0', STR_PAD_LEFT);
            
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $saldo,
                'balance_after' => $saldo,
                'description' => "Initial balance migration from Excel (Row {$rowNumber})",
                'reference' => $reference,
                'method' => 'cash',
                'created_by' => auth()->id()
            ]);

            return [
                'row' => $rowNumber,
                'status' => 'success',
                'nis' => $santri->nis,
                'nama' => $santri->nama_santri,
                'new_balance' => number_format($saldo, 0, ',', '.'),
                'message' => "Successfully imported balance Rp " . number_format($saldo, 0, ',', '.')
            ];

        } catch (\Exception $e) {
            return [
                'row' => $rowNumber,
                'status' => 'error',
                'nis' => $santri->nis ?? '',
                'message' => 'Import failed: ' . $e->getMessage()
            ];
        }
    }
}
