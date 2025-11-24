<?php

namespace App\Http\Controllers;

use App\Models\Pembayaran;
use App\Models\TagihanSantri;
use App\Models\BukuKas;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PembayaranController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pembayaran::with(['santri', 'tagihanSantri.jenisTagihan', 'bukuKas']);

        // Filter by santri
        if ($request->has('santri_id')) {
            $query->where('santri_id', $request->santri_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal_bayar', [$request->start_date, $request->end_date]);
        }

        $pembayaran = $query->orderBy('tanggal_bayar', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $pembayaran
        ]);
    }

    /**
     * Get history pembayaran per santri (grouped by bulan-tahun tagihan)
     */
    public function history($santriId)
    {
        $pembayaran = Pembayaran::with(['tagihanSantri.jenisTagihan'])
            ->where('santri_id', $santriId)
            ->orderBy('tanggal_bayar', 'desc')
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'no_transaksi' => $p->no_transaksi,
                    'tanggal_bayar' => $p->tanggal_bayar,
                    'nominal_bayar' => $p->nominal_bayar,
                    'sisa_sebelum' => $p->sisa_sebelum,
                    'sisa_sesudah' => $p->sisa_sesudah,
                    'metode_pembayaran' => $p->metode_pembayaran,
                    'status_pembayaran' => $p->status_pembayaran,
                    'keterangan' => $p->keterangan,
                    'kwitansi_snapshot' => $p->kwitansi_snapshot, // Include snapshot untuk reprint
                    // Info tagihan
                    'jenis_tagihan' => $p->tagihanSantri->jenisTagihan->nama_tagihan,
                    'bulan' => $p->tagihanSantri->bulan,
                    'tahun' => $p->tagihanSantri->tahun,
                    'nominal_tagihan' => $p->tagihanSantri->nominal,
                    'admin_penerima' => $p->kwitansi_snapshot['admin'] ?? 'Admin', // Ambil dari snapshot jika ada
                ];
            })
            ->groupBy(function($item) {
                return $item['bulan'] . ' ' . $item['tahun'];
            });

        return response()->json([
            'success' => true,
            'data' => $pembayaran
        ]);
    }

    /**
     * Store a newly created resource (Proses Pembayaran).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tagihan_santri_id' => 'required|exists:tagihan_santri,id',
            'nominal_bayar' => 'required|numeric|min:0',
            'metode_pembayaran' => 'required|in:cash,transfer',
            'tanggal_bayar' => 'required|date',
            'keterangan' => 'nullable|string',
            'kwitansi_data' => 'nullable|array', // Data kwitansi dari frontend
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Ambil data tagihan
            $tagihan = TagihanSantri::with('jenisTagihan.bukuKas', 'santri')->findOrFail($request->tagihan_santri_id);
            
            // Validasi nominal tidak melebihi sisa tagihan
            if ($request->nominal_bayar > $tagihan->sisa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nominal pembayaran melebihi sisa tagihan'
                ], 400);
            }

            // Generate nomor transaksi
            $noTransaksi = Pembayaran::generateNoTransaksi();

            // Simpan sisa sebelum dan sesudah bayar untuk snapshot kwitansi
            $sisaSebelumBayar = $tagihan->sisa;
            $sisaSetelahBayar = $tagihan->sisa - $request->nominal_bayar;
            $statusPembayaran = $sisaSetelahBayar == 0 ? 'lunas' : 'sebagian';

            // Generate kwitansi snapshot - data yang akan disimpan persis seperti saat pembayaran
            $kwitansiSnapshot = $request->kwitansi_data ?? [
                'no_kwitansi' => strtoupper(substr(md5($noTransaksi . time()), 0, 9)),
                'type' => $statusPembayaran,
                'santri' => [
                    'nis' => $tagihan->santri->nis,
                    'nama_santri' => $tagihan->santri->nama,
                    'kelas' => $tagihan->santri->kelas?->nama_kelas ?? '-',
                ],
                'tagihan' => [
                    'jenis_tagihan' => $tagihan->jenisTagihan->nama_tagihan,
                    'bulan' => $tagihan->bulan,
                    'tahun' => $tagihan->tahun,
                    'nominal' => (float) $tagihan->nominal,
                ],
                'pembayaran' => [
                    'nominal_bayar' => (float) $request->nominal_bayar,
                    'sisa_sebelum' => (float) $sisaSebelumBayar,
                    'sisa_sesudah' => (float) $sisaSetelahBayar,
                    'metode_pembayaran' => $request->metode_pembayaran,
                    'tanggal_bayar' => $request->tanggal_bayar,
                ],
                'admin' => $request->user()?->name ?? 'Admin',
                'tanggal_cetak' => now()->setTimezone('Asia/Jakarta')->format('d F Y'),
                'jam_cetak' => now()->setTimezone('Asia/Jakarta')->format('H:i:s') . ' WIB',
            ];

            // Buat record pembayaran
            $pembayaran = Pembayaran::create([
                'santri_id' => $tagihan->santri_id,
                'tagihan_santri_id' => $tagihan->id,
                'buku_kas_id' => $tagihan->jenisTagihan->buku_kas_id,
                'no_transaksi' => $noTransaksi,
                'tanggal_bayar' => $request->tanggal_bayar,
                'nominal_bayar' => $request->nominal_bayar,
                'sisa_sebelum' => $sisaSebelumBayar,  // Snapshot sisa sebelum bayar
                'sisa_sesudah' => $sisaSetelahBayar,   // Snapshot sisa sesudah bayar
                'metode_pembayaran' => $request->metode_pembayaran,
                'status_pembayaran' => $statusPembayaran,
                'keterangan' => $request->keterangan,
                'kwitansi_snapshot' => $kwitansiSnapshot, // Simpan snapshot kwitansi
            ]);

            // Update tagihan santri
            $dibayarBaru = $tagihan->dibayar + $request->nominal_bayar;
            $sisaBaru = $tagihan->sisa - $request->nominal_bayar;
            
            $statusTagihan = 'belum_bayar';
            if ($dibayarBaru >= $tagihan->nominal) {
                $statusTagihan = 'lunas';
            } elseif ($dibayarBaru > 0) {
                $statusTagihan = 'sebagian';
            }

            $tagihan->update([
                'dibayar' => $dibayarBaru,
                'sisa' => $sisaBaru,
                'status' => $statusTagihan
            ]);

            // Catat sebagai transaksi pemasukan di buku kas
            // Retry jika ada duplicate key
            $maxRetries = 5;
            $transaksiKasCreated = false;
            
            for ($i = 0; $i < $maxRetries; $i++) {
                try {
                    $noTransaksiKas = TransaksiKas::generateNoTransaksi('pemasukan');
                    
                    // Add random suffix if retry
                    if ($i > 0) {
                        $noTransaksiKas .= '-' . $i;
                    }
                    
                    TransaksiKas::create([
                        'buku_kas_id' => $tagihan->jenisTagihan->buku_kas_id,
                        'no_transaksi' => $noTransaksiKas,
                        'tanggal' => $request->tanggal_bayar,
                        'jenis' => 'pemasukan',
                        'metode' => $request->metode_pembayaran,
                        'kategori' => 'Pembayaran Tagihan',
                        'nominal' => $request->nominal_bayar,
                        'keterangan' => $request->keterangan ?? "Pembayaran {$tagihan->jenisTagihan->nama_tagihan} - {$tagihan->bulan} {$tagihan->tahun}",
                        'pembayaran_id' => $pembayaran->id,
                    ]);
                    
                    $transaksiKasCreated = true;
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    if ($e->getCode() !== '23000') { // Not a constraint violation
                        throw $e;
                    }
                    // Continue to retry with new number
                    usleep(100000); // Wait 100ms before retry
                }
            }
            
            if (!$transaksiKasCreated) {
                throw new \Exception('Gagal membuat transaksi kas setelah beberapa percobaan');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil diproses',
                'data' => $pembayaran->load(['santri', 'tagihanSantri', 'bukuKas'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Pembayaran error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $pembayaran = Pembayaran::with(['santri', 'tagihanSantri.jenisTagihan', 'bukuKas'])->find($id);

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $pembayaran
        ]);
    }

    /**
     * Get tagihan untuk santri tertentu
     */
    public function getTagihanBySantri($santriId)
    {
        $tagihan = TagihanSantri::with('jenisTagihan')
            ->where('santri_id', $santriId)
            ->whereIn('status', ['belum_bayar', 'sebagian'])
            ->orderBy('tahun', 'asc')
            ->orderByRaw("CASE bulan
                WHEN 'Januari' THEN 1
                WHEN 'Februari' THEN 2
                WHEN 'Maret' THEN 3
                WHEN 'April' THEN 4
                WHEN 'Mei' THEN 5
                WHEN 'Juni' THEN 6
                WHEN 'Juli' THEN 7
                WHEN 'Agustus' THEN 8
                WHEN 'September' THEN 9
                WHEN 'Oktober' THEN 10
                WHEN 'November' THEN 11
                WHEN 'Desember' THEN 12
                END")
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tagihan
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $pembayaran = Pembayaran::with('tagihanSantri', 'bukuKas')->find($id);

            if (!$pembayaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pembayaran tidak ditemukan'
                ], 404);
            }

            // Kembalikan saldo tagihan
            $tagihan = $pembayaran->tagihanSantri;
            $tagihan->increment('sisa', $pembayaran->nominal_bayar);
            $tagihan->decrement('dibayar', $pembayaran->nominal_bayar);
            
            // Update status tagihan
            $statusTagihan = 'belum_bayar';
            if ($tagihan->dibayar >= $tagihan->nominal) {
                $statusTagihan = 'lunas';
            } elseif ($tagihan->dibayar > 0) {
                $statusTagihan = 'sebagian';
            }
            $tagihan->update(['status' => $statusTagihan]);

            // Hapus transaksi kas terkait
            // JANGAN decrement saldo_awal, transaksi akan otomatis hilang dari perhitungan
            TransaksiKas::where('pembayaran_id', $pembayaran->id)->delete();

            $pembayaran->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dibatalkan'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }
}
