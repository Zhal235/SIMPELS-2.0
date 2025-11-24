<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Santri;
use App\Models\Pembayaran;
use App\Models\TagihanSantri;
use App\Models\Wallet;
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

        // Password default adalah 123456
        if ($request->password !== '123456') {
            throw ValidationException::withMessages([
                'password' => ['Password salah.'],
            ]);
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
            
            return [
                'id' => $s->id,
                'nis' => $s->nis,
                'nama' => $s->nama_santri,
                'jenis_kelamin' => $s->jenis_kelamin,
                'kelas' => $s->kelas_nama ?? ($s->kelas->nama_kelas ?? null),
                'asrama' => $s->asrama_nama ?? ($s->asrama->nama_asrama ?? $s->asrama->nama ?? null),
                'foto_url' => $s->foto ? url('storage/' . $s->foto) : null,
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
                    'foto_url' => $s->foto ? url('storage/' . $s->foto) : null,
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
        
        if (!$wallet) {
            return response()->json([
                'success' => true,
                'data' => [
                    'santri_id' => $santri->id,
                    'santri_nama' => $santri->nama,
                    'saldo' => 0,
                    'limit_harian' => 0,
                    'limit_tersisa' => 0,
                    'transaksi_terakhir' => [],
                ],
            ]);
        }

        // Get recent transactions
        $recentTransactions = \DB::table('wallet_transactions')
            ->where('santri_id', $santriId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'tanggal' => $t->created_at,
                    'keterangan' => $t->description ?? $t->keterangan ?? '',
                    'jumlah' => abs($t->amount ?? $t->jumlah ?? 0),
                    'tipe' => ($t->amount ?? $t->jumlah ?? 0) < 0 ? 'debit' : 'credit',
                    'saldo_akhir' => $t->balance_after ?? $t->saldo_akhir ?? 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'santri_id' => $santri->id,
                'santri_nama' => $santri->nama,
                'saldo' => $wallet->balance ?? $wallet->saldo ?? 0,
                'limit_harian' => $wallet->daily_limit ?? 50000,
                'limit_tersisa' => $wallet->remaining_limit ?? 50000,
                'transaksi_terakhir' => $recentTransactions,
            ],
        ]);
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
            ->map(function ($t) {
                $nominal = $t->nominal ?? 0;
                $dibayar = $t->dibayar ?? 0;
                $sisa = $nominal - $dibayar;
                
                // Tentukan status berdasarkan DB
                $status = $t->status ?? 'belum_bayar';
                
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
     * Helper: Get saldo dompet santri
     */
    private function getSaldoDompet($santriId)
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();
        return $wallet ? ($wallet->balance ?? $wallet->saldo ?? 0) : 0;
    }
}
