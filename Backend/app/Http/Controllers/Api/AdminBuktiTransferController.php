<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BuktiTransfer;
use App\Models\TagihanSantri;
use App\Models\Pembayaran;
use App\Models\TransaksiKas;
use App\Models\Wallet;
use App\Models\SantriTabungan;
use App\Models\SantriTabunganTransaction;
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
                    
                    // Parse nominal_topup and nominal_tabungan from catatan_admin
                    $nominalTopup    = 0;
                    $nominalTabungan = 0;
                    $catatan         = $bukti->catatan_admin ?? '';

                    if ($bukti->jenis_transaksi === 'topup') {
                        $nominalTopup = (float) $bukti->total_nominal;
                    } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
                        if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatan, $m)) {
                            $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
                        }
                    }
                    if (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
                        if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatan, $m)) {
                            $nominalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
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
                        'nominal_tabungan' => $nominalTabungan,
                        'status' => $bukti->status,
                        'catatan_wali' => $bukti->catatan_wali,
                        'catatan_admin' => $bukti->catatan_admin,
                        'bukti_url' => $bukti->bukti_url,
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
            'catatan'          => 'nullable|string|max:500',
            'nominal_topup'    => 'nullable|numeric|min:0',
            'nominal_tabungan' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $bukti = BuktiTransfer::findOrFail($id);

            if ($bukti->status !== 'pending') {
                return response()->json([
                    'error' => 'Bukti transfer sudah diproses sebelumnya'
                ], 400);
            }

            $isTopupOnly   = $bukti->jenis_transaksi === 'topup';
            $catatanAdmin  = $bukti->catatan_admin ?? '';

            // ── Resolve nominal_topup ──────────────────────────────────────────
            if ($request->has('nominal_topup') && $request->nominal_topup !== null) {
                $nominalTopup = (float) $request->nominal_topup;
            } elseif ($isTopupOnly) {
                $nominalTopup = (float) $bukti->total_nominal;
            } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
                if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatanAdmin, $m)) {
                    $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
                } else {
                    $nominalTopup = 0;
                }
            } else {
                $nominalTopup = 0;
            }

            // ── Resolve nominal_tabungan ───────────────────────────────────────
            if ($request->has('nominal_tabungan') && $request->nominal_tabungan !== null) {
                $nominalTabungan = (float) $request->nominal_tabungan;
            } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
                if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatanAdmin, $m)) {
                    $nominalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
                } else {
                    $nominalTabungan = 0;
                }
            } else {
                $nominalTabungan = 0;
            }

            $nominalPembayaran = $isTopupOnly ? 0 : max(0, $bukti->total_nominal - $nominalTopup - $nominalTabungan);

            // Get santri name for keterangan
            $santri     = \App\Models\Santri::find($bukti->santri_id);
            $namaSantri = $santri ? ($santri->nama_santri ?? $santri->nama_lengkap ?? 'Santri') : 'Santri';

            // Process tagihan if not topup-only
            if (!$isTopupOnly && $bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
                $tagihans = TagihanSantri::with('jenisTagihan')->whereIn('id', $bukti->tagihan_ids)->get();

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

                // Get buku_kas_id from jenis tagihan
                $bukuKasId = null;
                if ($tagihan->jenisTagihan && $tagihan->jenisTagihan->buku_kas_id) {
                    $bukuKasId = $tagihan->jenisTagihan->buku_kas_id;
                } else {
                    // Fallback to first buku kas if jenis tagihan doesn't have buku_kas_id
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
                $wallet->balance += $nominalTopup;
                $wallet->save();

                // Create wallet transaction record
                \DB::table('wallet_transactions')->insert([
                    'wallet_id'     => (int) $wallet->id,
                    'amount'        => (float) $nominalTopup,
                    'type'          => 'credit',
                    'method'        => 'transfer',
                    'description'   => 'Top-up via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
                    'balance_after' => (float) $wallet->balance,
                    'created_by'    => Auth::id(),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);

                \Log::info('Wallet topup created', ['wallet_id' => $wallet->id, 'amount' => $nominalTopup, 'balance_after' => $wallet->balance]);
            }

            // ── Process tabungan setor ─────────────────────────────────────────
            if ($nominalTabungan > 0) {
                $tabungan = \App\Models\SantriTabungan::where('santri_id', $bukti->santri_id)->first();

                if (!$tabungan) {
                    $tabungan = \App\Models\SantriTabungan::create([
                        'santri_id' => $bukti->santri_id,
                        'saldo'     => 0,
                        'status'    => 'active',
                        'opened_at' => now(),
                    ]);
                }

                $tabungan->saldo += $nominalTabungan;
                $tabungan->save();

                \App\Models\SantriTabunganTransaction::create([
                    'tabungan_id' => $tabungan->id,
                    'santri_id'   => $bukti->santri_id,
                    'type'        => 'setor',
                    'amount'      => (float) $nominalTabungan,
                    'saldo_after' => (float) $tabungan->saldo,
                    'description' => 'Setor tabungan via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
                    'method'      => 'transfer',
                    'recorded_by' => Auth::id(),
                ]);

                \Log::info('Tabungan setor created', ['tabungan_id' => $tabungan->id, 'amount' => $nominalTabungan, 'saldo_after' => $tabungan->saldo]);
            }

            // ── Update bukti transfer status ───────────────────────────────────
            // Only set catatan_admin if admin explicitly provides notes OR made corrections
            $catatanAdmin = null;
            $adaCatatanManual = !empty($request->catatan);

            // Check if admin made actual corrections by comparing with original values
            $originalTopup = 0;
            $originalTabungan = 0;
            $catatanOriginal = $bukti->catatan_admin ?? '';

            // Parse original values from catatan_admin
            if ($isTopupOnly) {
                $originalTopup = (float) $bukti->total_nominal;
            } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
                if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatanOriginal, $m)) {
                    $originalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
                }
            }
            if (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
                if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatanOriginal, $m)) {
                    $originalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
                }
            }

            $adaKoreksiTopup = $request->has('nominal_topup') && $nominalTopup != $originalTopup;
            $adaKoreksiTabungan = $request->has('nominal_tabungan') && $nominalTabungan != $originalTabungan;
            
            if ($adaCatatanManual || $adaKoreksiTopup || $adaKoreksiTabungan) {
                $ringkasan = [];
                if ($adaKoreksiTopup || $adaKoreksiTabungan) {
                    $ringkasan[] = 'Dikoreksi admin:';
                    if ($nominalPembayaran > 0) $ringkasan[] = 'Tagihan Rp ' . number_format($nominalPembayaran, 0, ',', '.');
                    if ($nominalTopup > 0)      $ringkasan[] = 'Top-up dompet Rp ' . number_format($nominalTopup, 0, ',', '.');
                    if ($nominalTabungan > 0)   $ringkasan[] = 'Setor tabungan Rp ' . number_format($nominalTabungan, 0, ',', '.');
                    $catatanAdmin = implode(' ', $ringkasan);
                }
                if ($adaCatatanManual) {
                    $catatanAdmin = ($catatanAdmin ? $catatanAdmin . ' ' : '') . trim($request->catatan);
                }
            }

            $bukti->update([
                'status'        => 'approved',
                'catatan_admin' => $catatanAdmin,
                'processed_at'  => now(),
                'processed_by'  => Auth::id(),
            ]);

            DB::commit();

            // Notification
            $jenisLabel = implode(' + ', array_filter([
                $nominalPembayaran > 0 ? 'Pembayaran' : null,
                $nominalTopup > 0 ? 'Top-up' : null,
                $nominalTabungan > 0 ? 'Tabungan' : null,
            ]));
            \App\Services\NotificationService::paymentApproved(
                $bukti->santri_id,
                $jenisLabel ?: 'Pembayaran',
                $bukti->total_nominal
            );

            // Send FCM Push Notification
            try {
                $fcm = new \App\Services\FCMService();
                if ($nominalTopup > 0 && ($nominalPembayaran == 0 && $nominalTabungan == 0)) {
                    $fcm->sendTopupApproved($bukti->santri_id, $nominalTopup, $bukti->id);
                } else {
                    $fcm->sendPaymentApproved($bukti->santri_id, $bukti->total_nominal, $bukti->id);
                }
            } catch (\Exception $e) {
                \Log::warning('FCM notification failed: ' . $e->getMessage());
            }

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

            // Send FCM Push Notification
            try {
                $fcm = new \App\Services\FCMService();
                $fcm->sendPaymentRejected($bukti->santri_id, $bukti->total_nominal, $bukti->id, $request->catatan);
            } catch (\Exception $e) {
                \Log::warning('FCM notification failed: ' . $e->getMessage());
            }

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
