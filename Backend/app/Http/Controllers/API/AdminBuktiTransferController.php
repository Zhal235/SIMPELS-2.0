<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BuktiTransfer;
use App\Models\TagihanSantri;
use App\Models\Pembayaran;
use App\Models\TransaksiKas;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class AdminBuktiTransferController extends Controller
{
    /**
     * Get all bukti transfer (with filter)
     */
    public function index(Request $request)
    {
        try {
            $query = BuktiTransfer::with(['santri', 'processedBy', 'selectedBank']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: show only pending
                $query->where('status', 'pending');
            }

            $buktiList = $query->orderBy('uploaded_at', 'desc')
                ->get()
                ->map(function ($bukti) {
                    // Get tagihan details (if not topup-only)
                    $tagihans = collect([]);
                    if ($bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
                        $tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)
                            ->with('jenisTagihan')
                            ->get();
                        
                        // For approved/rejected bukti, get actual payment amounts from pembayaran table
                        if (in_array($bukti->status, ['approved', 'rejected'])) {
                            $pembayaranData = Pembayaran::where('bukti_pembayaran', $bukti->bukti_path)
                                ->whereIn('tagihan_santri_id', $bukti->tagihan_ids)
                                ->get()
                                ->keyBy('tagihan_santri_id');
                            
                            // Map payment amounts to tagihan
                            $tagihans = $tagihans->map(function ($t) use ($pembayaranData) {
                                $pembayaran = $pembayaranData->get($t->id);
                                // Add nominal_bayar field for actual payment amount
                                $t->nominal_bayar = $pembayaran ? $pembayaran->nominal_bayar : 0;
                                return $t;
                            });
                        }
                    }
                    
                    // Calculate topup amount
                    $nominalTopup = 0;
                    if ($bukti->jenis_transaksi === 'topup') {
                        $nominalTopup = $bukti->total_nominal;
                    } else if ($bukti->jenis_transaksi === 'pembayaran_topup') {
                        // Extract from catatan_admin or calculate from total - tagihan
                        if ($bukti->catatan_admin && preg_match('/Top-up dompet[:\s]+Rp\s*([\d.,]+)/', $bukti->catatan_admin, $matches)) {
                            $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $matches[1]);
                        } else {
                            // Fallback: calculate from total - sum of payments
                            $totalPembayaran = $tagihans->sum('nominal_bayar');
                            $nominalTopup = $bukti->total_nominal - $totalPembayaran;
                        }
                    }
                    
                    return [
                        'id' => $bukti->id,
                        'jenis_transaksi' => $bukti->jenis_transaksi ?? 'pembayaran',
                        'santri' => $bukti->santri ? [
                            'id' => $bukti->santri->id,
                            'nis' => $bukti->santri->nis,
                            'nama' => $bukti->santri->nama_santri ?? $bukti->santri->nama,
                            'kelas' => optional($bukti->santri->kelas)->nama_kelas ?? optional($bukti->santri->kelas)->nama ?? null,
                        ] : null,
                        'selected_bank' => $bukti->selectedBank ? [
                            'id' => $bukti->selectedBank->id,
                            'bank_name' => $bukti->selectedBank->bank_name,
                            'account_number' => $bukti->selectedBank->account_number,
                            'account_name' => $bukti->selectedBank->account_name,
                        ] : null,
                        'total_nominal' => $bukti->total_nominal,
                        'nominal_topup' => $nominalTopup,
                        'status' => $bukti->status,
                        'catatan_wali' => $bukti->catatan_wali,
                        'catatan_admin' => $bukti->catatan_admin,
                        'bukti_url' => $bukti->bukti_path ? url('storage/' . $bukti->bukti_path) : null,
                        'uploaded_at' => $bukti->uploaded_at->format('Y-m-d H:i:s'),
                        'processed_at' => $bukti->processed_at ? $bukti->processed_at->format('Y-m-d H:i:s') : null,
                        'processed_by' => $bukti->processedBy ? $bukti->processedBy->name : null,
                        'tagihan' => $tagihans->map(function ($t) use ($bukti) {
                            return [
                                'id' => $t->id,
                                'jenis' => $t->jenisTagihan->nama_tagihan ?? 'Biaya',
                                'bulan' => $t->bulan,
                                'tahun' => $t->tahun,
                                'nominal' => $t->nominal,
                                'dibayar' => $t->dibayar,
                                'sisa' => $t->sisa,
                                'status' => $t->status,
                                // Add actual payment amount for this transaction
                                'nominal_bayar' => $bukti->status === 'pending' ? $t->sisa : ($t->nominal_bayar ?? 0),
                            ];
                        }),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $buktiList,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching bukti transfer: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve bukti transfer
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'catatan' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $bukti = BuktiTransfer::findOrFail($id);

            if ($bukti->status !== 'pending') {
                return response()->json([
                    'error' => 'Bukti transfer sudah diproses sebelumnya'
                ], 400);
            }

            // Check if this is topup-only or combined transaction
            $isTopupOnly = $bukti->jenis_transaksi === 'topup';
            $isPembayaranTopup = $bukti->jenis_transaksi === 'pembayaran_topup';
            
            // Extract topup amount from catatan_admin if combined
            $nominalTopup = 0;
            $nominalPembayaran = $bukti->total_nominal;
            
            if ($isPembayaranTopup && $bukti->catatan_admin) {
                // Parse catatan_admin to get topup amount
                if (preg_match('/Top-up dompet: Rp ([0-9.,]+)/', $bukti->catatan_admin, $matches)) {
                    $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $matches[1]);
                    // Pembayaran amount is total minus topup
                    if (preg_match('/Pembayaran tagihan: Rp ([0-9.,]+)/', $bukti->catatan_admin, $matchesPembayaran)) {
                        $nominalPembayaran = (float) str_replace(['.', ','], ['', '.'], $matchesPembayaran[1]);
                    }
                }
            } else if ($isTopupOnly) {
                $nominalTopup = $bukti->total_nominal;
                $nominalPembayaran = 0;
            }

            // Get santri name for keterangan
            $santri = \App\Models\Santri::find($bukti->santri_id);
            $namaSantri = $santri ? $santri->nama_lengkap : 'Santri';

            // Process tagihan if not topup-only
            if (!$isTopupOnly && $bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
                $tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)->get();

                // Process each tagihan - pay full sisa for each
                foreach ($tagihans as $tagihan) {
                    // Pay the full remaining amount (sisa) for this tagihan
                    $sisaTagihan = $tagihan->nominal - $tagihan->dibayar;
                    $nominalBayar = $sisaTagihan; // Pay full sisa, not divided

                // Capture sisa before applying payment
                $sisaSebelum = $sisaTagihan;

                // Update tagihan
                $tagihan->dibayar += $nominalBayar;
                $tagihan->sisa = $tagihan->nominal - $tagihan->dibayar;
                
                if ($tagihan->sisa <= 0) {
                    $tagihan->status = 'lunas';
                } else if ($tagihan->dibayar > 0) {
                    $tagihan->status = 'sebagian';
                }
                
                $tagihan->save();

                // Prepare pembayaran attributes — ensure required fields exist
                $bukuKasId = DB::table('buku_kas')->value('id');
                if (!$bukuKasId) {
                    // Create a default buku kas if none exists
                    $bukuKasId = DB::table('buku_kas')->insertGetId([
                        'nama_kas' => 'Kas Default',
                        'saldo_cash_awal' => 0,
                        'saldo_bank_awal' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $noTransaksi = Pembayaran::generateNoTransaksi();

                // nominalBayar already applied and saved above — compute sisa after
                $sisaSesudah = $tagihan->sisa;

                $statusPembayaran = $sisaSesudah <= 0 ? 'lunas' : 'sebagian';

                $pembayaran = Pembayaran::create([
                    'tagihan_santri_id' => $tagihan->id,
                    'santri_id' => $bukti->santri_id,
                    'buku_kas_id' => $bukuKasId,
                    'no_transaksi' => $noTransaksi,
                    'tanggal_bayar' => now(),
                    'nominal_bayar' => $nominalBayar,
                    'metode_pembayaran' => 'transfer',
                    'status_pembayaran' => $statusPembayaran,
                    'sisa_sebelum' => $sisaSebelum,
                    'sisa_sesudah' => $sisaSesudah,
                    'keterangan' => 'Pembayaran via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
                    'bukti_pembayaran' => $bukti->bukti_path,
                ]);

                // Catat sebagai transaksi pemasukan di buku kas
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
                            'buku_kas_id' => $bukuKasId,
                            'no_transaksi' => $noTransaksiKas,
                            'tanggal' => now(),
                            'jenis' => 'pemasukan',
                            'metode' => 'transfer',
                            'kategori' => 'Pembayaran Tagihan',
                            'nominal' => $nominalBayar,
                            'keterangan' => 'Pembayaran ' . $tagihan->jenisTagihan->nama_tagihan . ' - ' . $tagihan->bulan . ' ' . $tagihan->tahun . ' a.n. ' . $namaSantri . ' (via SIMPELS Mobile)',
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
                }
            }

            // Process topup if exists
            if ($nominalTopup > 0) {
                $wallet = \App\Models\Wallet::where('santri_id', $bukti->santri_id)->first();
                
                if (!$wallet) {
                    // Create wallet if doesn't exist
                    $wallet = \App\Models\Wallet::create([
                        'santri_id' => $bukti->santri_id,
                        'balance' => 0,
                    ]);
                }

                // Add topup to wallet
                $oldBalance = $wallet->balance;
                $wallet->balance += $nominalTopup;
                $wallet->save();

                // Create wallet transaction record
                \DB::table('wallet_transactions')->insert([
                    'wallet_id' => (int)$wallet->id,
                    'amount' => (float)$nominalTopup,
                    'type' => 'credit',
                    'description' => 'Top-up via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
                    'balance_after' => (float)$wallet->balance,
                    'created_by' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                \Log::info('Wallet transaction created', [
                    'wallet_id' => $wallet->id,
                    'amount' => $nominalTopup,
                    'balance_after' => $wallet->balance,
                ]);
            }

            // Update bukti transfer status
            $catatan = $request->catatan ?? '';
            if ($nominalTopup > 0 && $nominalPembayaran > 0) {
                $catatan = "Pembayaran tagihan (Rp " . number_format($nominalPembayaran, 0, ',', '.') . ") dan Top-up dompet (Rp " . number_format($nominalTopup, 0, ',', '.') . ") telah diproses. " . $catatan;
            } else if ($nominalTopup > 0) {
                $catatan = "Top-up dompet (Rp " . number_format($nominalTopup, 0, ',', '.') . ") telah diproses. " . $catatan;
            }

            $bukti->update([
                'status' => 'approved',
                'catatan_admin' => $catatan,
                'processed_at' => now(),
                'processed_by' => Auth::id(),
            ]);

            DB::commit();

            // Send notification to wali
            \App\Services\NotificationService::paymentApproved(
                $bukti->santri_id,
                $nominalPembayaran > 0 && $nominalTopup > 0 ? 'Pembayaran + Top-up' : ($nominalTopup > 0 ? 'Top-up' : 'Pembayaran'),
                $bukti->total_nominal
            );

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil disetujui dan pembayaran diproses',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error approving bukti transfer: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Reject bukti transfer
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'catatan' => 'required|string|max:500',
        ]);

        try {
            $bukti = BuktiTransfer::findOrFail($id);

            if ($bukti->status !== 'pending') {
                return response()->json([
                    'error' => 'Bukti transfer sudah diproses sebelumnya'
                ], 400);
            }

            $bukti->update([
                'status' => 'rejected',
                'catatan_admin' => $request->catatan,
                'processed_at' => now(),
                'processed_by' => Auth::id(),
            ]);

            // Send notification to wali
            \App\Services\NotificationService::paymentRejected(
                $bukti->santri_id,
                $request->catatan
            );

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer ditolak',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
