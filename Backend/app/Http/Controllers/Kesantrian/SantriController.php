<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Http\Resources\SantriResource;
use App\Traits\ValidatesDeletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class SantriController extends Controller
{
    use ValidatesDeletion;
    /**
     * GET /api/v1/kesantrian/santri
     */
    public function index(Request $request)
    {
        try {
            $page = max((int) $request->query('page', 1), 1);
            $perPage = max((int) $request->query('perPage', 10), 1);
            $query = Santri::query();

            // Search
            if ($request->filled('q')) {
                $search = $request->input('q');
                $query->where(function ($q) use ($search) {
                    $q->where('nama_santri', 'like', "%{$search}%")
                      ->orWhere('nis', 'like', "%{$search}%")
                      ->orWhere('nisn', 'like', "%{$search}%");
                });
            }

            // Filter: Kelas
            if ($request->filled('kelas_id')) {
                $query->where('kelas_id', $request->input('kelas_id'));
            }

            // Filter: Asrama
            if ($request->filled('asrama_id')) {
                $asramaId = $request->input('asrama_id');
                if ($asramaId === 'non_asrama') {
                    $query->whereNull('asrama_id');
                } else {
                    $query->where('asrama_id', $asramaId);
                }
            }

            // Filter: Status
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Optional filter: santri tanpa asrama
            if ($request->boolean('withoutAsrama')) {
                $query->whereNull('asrama_id');
            }
            $paginator = $query
                ->with(['kelas', 'asrama', 'rfid_tag', 'wallet'])
                ->orderBy('nama_santri')
                ->paginate($perPage, ['*'], 'page', $page);

            // Use SantriResource to properly format foto URLs
            $items = SantriResource::collection($paginator->items());

            return response()->json([
                'status' => 'success',
                'data' => $items,
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat data santri',
            ], 500);
        }
    }

    /**
     * POST /api/v1/kesantrian/santri
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nis' => ['required', 'string', 'max:255', 'unique:santri,nis'],
                'nama_santri' => ['required', 'string', 'max:255'],
                'tempat_lahir' => ['required', 'string', 'max:255'],
                'tanggal_lahir' => ['required', 'date'],
                'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
                'alamat' => ['required', 'string'],
                'nama_ayah' => ['required', 'string', 'max:255'],
                'nama_ibu' => ['required', 'string', 'max:255'],
                // optional fields
                'nisn' => ['nullable', 'string', 'max:255'],
                'nik_santri' => ['nullable', 'string', 'max:255'],
                'kelas_id' => ['nullable'],
                'kelas_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asrama_id' => ['nullable'],
                'asrama_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asal_sekolah' => ['nullable', 'string', 'max:255'],
                'hobi' => ['nullable', 'string', 'max:255'],
                'cita_cita' => ['nullable', 'string', 'max:255'],
                'jumlah_saudara' => ['nullable', 'integer'],
                'provinsi' => ['nullable', 'string', 'max:255'],
                'kabupaten' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'desa' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:20'],
                'no_kk' => ['nullable', 'string', 'max:255'],
                'nik_ayah' => ['nullable', 'string', 'max:255'],
                'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
                'hp_ayah' => ['nullable', 'string', 'max:255'],
                'nik_ibu' => ['nullable', 'string', 'max:255'],
                'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
                'hp_ibu' => ['nullable', 'string', 'max:255'],
                'foto' => ['nullable', 'file', 'image', 'max:2048'],
                // status & penerimaan
                'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
                'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
                // mutasi metadata
                'tanggal_keluar' => ['nullable', 'date'],
                'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
                'alasan_mutasi' => ['nullable', 'string'],
            ]);
            
            // Remove kelas_nama dan asrama_nama dari validated data karena bukan kolom di database
            unset($validated['kelas_nama'], $validated['asrama_nama']);

            // handle foto upload if exists
            if ($request->hasFile('foto')) {
                $path = $request->file('foto')->store('foto-santri', 'public');
                $validated['foto'] = $path; // store relative path only
            }

            $santri = Santri::create($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Santri berhasil disimpan',
                'data' => $santri,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server',
            ], 500);
        }
    }

    /**
     * GET /api/v1/kesantrian/santri/{id}
     */
    public function show(string $id)
    {
        $santri = Santri::query()->with(['kelas', 'asrama'])->find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => new SantriResource($santri),
        ]);
    }

    /**
     * PUT /api/v1/kesantrian/santri/{id}
     */
    public function update(Request $request, string $id)
    {
        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'nis' => ['required', 'string', 'max:255', Rule::unique('santri', 'nis')->ignore($santri->id, 'id')],
                'nama_santri' => ['required', 'string', 'max:255'],
                'tempat_lahir' => ['required', 'string', 'max:255'],
                'tanggal_lahir' => ['required', 'date'],
                'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
                'alamat' => ['required', 'string'],
                'nama_ayah' => ['required', 'string', 'max:255'],
                'nama_ibu' => ['required', 'string', 'max:255'],
                // optional
                'nisn' => ['nullable', 'string', 'max:255'],
                'nik_santri' => ['nullable', 'string', 'max:255'],
                'kelas_id' => ['nullable'],
                'kelas_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asrama_id' => ['nullable'],
                'asrama_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asal_sekolah' => ['nullable', 'string', 'max:255'],
                'hobi' => ['nullable', 'string', 'max:255'],
                'cita_cita' => ['nullable', 'string', 'max:255'],
                'jumlah_saudara' => ['nullable', 'integer'],
                'provinsi' => ['nullable', 'string', 'max:255'],
                'kabupaten' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'desa' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:20'],
                'no_kk' => ['nullable', 'string', 'max:255'],
                'nik_ayah' => ['nullable', 'string', 'max:255'],
                'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
                'hp_ayah' => ['nullable', 'string', 'max:255'],
                'nik_ibu' => ['nullable', 'string', 'max:255'],
                'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
                'hp_ibu' => ['nullable', 'string', 'max:255'],
                'foto' => ['nullable', 'file', 'image', 'max:2048'],
                // status & penerimaan
                'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
                'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
                // mutasi metadata
                'tanggal_keluar' => ['nullable', 'date'],
                'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
                'alasan_mutasi' => ['nullable', 'string'],
            ]);
            
            // Remove kelas_nama dan asrama_nama dari validated data karena bukan kolom di database
            unset($validated['kelas_nama'], $validated['asrama_nama']);

            // handle foto upload if exists
            if ($request->hasFile('foto')) {
                // optionally delete old file - skipped here
                $path = $request->file('foto')->store('foto-santri', 'public');
                $validated['foto'] = $path; // store relative path only
            }

            $santri->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Santri berhasil diperbarui',
                'data' => $santri,
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/kesantrian/santri/{id}
     */
    public function destroy(string $id)
    {
        $santri = Santri::with(['wallet'])->find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }

        // Cek saldo wallet jika ada
        $walletWarning = null;
        if ($santri->wallet && $santri->wallet->balance > 0) {
            $walletWarning = [
                'type' => 'Saldo Dompet',
                'count' => 1,
                'relation' => 'wallet',
                'action' => '⚠️ PENTING: Tarik saldo dompet sebesar Rp ' . number_format($santri->wallet->balance, 0, ',', '.') . ' terlebih dahulu! (Menu: Dompet → Penarikan Saldo)'
            ];
        }

        // Validasi dependency sebelum delete
        $validation = $this->validateDeletion($santri, [
            'tagihanSantri' => [
                'label' => 'Tagihan Santri',
                'action' => 'Hapus semua tagihan santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: Tagihan Santri → Filter Santri)'
            ],
            'pembayaran' => [
                'label' => 'Pembayaran',
                'action' => 'Hapus semua pembayaran santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: Pembayaran → Filter Santri)'
            ],
            'walletTransactions' => [
                'label' => 'Transaksi Dompet',
                'action' => 'Hapus semua transaksi dompet santri "' . $santri->nama_santri . '" terlebih dahulu'
            ],
            'wallet' => [
                'label' => 'Dompet Digital',
                'action' => 'Hapus dompet digital santri "' . $santri->nama_santri . '" terlebih dahulu'
            ],
            'rfid_tag' => [
                'label' => 'RFID Tag',
                'action' => 'Hapus RFID Tag santri "' . $santri->nama_santri . '" terlebih dahulu (Menu: RFID Tag)'
            ],
        ]);

        // Tambahkan warning saldo wallet jika ada
        if ($walletWarning && !$validation['can_delete']) {
            // Insert di awal array dependencies
            array_unshift($validation['dependencies'], $walletWarning);
            // Update instructions
            $validation['instructions'] = str_replace(
                'Langkah yang harus dilakukan',
                'Langkah yang harus dilakukan (WAJIB BERURUTAN)',
                $validation['instructions']
            );
        }

        // Return response sesuai hasil validasi
        if (!$validation['can_delete']) {
            return response()->json([
                'status' => 'error',
                'message' => $validation['message'],
                'reason' => $validation['reason'],
                'dependencies' => $validation['dependencies'],
                'instructions' => $validation['instructions']
            ], 422);
        }

        $santri->delete();
        return response()->json([
            'status' => 'success',
            'message' => $validation['message'],
        ]);
    }

    /**
     * GET /api/v1/kesantrian/santri/template
     * Download template Excel untuk import data santri
     */
    public function template()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Set header dengan keterangan wajib/opsional
            $headers = [
                'A' => ['label' => 'NIS', 'required' => true],
                'B' => ['label' => 'NISN', 'required' => false],
                'C' => ['label' => 'NIK Santri', 'required' => false],
                'D' => ['label' => 'Nama Santri', 'required' => true],
                'E' => ['label' => 'Jenis Kelamin', 'required' => true],
                'F' => ['label' => 'Tempat Lahir', 'required' => true],
                'G' => ['label' => 'Tanggal Lahir', 'required' => true],
                'H' => ['label' => 'Alamat', 'required' => true],
                'I' => ['label' => 'Provinsi', 'required' => false],
                'J' => ['label' => 'Kabupaten', 'required' => false],
                'K' => ['label' => 'Kecamatan', 'required' => false],
                'L' => ['label' => 'Desa', 'required' => false],
                'M' => ['label' => 'Kode Pos', 'required' => false],
                'N' => ['label' => 'Kelas', 'required' => false],
                'O' => ['label' => 'Asrama', 'required' => false],
                'P' => ['label' => 'Asal Sekolah', 'required' => false],
                'Q' => ['label' => 'Hobi', 'required' => false],
                'R' => ['label' => 'Cita-cita', 'required' => false],
                'S' => ['label' => 'Jumlah Saudara', 'required' => false],
                'T' => ['label' => 'No KK', 'required' => false],
                'U' => ['label' => 'Nama Ayah', 'required' => true],
                'V' => ['label' => 'NIK Ayah', 'required' => false],
                'W' => ['label' => 'Pendidikan Ayah', 'required' => false],
                'X' => ['label' => 'Pekerjaan Ayah', 'required' => false],
                'Y' => ['label' => 'HP Ayah', 'required' => false],
                'Z' => ['label' => 'Nama Ibu', 'required' => true],
                'AA' => ['label' => 'NIK Ibu', 'required' => false],
                'AB' => ['label' => 'Pendidikan Ibu', 'required' => false],
                'AC' => ['label' => 'Pekerjaan Ibu', 'required' => false],
                'AD' => ['label' => 'HP Ibu', 'required' => false],
            ];
            
            // Row 1: Header dengan tanda wajib
            foreach ($headers as $col => $info) {
                $label = $info['label'] . ($info['required'] ? ' *' : '');
                $sheet->setCellValue($col . '1', $label);
                
                // Style header
                $style = $sheet->getStyle($col . '1');
                $style->getFont()->setBold(true)->setSize(11);
                $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $style->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB($info['required'] ? 'FFD9D9' : 'E0E0E0');
                $style->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                
                // Auto width
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Row 2: Keterangan format
            $sheet->setCellValue('A2', 'Contoh: 2024001');
            $sheet->setCellValue('B2', 'Contoh: 1234567890');
            $sheet->setCellValue('C2', 'Contoh: 3201012345678901');
            $sheet->setCellValue('D2', 'Contoh: Ahmad Fauzi');
            $sheet->setCellValue('E2', 'L atau P');
            $sheet->setCellValue('F2', 'Contoh: Jakarta');
            $sheet->setCellValue('G2', 'Format: YYYY-MM-DD');
            $sheet->setCellValue('H2', 'Alamat lengkap');
            $sheet->setCellValue('I2', 'Contoh: DKI Jakarta');
            $sheet->setCellValue('J2', 'Contoh: Jakarta Selatan');
            $sheet->setCellValue('U2', 'Nama lengkap ayah');
            $sheet->setCellValue('Y2', 'Contoh: 081234567890');
            $sheet->setCellValue('Z2', 'Nama lengkap ibu');
            $sheet->setCellValue('AD2', 'Contoh: 081234567890');
            
            // Style row keterangan
            $sheet->getStyle('A2:AD2')->getFont()->setItalic(true)->setSize(9);
            $sheet->getStyle('A2:AD2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle('A2:AD2')->getFill()->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('F9F9F9');
            
            // Row 3: Info
            $sheet->mergeCells('A3:AD3');
            $sheet->setCellValue('A3', 'KETERANGAN: Kolom dengan tanda * (merah) WAJIB diisi. Kolom abu-abu adalah OPSIONAL.');
            $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(10)->getColor()->setRGB('FF0000');
            $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            
            // Freeze header
            $sheet->freezePane('A4');
            
            $filename = 'template-import-santri.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'excel');
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);
            
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat template: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/v1/kesantrian/santri/export
     * Export all santri data to Excel
     */
    public function export()
    {
        try {
            $santri = Santri::with(['kelas', 'asrama'])->orderBy('nama_santri')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Header row
            $headers = [
                'NIS', 'NISN', 'NIK Santri', 'Nama Santri', 'Jenis Kelamin', 
                'Tempat Lahir', 'Tanggal Lahir', 'Alamat',
                'Provinsi', 'Kabupaten', 'Kecamatan', 'Desa', 'Kode Pos',
                'Kelas', 'Asrama', 'Asal Sekolah', 'Hobi', 'Cita-cita', 'Jumlah Saudara',
                'No KK', 'Nama Ayah', 'NIK Ayah', 'Pendidikan Ayah', 'Pekerjaan Ayah', 'HP Ayah',
                'Nama Ibu', 'NIK Ibu', 'Pendidikan Ibu', 'Pekerjaan Ibu', 'HP Ibu',
            ];
            
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('4472C4');
                $sheet->getStyle($col . '1')->getFont()->getColor()->setRGB('FFFFFF');
                $sheet->getStyle($col . '1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getColumnDimension($col)->setAutoSize(true);
                $col++;
            }
            
            // Data rows
            $row = 2;
            foreach ($santri as $s) {
                $sheet->setCellValue('A' . $row, $s->nis ?? '');
                $sheet->setCellValue('B' . $row, $s->nisn ?? '');
                $sheet->setCellValue('C' . $row, $s->nik_santri ?? '');
                $sheet->setCellValue('D' . $row, $s->nama_santri ?? '');
                $sheet->setCellValue('E' . $row, $s->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan');
                $sheet->setCellValue('F' . $row, $s->tempat_lahir ?? '');
                $sheet->setCellValue('G' . $row, $s->tanggal_lahir ?? '');
                $sheet->setCellValue('H' . $row, $s->alamat ?? '');
                $sheet->setCellValue('I' . $row, $s->provinsi ?? '');
                $sheet->setCellValue('J' . $row, $s->kabupaten ?? '');
                $sheet->setCellValue('K' . $row, $s->kecamatan ?? '');
                $sheet->setCellValue('L' . $row, $s->desa ?? '');
                $sheet->setCellValue('M' . $row, $s->kode_pos ?? '');
                $sheet->setCellValue('N' . $row, $s->kelas->nama_kelas ?? $s->kelas_nama ?? '');
                $sheet->setCellValue('O' . $row, $s->asrama->nama_asrama ?? '');
                $sheet->setCellValue('P' . $row, $s->asal_sekolah ?? '');
                $sheet->setCellValue('Q' . $row, $s->hobi ?? '');
                $sheet->setCellValue('R' . $row, $s->cita_cita ?? '');
                $sheet->setCellValue('S' . $row, $s->jumlah_saudara ?? '');
                $sheet->setCellValue('T' . $row, $s->no_kk ?? '');
                $sheet->setCellValue('U' . $row, $s->nama_ayah ?? '');
                $sheet->setCellValue('V' . $row, $s->nik_ayah ?? '');
                $sheet->setCellValue('W' . $row, $s->pendidikan_ayah ?? '');
                $sheet->setCellValue('X' . $row, $s->pekerjaan_ayah ?? '');
                $sheet->setCellValue('Y' . $row, $s->hp_ayah ?? '');
                $sheet->setCellValue('Z' . $row, $s->nama_ibu ?? '');
                $sheet->setCellValue('AA' . $row, $s->nik_ibu ?? '');
                $sheet->setCellValue('AB' . $row, $s->pendidikan_ibu ?? '');
                $sheet->setCellValue('AC' . $row, $s->pekerjaan_ibu ?? '');
                $sheet->setCellValue('AD' . $row, $s->hp_ibu ?? '');
                $row++;
            }
            
            $filename = 'data-santri-' . date('Y-m-d-His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'excel');
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);
            
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data santri: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/kesantrian/santri/validate-import
     * Validate Excel file before import (dry-run)
     */
    public function validateImport(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:5120',
            ]);

            $file = $request->file('file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            if (count($rows) < 4) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File Excel tidak valid atau kosong',
                ], 400);
            }
            
            $validRows = [];
            $invalidRows = [];
            $warnings = [];
            $duplicateNIS = [];
            
            // Check for duplicate NIS in file
            $nisInFile = [];
            
            for ($i = 3; $i < count($rows); $i++) {
                $rowNum = $i + 1;
                $data = $rows[$i];
                
                // Skip empty rows
                if (empty(array_filter($data))) {
                    continue;
                }
                
                $errors = [];
                $warns = [];
                
                // Validate required fields
                $nis = trim($data[0] ?? '');
                if (empty($nis)) {
                    $errors[] = 'NIS tidak boleh kosong';
                } else {
                    // Check duplicate in file
                    if (isset($nisInFile[$nis])) {
                        $errors[] = "NIS duplikat dengan baris {$nisInFile[$nis]}";
                    } else {
                        $nisInFile[$nis] = $rowNum;
                    }
                    
                    // Check if exists in database
                    $existing = Santri::where('nis', $nis)->first();
                    if ($existing) {
                        $warns[] = "NIS sudah terdaftar a.n. {$existing->nama_santri} (akan diupdate)";
                    }
                }
                
                $namaSantri = trim($data[3] ?? '');
                if (empty($namaSantri)) {
                    $errors[] = 'Nama Santri tidak boleh kosong';
                }
                
                $jenisKelamin = trim($data[4] ?? '');
                if (empty($jenisKelamin)) {
                    $errors[] = 'Jenis Kelamin tidak boleh kosong';
                } else {
                    $jk = strtoupper(substr($jenisKelamin, 0, 1));
                    if ($jk !== 'L' && $jk !== 'P') {
                        if (stripos($jenisKelamin, 'perempuan') === false && 
                            stripos($jenisKelamin, 'wanita') === false &&
                            stripos($jenisKelamin, 'laki') === false &&
                            stripos($jenisKelamin, 'pria') === false) {
                            $errors[] = 'Jenis Kelamin harus L/P atau Laki-laki/Perempuan';
                        }
                    }
                }
                
                $tempatLahir = trim($data[5] ?? '');
                if (empty($tempatLahir)) {
                    $errors[] = 'Tempat Lahir tidak boleh kosong';
                }
                
                $tanggalLahir = trim($data[6] ?? '');
                if (empty($tanggalLahir)) {
                    $errors[] = 'Tanggal Lahir tidak boleh kosong';
                } else {
                    // Validate date format
                    $dateFormats = ['Y-m-d', 'Y/m/d', 'd-m-Y', 'd/m/Y'];
                    $validDate = false;
                    foreach ($dateFormats as $format) {
                        $d = \DateTime::createFromFormat($format, $tanggalLahir);
                        if ($d && $d->format($format) === $tanggalLahir) {
                            $validDate = true;
                            break;
                        }
                    }
                    if (!$validDate) {
                        $errors[] = 'Format Tanggal Lahir tidak valid (gunakan YYYY-MM-DD)';
                    }
                }
                
                $alamat = trim($data[7] ?? '');
                if (empty($alamat)) {
                    $errors[] = 'Alamat tidak boleh kosong';
                }
                
                $namaAyah = trim($data[20] ?? '');
                if (empty($namaAyah)) {
                    $errors[] = 'Nama Ayah tidak boleh kosong';
                }
                
                $namaIbu = trim($data[25] ?? '');
                if (empty($namaIbu)) {
                    $errors[] = 'Nama Ibu tidak boleh kosong';
                }
                
                // Check optional fields for warnings
                $nisn = trim($data[1] ?? '');
                if (empty($nisn)) {
                    $warns[] = 'NISN kosong (opsional)';
                }
                
                $hpAyah = trim($data[24] ?? '');
                $hpIbu = trim($data[29] ?? '');
                if (empty($hpAyah) && empty($hpIbu)) {
                    $warns[] = 'HP Ayah dan HP Ibu kosong (disarankan diisi minimal salah satu untuk fitur login wali)';
                }
                
                $rowData = [
                    'row' => $rowNum,
                    'nis' => $nis,
                    'nama' => $namaSantri,
                    'jenis_kelamin' => $jenisKelamin,
                    'tempat_lahir' => $tempatLahir,
                    'tanggal_lahir' => $tanggalLahir,
                    'errors' => $errors,
                    'warnings' => $warns,
                ];
                
                if (count($errors) > 0) {
                    $invalidRows[] = $rowData;
                } else {
                    $validRows[] = $rowData;
                    if (count($warns) > 0) {
                        $warnings = array_merge($warnings, $warns);
                    }
                }
            }
            
            $totalRows = count($validRows) + count($invalidRows);
            $canImport = count($invalidRows) === 0;
            
            return response()->json([
                'status' => 'success',
                'can_import' => $canImport,
                'summary' => [
                    'total_rows' => $totalRows,
                    'valid_rows' => count($validRows),
                    'invalid_rows' => count($invalidRows),
                    'warnings_count' => count($warnings),
                ],
                'valid_rows' => array_slice($validRows, 0, 10), // Show first 10 valid rows
                'invalid_rows' => $invalidRows,
                'warnings' => array_slice(array_unique($warnings), 0, 20), // Show unique warnings
                'message' => $canImport 
                    ? "File siap diimport: {$totalRows} baris data valid" 
                    : "Ditemukan " . count($invalidRows) . " baris dengan error. Perbaiki data sebelum import.",
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'File tidak valid. Hanya menerima file Excel (.xlsx atau .xls)',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memvalidasi file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/kesantrian/santri/import
     * Import santri data from Excel
     */
    public function import(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:5120', // 5MB max
            ]);

            $file = $request->file('file');
            $path = $file->getRealPath();
            
            $spreadsheet = IOFactory::load($path);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            if (count($rows) < 4) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File Excel tidak valid atau kosong',
                ], 400);
            }
            
            $imported = 0;
            $updated = 0;
            $errors = [];
            
            // Start from row 4 (skip header, example, and info rows)
            for ($i = 3; $i < count($rows); $i++) {
                $rowNum = $i + 1;
                $data = $rows[$i];
                
                try {
                    // Skip empty rows
                    if (empty(array_filter($data))) {
                        continue;
                    }
                    
                    $nis = trim($data[0] ?? '');
                    if (empty($nis)) {
                        $errors[] = "Baris {$rowNum}: NIS tidak boleh kosong";
                        continue;
                    }
                    
                    $namaSantri = trim($data[3] ?? '');
                    if (empty($namaSantri)) {
                        $errors[] = "Baris {$rowNum}: Nama Santri tidak boleh kosong";
                        continue;
                    }
                    
                    $jenisKelamin = trim($data[4] ?? '');
                    if (empty($jenisKelamin)) {
                        $errors[] = "Baris {$rowNum}: Jenis Kelamin tidak boleh kosong";
                        continue;
                    }
                    
                    // Check if santri already exists
                    $existing = Santri::where('nis', $nis)->first();
                    
                    // Convert jenis kelamin
                    $jk = strtoupper(substr($jenisKelamin, 0, 1));
                    if ($jk !== 'L' && $jk !== 'P') {
                        if (stripos($jenisKelamin, 'perempuan') !== false || stripos($jenisKelamin, 'wanita') !== false) {
                            $jk = 'P';
                        } else {
                            $jk = 'L';
                        }
                    }
                    
                    $santriData = [
                        'nis' => $nis,
                        'nisn' => trim($data[1] ?? '') ?: null,
                        'nik_santri' => trim($data[2] ?? '') ?: null,
                        'nama_santri' => $namaSantri,
                        'jenis_kelamin' => $jk,
                        'tempat_lahir' => trim($data[5] ?? ''),
                        'tanggal_lahir' => trim($data[6] ?? ''),
                        'alamat' => trim($data[7] ?? ''),
                        'provinsi' => trim($data[8] ?? '') ?: null,
                        'kabupaten' => trim($data[9] ?? '') ?: null,
                        'kecamatan' => trim($data[10] ?? '') ?: null,
                        'desa' => trim($data[11] ?? '') ?: null,
                        'kode_pos' => trim($data[12] ?? '') ?: null,
                        'kelas_nama' => trim($data[13] ?? '') ?: null,
                        'asal_sekolah' => trim($data[15] ?? '') ?: null,
                        'hobi' => trim($data[16] ?? '') ?: null,
                        'cita_cita' => trim($data[17] ?? '') ?: null,
                        'jumlah_saudara' => !empty($data[18]) ? (int)$data[18] : null,
                        'no_kk' => trim($data[19] ?? '') ?: null,
                        'nama_ayah' => trim($data[20] ?? ''),
                        'nik_ayah' => trim($data[21] ?? '') ?: null,
                        'pendidikan_ayah' => trim($data[22] ?? '') ?: null,
                        'pekerjaan_ayah' => trim($data[23] ?? '') ?: null,
                        'hp_ayah' => trim($data[24] ?? '') ?: null,
                        'nama_ibu' => trim($data[25] ?? ''),
                        'nik_ibu' => trim($data[26] ?? '') ?: null,
                        'pendidikan_ibu' => trim($data[27] ?? '') ?: null,
                        'pekerjaan_ibu' => trim($data[28] ?? '') ?: null,
                        'hp_ibu' => trim($data[29] ?? '') ?: null,
                        'status' => 'aktif',
                        'jenis_penerimaan' => 'baru',
                    ];
                    
                    if ($existing) {
                        $existing->update($santriData);
                        $updated++;
                    } else {
                        Santri::create($santriData);
                        $imported++;
                    }
                } catch (Throwable $e) {
                    $errors[] = "Baris {$rowNum}: " . $e->getMessage();
                }
            }
            
            $message = "Berhasil import {$imported} data baru";
            if ($updated > 0) {
                $message .= " dan update {$updated} data";
            }
            
            return response()->json([
                'status' => 'success',
                'message' => $message,
                'imported' => $imported,
                'updated' => $updated,
                'errors' => $errors,
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'File tidak valid. Hanya menerima file Excel (.xlsx atau .xls)',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal import data: ' . $e->getMessage(),
            ], 500);
        }
    }
}