<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Santri;
use App\Models\Pembayaran;
use App\Models\TagihanSantri;
use App\Models\Wallet;
use App\Models\SantriTransactionLimit;
use App\Models\DataCorrection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class WaliController extends Controller
{
    /**
     * Login untuk wali santri menggunakan nomor HP
     */
    public function login(Request $request)
    {
        $request->validate([
            'no_hp' => 'required|string',
            'password' => 'required|string',
        ]);

        // Normalize nomor HP (hapus spasi, +, 0 di depan, dll)
        $normalizedHp = $this->normalizePhoneNumber($request->no_hp);

        // Check if wali has custom password
        $passwordWali = \App\Models\PasswordWali::where('no_hp', $request->no_hp)->first();
        
        if ($passwordWali) {
            // Wali has custom password
            if (!Hash::check($request->password, $passwordWali->password)) {
                throw ValidationException::withMessages([
                    'password' => ['Password salah.'],
                ]);
            }
        } else {
            // Use default password 123456
            if ($request->password !== '123456') {
                throw ValidationException::withMessages([
                    'password' => ['Password salah.'],
                ]);
            }
        }

        // Cari santri berdasarkan hp_ayah atau hp_ibu
        $santriList = Santri::where(function($query) use ($normalizedHp, $request) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $request->no_hp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $request->no_hp . '%');
        })
        ->with(['kelas', 'asrama', 'wallet'])
        ->where('status', 'aktif')
        ->get();

        if ($santriList->isEmpty()) {
            throw ValidationException::withMessages([
                'no_hp' => ['Nomor HP tidak terdaftar atau tidak ada santri aktif.'],
            ]);
        }

        // Ambil santri pertama untuk data wali
        $firstSantri = $santriList->first();
        
        // Tentukan tipe wali (ayah atau ibu)
        $tipeWali = 'ayah';
        $namaWali = $firstSantri->nama_ayah ?? 'Wali';
        
        if (stripos($firstSantri->hp_ibu ?? '', $normalizedHp) !== false || 
            stripos($firstSantri->hp_ibu ?? '', $request->no_hp) !== false) {
            $tipeWali = 'ibu';
            $namaWali = $firstSantri->nama_ibu ?? 'Wali';
        }

        // Create token dengan data santri IDs
        $santriIds = $santriList->pluck('id')->toArray();
        $tokenData = [
            'no_hp' => $request->no_hp,
            'tipe' => $tipeWali,
            'santri_ids' => $santriIds,
        ];
        
        // Gunakan sanctum token (store data di personal_access_tokens table)
        // Untuk simplicity, kita buat user virtual atau gunakan system user
        $systemUser = User::firstOrCreate(
            ['email' => 'system.wali@simpels.internal'],
            [
                'name' => 'System Wali',
                'password' => Hash::make('system-only'),
                'role' => 'wali'
            ]
        );
        
        $token = $systemUser->createToken('wali-mobile-' . $normalizedHp, ['*'], now()->addYear())->plainTextToken;

        // Format response
        $santriData = $santriList->map(function ($s) use ($tipeWali, $namaWali) {
            // Get transaction limit
            $transactionLimit = \App\Models\SantriTransactionLimit::where('santri_id', $s->id)->first();
            
            // Generate full foto URL with CORS support
            $fotoUrl = null;
            if ($s->foto) {
                // If foto is already a full URL, use it directly
                if (str_starts_with($s->foto, 'http://') || str_starts_with($s->foto, 'https://')) {
                    $fotoUrl = $s->foto;
                } else {
                    // Use public-storage route for CORS support (needed for Flutter web)
                    $fotoUrl = url('public-storage/' . $s->foto);
                }
            }
            
            return [
                'id' => $s->id,
                'nis' => $s->nis,
                'nama' => $s->nama_santri,
                'jenis_kelamin' => $s->jenis_kelamin,
                'kelas' => $s->kelas_nama ?? ($s->kelas->nama_kelas ?? null),
                'asrama' => $s->asrama_nama ?? ($s->asrama->nama_asrama ?? $s->asrama->nama ?? null),
                'foto_url' => $fotoUrl,
                'saldo_dompet' => $s->wallet ? ($s->wallet->balance ?? 0) : 0,
                'limit_harian' => $transactionLimit ? $transactionLimit->daily_limit : 15000,
                'hubungan' => $tipeWali,
                'nama_wali' => $namaWali,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'wali' => [
                'no_hp' => $request->no_hp,
                'nama' => $namaWali,
                'tipe' => $tipeWali,
                'label' => ucfirst($tipeWali) . ' dari ' . $firstSantri->nama_santri,
            ],
            'santri' => $santriData,
            'active_santri_id' => $santriList->first()->id, // Default ke santri pertama
        ]);
    }

    /**
     * Normalize phone number to 62xxx format
     */
    private function normalizePhoneNumber($phone)
    {
        // Hapus semua karakter non-digit
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Jika dimulai dengan 0, ganti dengan 62
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }
        
        // Jika belum ada 62 di depan, tambahkan
        if (substr($phone, 0, 2) !== '62') {
            $phone = '62' . $phone;
        }
        
        return $phone;
    }

    /**
     * Get daftar santri berdasarkan wali yang login
     */
    public function getSantri(Request $request)
    {
        $user = $request->user();
        
        // For now, return all santri. 
        // TODO: Add wali_id relationship to filter only santri of this wali
        $santri = Santri::with(['kelas', 'asrama'])
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'nis' => $s->nis,
                    'nama' => $s->nama,
                    'jenis_kelamin' => $s->jenis_kelamin,
                    'kelas' => $s->kelas->nama ?? null,
                    'asrama' => $s->asrama->nama ?? null,
                    'foto_url' => $s->foto ? \Storage::url($s->foto) : null,
                    'saldo_dompet' => $this->getSaldoDompet($s->id),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $santri,
        ]);
    }

    /**
     * Get wallet/dompet info
     */
    public function getWallet(Request $request, $santriId)
    {
        $santri = Santri::findOrFail($santriId);
        $wallet = Wallet::where('santri_id', $santriId)->first();
        
        // Get transaction limit from santri_transaction_limits table
        $transactionLimit = SantriTransactionLimit::where('santri_id', $santriId)->first();
        $limitHarian = $transactionLimit ? $transactionLimit->daily_limit : 15000;
        
        // Get global minimum balance
        $settings = \App\Models\WalletSettings::first();
        $minBalance = $settings ? $settings->global_minimum_balance : 10000;
        
        if (!$wallet) {
            return response()->json([
                'success' => true,
                'data' => [
                    'santri_id' => $santri->id,
                    'santri_nama' => $santri->nama_santri,
                    'saldo' => 0.0,
                    'limit_harian' => (float)$limitHarian,
                    'limit_tersisa' => (float)$limitHarian,
                    'minimum_balance' => (float)$minBalance,
                    'is_below_minimum' => true,
                    'transaksi_terakhir' => [],
                ],
            ]);
        }

        // Get recent transactions
        $recentTransactions = \DB::table('wallet_transactions')
            ->where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($t) {
                // Parse created_at to Carbon and format properly
                $tanggal = $t->created_at ? \Carbon\Carbon::parse($t->created_at)->toIso8601String() : now()->toIso8601String();
                
                // Ensure amount is numeric
                $amount = is_numeric($t->amount) ? (float)$t->amount : 0.0;
                
                // Determine type from 'type' field
                $tipe = $t->type ?? 'credit';
                
                // Ensure balance_after is numeric
                $balanceAfter = is_numeric($t->balance_after) ? (float)$t->balance_after : 0.0;
                
                return [
                    'id' => (string)$t->id,
                    'tanggal' => $tanggal,
                    'keterangan' => $t->description ?? '',
                    'jumlah' => $amount,
                    'tipe' => $tipe,
                    'saldo_akhir' => $balanceAfter,
                ];
            });

        $currentBalance = (float)($wallet->balance ?? $wallet->saldo ?? 0);
        $isBelowMinimum = $currentBalance < $minBalance;
        
        return response()->json([
            'success' => true,
            'data' => [
                'santri_id' => $santri->id,
                'santri_nama' => $santri->nama_santri,
                'saldo' => $currentBalance,
                'limit_harian' => (float)$limitHarian,
                'limit_tersisa' => (float)($wallet->remaining_limit ?? $limitHarian),
                'minimum_balance' => (float)$minBalance,
                'is_below_minimum' => $isBelowMinimum,
                'transaksi_terakhir' => $recentTransactions,
            ],
        ]);
    }

    /**
     * Allow wali (authenticated parent) to set a per-santri daily transaction limit.
     * This endpoint is intentionally permissive for the current app — in a stricter
     * environment you may want to add authorization checks to ensure the caller
     * is in fact the guardian of the requested santri.
     */
    public function setSantriDailyLimit(Request $request, $santriId)
    {
        $request->validate([
            'daily_limit' => 'required|numeric|min:0'
        ]);

        $santri = Santri::find($santriId);
        if (!$santri) {
            return response()->json(['success' => false, 'message' => 'Santri not found'], 404);
        }

        $limit = SantriTransactionLimit::updateOrCreate(
            ['santri_id' => $santriId],
            ['daily_limit' => $request->input('daily_limit')]
        );

        return response()->json(['success' => true, 'data' => $limit]);
    }

    /**
     * Get semua tagihan santri (lunas, belum lunas, tunggakan)
     */
    public function getAllTagihan(Request $request, $santriId)
    {
        $santri = Santri::findOrFail($santriId);
        
        // Get all tagihan dari TagihanSantri
        $allTagihan = TagihanSantri::where('santri_id', $santriId)
            ->with('jenisTagihan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) use ($santriId) {
                $nominal = $t->nominal ?? 0;
                $dibayar = $t->dibayar ?? 0;
                $sisa = $nominal - $dibayar;
                
                // Tentukan status berdasarkan DB
                $status = $t->status ?? 'belum_bayar';
                
                // Check apakah ada bukti transfer pending untuk tagihan ini
                $hasPendingBukti = false;
                
                try {
                    // Check if bukti_transfer table exists and has data
                    if (\Schema::hasTable('bukti_transfer')) {
                        // Since tagihan_ids is stored as JSON array, check if this tagihan ID is in any pending bukti
                        $pendingBukti = \App\Models\BuktiTransfer::where('status', 'pending')
                            ->where('santri_id', $santriId)
                            ->get();
                        
                        \Log::info("Checking tagihan {$t->id} against " . $pendingBukti->count() . " pending bukti");
                        
                        foreach ($pendingBukti as $bukti) {
                            $tagihanIds = $bukti->tagihan_ids ?? [];
                            \Log::info("Bukti {$bukti->id} has tagihan_ids: " . json_encode($tagihanIds));
                            
                            // Convert both to string for comparison
                            $tagihanIdsAsStrings = array_map('strval', $tagihanIds);
                            if (in_array(strval($t->id), $tagihanIdsAsStrings)) {
                                $hasPendingBukti = true;
                                \Log::info("Tagihan {$t->id} FOUND in bukti {$bukti->id}!");
                                break;
                            }
                        }
                        
                        if (!$hasPendingBukti) {
                            \Log::info("Tagihan {$t->id} NOT found in any pending bukti");
                        }
                    }
                } catch (\Exception $e) {
                    // Silently fail if table doesn't exist yet
                    \Log::error('bukti_transfer check failed: ' . $e->getMessage());
                }
                
                return [
                    'id' => $t->id,
                    'jenis_tagihan' => $t->jenisTagihan->nama_tagihan ?? 'Biaya',
                    'deskripsi' => $t->deskripsi ?? null,
                    'bulan' => $t->bulan ?? null,
                    'tahun' => $t->tahun ?? date('Y'),
                    'nominal' => (float)$nominal,
                    'dibayar' => (float)$dibayar,
                    'sisa' => (float)$sisa,
                    'status' => $status,
                    'has_pending_bukti' => $hasPendingBukti,
                    'jatuh_tempo' => $t->jatuh_tempo ?? null,
                    'tanggal_dibuat' => $t->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Deteksi tunggakan berdasarkan tanggal jatuh tempo
        $now = now();
        $currentMonth = $now->month;
        $currentYear = $now->year;
        
        $allTagihanWithOverdue = $allTagihan->map(function ($tagihan) use ($currentMonth, $currentYear) {
            // Cek apakah sudah lewat jatuh tempo
            $bulan = $tagihan['bulan'];
            $tahun = $tagihan['tahun'];
            $status = $tagihan['status'];
            
            // Mapping bulan ke angka
            $bulanMap = [
                'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
                'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
                'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12
            ];
            
            $bulanNum = $bulanMap[$bulan] ?? null;
            
            // Jika belum lunas dan sudah lewat bulannya = tunggakan
            if ($status !== 'lunas' && $bulanNum) {
                $isOverdue = ($tahun < $currentYear) || 
                            ($tahun == $currentYear && $bulanNum < $currentMonth);
                
                if ($isOverdue) {
                    $tagihan['status'] = 'tunggakan';
                    $tagihan['is_overdue'] = true;
                }
            }
            
            return $tagihan;
        });
        
        // Group by status (gunakan data yang sudah update)
        $lunas = $allTagihanWithOverdue->where('status', 'lunas');
        $belumBayar = $allTagihanWithOverdue->whereIn('status', ['belum_bayar', 'cicilan', 'sebagian']);
        $tunggakan = $allTagihanWithOverdue->where('status', 'tunggakan');

        return response()->json([
            'success' => true,
            'data' => [
                'semua' => $allTagihanWithOverdue->values(),
                'lunas' => $lunas->values(),
                'belum_bayar' => $belumBayar->values(),
                'tunggakan' => $tunggakan->values(),
            ],
            'summary' => [
                'total_tagihan' => $allTagihanWithOverdue->sum('nominal'),
                'total_dibayar' => $allTagihanWithOverdue->sum('dibayar'),
                'total_sisa' => $allTagihanWithOverdue->sum('sisa'),
                'jumlah_lunas' => $lunas->count(),
                'jumlah_belum_bayar' => $belumBayar->count(),
                'jumlah_tunggakan' => $tunggakan->count(),
            ],
        ]);
    }

    /**
     * Get riwayat pembayaran
     */
    public function getPembayaran(Request $request, $santriId)
    {
        $santri = Santri::findOrFail($santriId);
        
        $pembayaran = Pembayaran::where('santri_id', $santriId)
            ->with('jenisTagihan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'tanggal' => $p->tanggal_bayar ?? $p->created_at->format('Y-m-d'),
                    'jenis_tagihan' => $p->jenisTagihan->nama ?? 'Unknown',
                    'bulan' => $p->bulan ?? null,
                    'tahun' => $p->tahun ?? date('Y'),
                    'jumlah' => $p->jumlah,
                    'metode_pembayaran' => $p->metode_pembayaran ?? 'Cash',
                    'status' => $p->status ?? 'lunas',
                    'bukti_url' => $p->bukti ? url('storage/' . $p->bukti) : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $pembayaran,
            'total' => $pembayaran->sum('jumlah'),
        ]);
    }

    /**
     * Get tunggakan
     */
    public function getTunggakan(Request $request, $santriId)
    {
        $santri = Santri::findOrFail($santriId);
        
        $tunggakan = TagihanSantri::where('santri_id', $santriId)
            ->where('status', '!=', 'lunas')
            ->with('jenisTagihan')
            ->orderBy('jatuh_tempo', 'asc')
            ->get()
            ->map(function ($t) {
                $jumlah = $t->jumlah ?? 0;
                $sudahDibayar = $t->jumlah_dibayar ?? 0;
                $sisa = $jumlah - $sudahDibayar;
                
                return [
                    'id' => $t->id,
                    'jenis_tagihan' => $t->jenisTagihan->nama ?? 'Unknown',
                    'bulan' => $t->bulan ?? null,
                    'tahun' => $t->tahun ?? date('Y'),
                    'jumlah' => $jumlah,
                    'sudah_dibayar' => $sudahDibayar,
                    'sisa' => $sisa,
                    'status' => $t->status ?? 'belum_lunas',
                    'jatuh_tempo' => $t->jatuh_tempo ?? null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tunggakan,
            'total_tunggakan' => $tunggakan->sum('sisa'),
        ]);
    }

    /**
     * Submit pembayaran dengan bukti transfer
     */
    public function submitPayment(Request $request, $santriId)
    {
        $request->validate([
            'tagihan_id' => 'required|uuid',
            'amount' => 'required|numeric|min:1',
            'metode' => 'required|in:transfer,tunai,online',
            'bukti' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
        ]);

        try {
            $tagihan = TagihanSantri::find($request->tagihan_id);
            if (!$tagihan || $tagihan->santri_id !== $santriId) {
                return response()->json(['error' => 'Tagihan tidak ditemukan'], 404);
            }

            // Store bukti transfer
            $filePath = null;
            if ($request->hasFile('bukti')) {
                $filePath = $request->file('bukti')->store('bukti_transfer', 'public');
            }

            // Create pembayaran record dengan status 'pending' untuk verifikasi admin
            $pembayaran = new Pembayaran([
                'tagihan_santri_id' => $request->tagihan_id,
                'jumlah' => $request->amount,
                'metode' => $request->metode,
                'bukti_transfer' => $filePath,
                'status' => 'pending', // Tunggu verifikasi admin
                'tanggal_pembayaran' => now(),
            ]);

            $pembayaran->save();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dikirim. Tunggu verifikasi admin.',
                'pembayaran' => $pembayaran,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload bukti transfer untuk multiple tagihan
     */
    public function uploadBukti(Request $request, $santriId)
    {
        $request->validate([
            'tagihan_ids' => 'nullable|array', // Bisa kosong untuk top-up only
            'tagihan_ids.*' => 'required|integer|exists:tagihan_santri,id',
            'total_nominal' => 'required|numeric|min:1',
            'nominal_topup' => 'nullable|numeric|min:0',
            'selected_bank_id' => 'nullable|integer|exists:bank_accounts,id',
            'bukti' => 'required|file|mimes:jpeg,jpg,png|max:5120',
            'catatan' => 'nullable|string|max:500',
        ]);

        try {
            // Verify santri exists
            $santri = Santri::find($santriId);
            if (!$santri) {
                return response()->json(['error' => 'Santri tidak ditemukan'], 404);
            }

            $tagihanIds = $request->tagihan_ids ?? [];

            // Verify all tagihan belong to this santri (only if tagihan_ids provided)
            if (!empty($tagihanIds)) {
                $tagihans = TagihanSantri::whereIn('id', $tagihanIds)
                    ->where('santri_id', $santriId)
                    ->get();

                if ($tagihans->count() !== count($tagihanIds)) {
                    return response()->json(['error' => 'Beberapa tagihan tidak valid'], 400);
                }
            }

            // Store bukti transfer file
            $filePath = $request->file('bukti')->store('bukti_transfer', 'public');

            $nominalTopup = $request->input('nominal_topup', 0);
            $totalNominal = $request->total_nominal;
            
            // Determine transaction type
            $jenisTransaksi = 'pembayaran';
            if (empty($tagihanIds) && $nominalTopup > 0) {
                $jenisTransaksi = 'topup';
            } else if ($nominalTopup > 0) {
                $jenisTransaksi = 'pembayaran_topup';
            }

            // Create bukti transfer record
            $buktiTransfer = \App\Models\BuktiTransfer::create([
                'santri_id' => $santriId,
                'selected_bank_id' => $request->input('selected_bank_id'),
                'jenis_transaksi' => $jenisTransaksi,
                'tagihan_ids' => $tagihanIds,
                'total_nominal' => $totalNominal,
                'bukti_path' => $filePath,
                'status' => 'pending',
                'catatan_wali' => $request->catatan,
                'uploaded_at' => now(),
            ]);

            // Store breakdown info in catatan_admin
            if ($jenisTransaksi === 'topup') {
                $buktiTransfer->update([
                    'catatan_admin' => "Top-up dompet: Rp " . number_format($nominalTopup, 0, ',', '.')
                ]);
            } else if ($jenisTransaksi === 'pembayaran_topup') {
                $nominalPembayaran = $totalNominal - $nominalTopup;
                $catatanAdmin = "Pembayaran tagihan: Rp " . number_format($nominalPembayaran, 0, ',', '.') . "\n";
                $catatanAdmin .= "Top-up dompet: Rp " . number_format($nominalTopup, 0, ',', '.');
                $buktiTransfer->update(['catatan_admin' => $catatanAdmin]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil dikirim. Tunggu konfirmasi admin.',
                'data' => $buktiTransfer,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get history bukti transfer untuk santri
     */
    public function getBuktiHistory($santriId)
    {
        try {
            $buktiList = \App\Models\BuktiTransfer::where('santri_id', $santriId)
                ->with(['santri', 'processedBy', 'selectedBank'])
                ->orderBy('uploaded_at', 'desc')
                ->get()
                ->map(function ($bukti) {
                    // Get tagihan details (if not topup-only)
                    $tagihans = collect([]);
                    if ($bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
                        $tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)->get();
                    }
                    
                    return [
                        'id' => $bukti->id,
                        'jenis_transaksi' => $bukti->jenis_transaksi ?? 'pembayaran',
                        'selected_bank' => $bukti->selectedBank ? [
                            'id' => $bukti->selectedBank->id,
                            'bank_name' => $bukti->selectedBank->bank_name,
                            'account_number' => $bukti->selectedBank->account_number,
                            'account_name' => $bukti->selectedBank->account_name,
                        ] : null,
                        'total_nominal' => (float) $bukti->total_nominal,
                        'status' => $bukti->status,
                        'catatan_wali' => $bukti->catatan_wali,
                        'catatan_admin' => $bukti->catatan_admin,
                        'bukti_url' => $bukti->bukti_url,
                        'uploaded_at' => $bukti->uploaded_at->format('Y-m-d H:i:s'),
                        'processed_at' => $bukti->processed_at ? $bukti->processed_at->format('Y-m-d H:i:s') : null,
                        'processed_by' => $bukti->processedBy ? $bukti->processedBy->name : null,
                        'tagihan' => $tagihans->map(function ($t) {
                            return [
                                'id' => $t->id,
                                'jenis' => $t->jenisTagihan->nama_tagihan ?? 'Biaya',
                                'bulan' => $t->bulan,
                                'tahun' => (int) $t->tahun,
                                'nominal' => (float) $t->nominal,
                                'dibayar' => (float) $t->dibayar,
                                'sisa' => (float) $t->sisa,
                            ];
                        }),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $buktiList,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload bukti transfer untuk top-up dompet
     */
    public function uploadBuktiTopup(Request $request, $santriId)
    {
        $request->validate([
            'nominal' => 'required|numeric|min:1',
            'selected_bank_id' => 'nullable|integer|exists:bank_accounts,id',
            'bukti' => 'required|file|mimes:jpeg,jpg,png|max:5120',
            'catatan' => 'nullable|string|max:500',
        ]);

        try {
            // Verify santri exists
            $santri = Santri::find($santriId);
            if (!$santri) {
                return response()->json(['error' => 'Santri tidak ditemukan'], 404);
            }

            // Store bukti transfer file
            $filePath = $request->file('bukti')->store('bukti_transfer', 'public');

            // Create bukti transfer record for topup
            $buktiTransfer = \App\Models\BuktiTransfer::create([
                'santri_id' => $santriId,
                'selected_bank_id' => $request->input('selected_bank_id'),
                'jenis_transaksi' => 'topup',
                'tagihan_ids' => null, // No tagihan for topup
                'total_nominal' => $request->nominal,
                'bukti_path' => $filePath,
                'status' => 'pending',
                'catatan_wali' => $request->catatan,
                'uploaded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti top-up berhasil dikirim. Tunggu konfirmasi admin.',
                'data' => $buktiTransfer,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of active bank accounts for payment (Mobile App)
     */
    public function getBankAccounts()
    {
        try {
            $accounts = \App\Models\BankAccount::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('bank_name')
                ->get(['id', 'bank_name', 'account_number', 'account_name']);

            return response()->json([
                'success' => true,
                'data' => $accounts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper: Get saldo dompet santri
     */
    private function getSaldoDompet($santriId)
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();
        return $wallet ? ($wallet->balance ?? $wallet->saldo ?? 0) : 0;
    }

    /**
     * Change password for wali (mobile app)
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'no_hp' => 'required|string',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $normalizedHp = $this->normalizePhoneNumber($request->no_hp);
        
        // Check if wali has santri
        $santri = Santri::where(function($query) use ($normalizedHp, $request) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $request->no_hp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $request->no_hp . '%');
        })->where('status', 'aktif')->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor HP tidak terdaftar',
            ], 404);
        }

        // Check existing custom password or default
        $passwordWali = \App\Models\PasswordWali::where('no_hp', $request->no_hp)->first();
        
        if ($passwordWali) {
            // User has custom password
            if (!Hash::check($request->current_password, $passwordWali->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama tidak sesuai',
                ], 422);
            }
        } else {
            // Check default password
            if ($request->current_password !== '123456') {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama tidak sesuai',
                ], 422);
            }
        }

        // Store/update custom password in database
        \App\Models\PasswordWali::updateOrCreate(
            ['no_hp' => $request->no_hp],
            [
                'password' => Hash::make($request->new_password),
                'updated_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah',
        ], 200);
    }

    /**
     * Get detailed santri data
     */
    public function getSantriDetail($santri_id)
    {
        $santri = Santri::with(['kelas', 'asrama'])
            ->where('id', $santri_id)
            ->where('status', 'aktif')
            ->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Data santri tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'nis' => $santri->nis ?? '-',
                'nama_santri' => $santri->nama_santri ?? '-',
                'jenis_kelamin' => $santri->jenis_kelamin ?? '-',
                'tempat_lahir' => $santri->tempat_lahir ?? '-',
                'tanggal_lahir' => $santri->tanggal_lahir ?? '-',
                'nik' => $santri->nik ?? '-',
                'no_kk' => $santri->no_kk ?? '-',
                'alamat' => $santri->alamat ?? '-',
                'kelas_nama' => $santri->kelas ? $santri->kelas->nama_kelas : '-',
                'asrama_nama' => $santri->asrama ? $santri->asrama->nama_asrama : '-',
                'status' => $santri->status ? ucfirst($santri->status) : '-',
                'nama_ayah' => $santri->nama_ayah ?? '-',
                'nik_ayah' => $santri->nik_ayah ?? '-',
                'hp_ayah' => $santri->hp_ayah ?? '-',
                'pekerjaan_ayah' => $santri->pekerjaan_ayah ?? '-',
                'nama_ibu' => $santri->nama_ibu ?? '-',
                'nik_ibu' => $santri->nik_ibu ?? '-',
                'hp_ibu' => $santri->hp_ibu ?? '-',
                'pekerjaan_ibu' => $santri->pekerjaan_ibu ?? '-',
            ]
        ]);
    }

    /**
     * Submit data correction request
     */
    public function submitDataCorrection(Request $request, $santri_id)
    {
        $request->validate([
            'field_name' => 'required|string',
            'old_value' => 'required|string',
            'new_value' => 'required|string',
            'note' => 'nullable|string',
        ]);

        $santri = Santri::where('id', $santri_id)
            ->where('status', 'aktif')
            ->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Data santri tidak ditemukan'
            ], 404);
        }

        // Create correction request
        $correction = DataCorrection::create([
            'santri_id' => $santri_id,
            'field_name' => $request->field_name,
            'old_value' => $request->old_value,
            'new_value' => $request->new_value,
            'note' => $request->note,
            'status' => 'pending',
            'requested_by' => 'wali',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan koreksi berhasil dikirim. Menunggu persetujuan admin.',
            'data' => $correction
        ], 201);
    }
}
