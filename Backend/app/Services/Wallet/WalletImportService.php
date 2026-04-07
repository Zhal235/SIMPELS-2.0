<?php

namespace App\Services\Wallet;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Santri;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Wallet Import Service
 * 
 * Handles Excel import/export operations for wallet balances.
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - Import wallet balances from Excel
 * - Export Excel template with santri data
 * - Delete import history
 * - Validate import data
 */
class WalletImportService
{
    /**
     * Delete ALL import history (MIGRATION transactions) AND reset wallet balances to 0
     * 
     * @return array
     */
    public function deleteImportHistory(): array
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

            return [
                'success' => true,
                'message' => "Berhasil menghapus {$deleted} transaksi import dan mereset {$resetCount} saldo dompet ke 0. Silakan upload ulang file Excel.",
                'deleted' => $deleted,
                'wallets_reset' => $resetCount,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Import wallet balances from Excel file
     * 
     * @param Request $request
     * @return array
     */
    public function importFromExcel(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // Max 10MB
            'mode' => 'required|in:preview,execute'
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
                'status_code' => 422
            ];
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

            return [
                'success' => true,
                'mode' => $mode,
                'data' => $results,
                'status_code' => 200
            ];

        } catch (\Exception $e) {
            \Log::error('Excel import error: ' . $e->getMessage() . ' in file: ' . ($e->getFile() ?? 'unknown') . ' at line: ' . ($e->getLine() ?? 'unknown'));
            return [
                'success' => false,
                'message' => 'Failed to process Excel file',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Download Excel template with santri data
     * 
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|array
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

            return [
                'success' => true,
                'file_path' => $tempPath,
                'filename' => $filename
            ];

        } catch (\Exception $e) {
            \Log::error('Template download error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to generate template',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Check if first row is header row
     * 
     * @param array $row
     * @return bool
     */
    private function isHeaderRow($row): bool
    {
        if (!is_array($row) || count($row) < 4) return false;
        
        $firstCell = strtoupper(trim($row[0] ?? ''));
        return in_array($firstCell, ['NIS', 'NO', 'NOMOR']);
    }

    /**
     * Process Excel data for import
     * 
     * @param array $data
     * @param string $mode
     * @return array
     */
    private function processExcelData($data, $mode): array
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
     * 
     * @param mixed $saldo
     * @return float
     */
    private function parseSaldoAmount($saldo): float
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
     * 
     * @param string $nis
     * @param string $nama
     * @param string $kelas
     * @param float $saldo
     * @param int $rowNumber
     * @return array
     */
    private function validateImportRow($nis, $nama, $kelas, $saldo, $rowNumber): array
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
     * 
     * @param Santri $santri
     * @param float $saldo
     * @param int $rowNumber
     * @return array
     */
    private function executeWalletImport($santri, $saldo, $rowNumber): array
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
