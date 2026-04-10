<?php

namespace App\Services\Santri;

use App\Models\Santri;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class SantriImportExportService
{
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

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

        foreach ($headers as $col => $info) {
            $label = $info['label'] . ($info['required'] ? ' *' : '');
            $sheet->setCellValue($col . '1', $label);
            $style = $sheet->getStyle($col . '1');
            $style->getFont()->setBold(true)->setSize(11);
            $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $style->getFill()->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB($info['required'] ? 'FFD9D9' : 'E0E0E0');
            $style->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

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

        $sheet->getStyle('A2:AD2')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('A2:AD2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        $sheet->getStyle('A2:AD2')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F9F9F9');

        $sheet->mergeCells('A3:AD3');
        $sheet->setCellValue('A3', 'KETERANGAN: Kolom dengan tanda * (merah) WAJIB diisi. Kolom abu-abu adalah OPSIONAL.');
        $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(10)->getColor()->setRGB('FF0000');
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->freezePane('A4');

        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        (new Xlsx($spreadsheet))->save($tempFile);

        return response()->download($tempFile, 'template-import-santri.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function exportToExcel(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $santri = Santri::with(['kelas', 'asrama'])->orderBy('nama_santri')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

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

        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        (new Xlsx($spreadsheet))->save($tempFile);

        return response()->download($tempFile, 'data-santri-' . date('Y-m-d-His') . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function validateImportFile(Request $request): array
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls|max:5120']);

        $rows = $this->loadRows($request->file('file')->getRealPath());

        if (count($rows) < 4) {
            return ['status' => 'error', 'message' => 'File Excel tidak valid atau kosong', 'status_code' => 400];
        }

        $validRows = [];
        $invalidRows = [];
        $warnings = [];
        $nisInFile = [];

        for ($i = 3; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty(array_filter($row))) {
                continue;
            }

            [$errors, $warns] = $this->validateRow($row, $i + 1, $nisInFile);

            $rowData = [
                'row' => $i + 1,
                'nis' => trim($row[0] ?? ''),
                'nama' => trim($row[3] ?? ''),
                'jenis_kelamin' => trim($row[4] ?? ''),
                'tempat_lahir' => trim($row[5] ?? ''),
                'tanggal_lahir' => trim($row[6] ?? ''),
                'errors' => $errors,
                'warnings' => $warns,
            ];

            if (count($errors) > 0) {
                $invalidRows[] = $rowData;
            } else {
                $validRows[] = $rowData;
                $warnings = array_merge($warnings, $warns);
            }
        }

        $totalRows = count($validRows) + count($invalidRows);
        $canImport = count($invalidRows) === 0;

        return [
            'status' => 'success',
            'can_import' => $canImport,
            'summary' => [
                'total_rows' => $totalRows,
                'valid_rows' => count($validRows),
                'invalid_rows' => count($invalidRows),
                'warnings_count' => count($warnings),
            ],
            'valid_rows' => array_slice($validRows, 0, 10),
            'invalid_rows' => $invalidRows,
            'warnings' => array_slice(array_unique($warnings), 0, 20),
            'message' => $canImport
                ? "File siap diimport: {$totalRows} baris data valid"
                : "Ditemukan " . count($invalidRows) . " baris dengan error. Perbaiki data sebelum import.",
        ];
    }

    public function importFromExcel(Request $request): array
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls|max:5120']);

        $rows = $this->loadRows($request->file('file')->getRealPath());

        if (count($rows) < 4) {
            return ['status' => 'error', 'message' => 'File Excel tidak valid atau kosong', 'status_code' => 400];
        }

        $imported = 0;
        $updated = 0;
        $errors = [];

        for ($i = 3; $i < count($rows); $i++) {
            $rowNum = $i + 1;
            $data = $rows[$i];

            if (empty(array_filter($data))) {
                continue;
            }

            $nis = trim($data[0] ?? '');
            $namaSantri = trim($data[3] ?? '');
            $jenisKelamin = trim($data[4] ?? '');

            if (empty($nis)) { $errors[] = "Baris {$rowNum}: NIS tidak boleh kosong"; continue; }
            if (empty($namaSantri)) { $errors[] = "Baris {$rowNum}: Nama Santri tidak boleh kosong"; continue; }
            if (empty($jenisKelamin)) { $errors[] = "Baris {$rowNum}: Jenis Kelamin tidak boleh kosong"; continue; }

            try {
                $jk = $this->normalizeJenisKelamin($jenisKelamin);
                $santriData = $this->mapRowToData($data, $nis, $namaSantri, $jk);

                $existing = Santri::where('nis', $nis)->first();
                if ($existing) {
                    $existing->update($santriData);
                    $updated++;
                } else {
                    Santri::create($santriData);
                    $imported++;
                }
            } catch (\Exception $e) {
                $errors[] = "Baris {$rowNum}: " . $e->getMessage();
            }
        }

        $message = "Import selesai: {$imported} data baru, {$updated} data diperbarui";
        if (count($errors) > 0) {
            $message .= ", " . count($errors) . " baris gagal";
        }

        return [
            'status' => 'success',
            'message' => $message,
            'imported' => $imported,
            'updated' => $updated,
            'errors' => $errors,
        ];
    }

    private function loadRows(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        return $spreadsheet->getActiveSheet()->toArray();
    }

    private function validateRow(array $data, int $rowNum, array &$nisInFile): array
    {
        $errors = [];
        $warns = [];

        $nis = trim($data[0] ?? '');
        if (empty($nis)) {
            $errors[] = 'NIS tidak boleh kosong';
        } else {
            if (isset($nisInFile[$nis])) {
                $errors[] = "NIS duplikat dengan baris {$nisInFile[$nis]}";
            } else {
                $nisInFile[$nis] = $rowNum;
                $existing = Santri::where('nis', $nis)->first();
                if ($existing) {
                    $warns[] = "NIS sudah terdaftar a.n. {$existing->nama_santri} (akan diupdate)";
                }
            }
        }

        if (empty(trim($data[3] ?? ''))) $errors[] = 'Nama Santri tidak boleh kosong';
        if (empty(trim($data[20] ?? ''))) $errors[] = 'Nama Ayah tidak boleh kosong';
        if (empty(trim($data[25] ?? ''))) $errors[] = 'Nama Ibu tidak boleh kosong';
        if (empty(trim($data[5] ?? ''))) $errors[] = 'Tempat Lahir tidak boleh kosong';
        if (empty(trim($data[7] ?? ''))) $errors[] = 'Alamat tidak boleh kosong';

        $jenisKelamin = trim($data[4] ?? '');
        if (empty($jenisKelamin)) {
            $errors[] = 'Jenis Kelamin tidak boleh kosong';
        } else {
            $jk = strtoupper(substr($jenisKelamin, 0, 1));
            if (!in_array($jk, ['L', 'P']) && !preg_match('/perempuan|wanita|laki|pria/i', $jenisKelamin)) {
                $errors[] = 'Jenis Kelamin harus L/P atau Laki-laki/Perempuan';
            }
        }

        $tanggalLahir = trim($data[6] ?? '');
        if (empty($tanggalLahir)) {
            $errors[] = 'Tanggal Lahir tidak boleh kosong';
        } else {
            $validDate = false;
            foreach (['Y-m-d', 'Y/m/d', 'd-m-Y', 'd/m/Y'] as $format) {
                $d = \DateTime::createFromFormat($format, $tanggalLahir);
                if ($d && $d->format($format) === $tanggalLahir) { $validDate = true; break; }
            }
            if (!$validDate) $errors[] = 'Format Tanggal Lahir tidak valid (gunakan YYYY-MM-DD)';
        }

        $hpAyah = trim($data[24] ?? '');
        $hpIbu = trim($data[29] ?? '');
        if (empty($hpAyah) && empty($hpIbu)) {
            $warns[] = 'HP Ayah dan HP Ibu kosong (disarankan diisi minimal salah satu untuk fitur login wali)';
        }

        return [$errors, $warns];
    }

    private function normalizeJenisKelamin(string $value): string
    {
        $jk = strtoupper(substr($value, 0, 1));
        if ($jk !== 'L' && $jk !== 'P') {
            return (stripos($value, 'perempuan') !== false || stripos($value, 'wanita') !== false) ? 'P' : 'L';
        }
        return $jk;
    }

    private function mapRowToData(array $data, string $nis, string $namaSantri, string $jk): array
    {
        return [
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
            'jumlah_saudara' => !empty($data[18]) ? (int) $data[18] : null,
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
    }
}
