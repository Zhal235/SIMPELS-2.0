<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class FixWalletBalance extends Command
{
    protected $signature = 'wallet:fix-balance {--dry-run : Preview tanpa eksekusi} {--force : Skip confirmation}';
    protected $description = 'Fix wallet balance yang mismatch dengan recalculate dari transaksi';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('=== FIX WALLET BALANCE MISMATCH ===');
        $this->newLine();

        if ($dryRun) {
            $this->warn('MODE: DRY RUN (tidak ada perubahan)');
        } else {
            $this->warn('MODE: LIVE (akan mengubah data!)');
        }
        $this->newLine();

        // 1. Scan semua wallet
        $this->info('Scanning wallet...');
        $wallets = Wallet::with('santri')->get();
        $mismatchWallets = [];
        $totalMismatch = 0;

        foreach ($wallets as $wallet) {
            $credit = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'credit')
                ->where(function($q) { $q->whereNull('voided')->orWhere('voided', 0); })
                ->sum('amount');

            $debit = WalletTransaction::where('wallet_id', $wallet->id)
                ->where('type', 'debit')
                ->where(function($q) { $q->whereNull('voided')->orWhere('voided', 0); })
                ->sum('amount');

            $correctBalance = $credit - $debit;
            $diff = $wallet->balance - $correctBalance;

            if (abs($diff) > 0.01) {
                $mismatchWallets[] = [
                    'wallet' => $wallet,
                    'current' => $wallet->balance,
                    'correct' => $correctBalance,
                    'diff' => $diff
                ];
                $totalMismatch += abs($diff);
            }
        }

        if (empty($mismatchWallets)) {
            $this->info('✓ Semua wallet sudah konsisten. Tidak ada yang perlu di-fix.');
            return 0;
        }

        // 2. Preview
        $this->warn('Ditemukan ' . count($mismatchWallets) . ' wallet dengan mismatch:');
        $this->newLine();

        foreach ($mismatchWallets as $item) {
            $santri = $item['wallet']->santri;
            $this->line("  • {$santri->nama_santri} ({$santri->nis})");
            $this->line("    Balance sekarang: Rp " . number_format($item['current'], 0, ',', '.'));
            $this->line("    Balance seharusnya: Rp " . number_format($item['correct'], 0, ',', '.'));
            $this->line("    Selisih: Rp " . number_format(abs($item['diff']), 0, ',', '.'));
            $this->newLine();
        }

        $this->line("Total selisih: Rp " . number_format($totalMismatch, 0, ',', '.'));
        $this->newLine();

        if ($dryRun) {
            $this->info('Dry run selesai. Tidak ada perubahan dilakukan.');
            $this->line('Jalankan tanpa --dry-run untuk fix.');
            return 0;
        }

        // 3. Confirmation
        if (!$force) {
            if (!$this->confirm('Lanjutkan fix ' . count($mismatchWallets) . ' wallet?')) {
                $this->warn('Dibatalkan.');
                return 1;
            }
        }

        // 4. Fix
        $this->info('Memulai fix...');
        $this->newLine();

        DB::beginTransaction();
        try {
            $fixed = 0;
            $errors = 0;

            foreach ($mismatchWallets as $item) {
                try {
                    $wallet = $item['wallet'];
                    $oldBalance = $wallet->balance;
                    $newBalance = $item['correct'];

                    // Update balance
                    $wallet->balance = $newBalance;
                    $wallet->save();

                    $fixed++;
                    
                    $santri = $wallet->santri;
                    $this->line("✓ Fixed: {$santri->nama_santri} - Rp " . number_format($oldBalance, 0, ',', '.') . " → Rp " . number_format($newBalance, 0, ',', '.'));
                    
                } catch (\Exception $e) {
                    $errors++;
                    $this->error("✗ Error: {$wallet->santri->nama_santri} - {$e->getMessage()}");
                }
            }

            DB::commit();

            $this->newLine();
            $this->info('=== HASIL ===');
            $this->line("Berhasil di-fix: $fixed wallet");
            if ($errors > 0) {
                $this->warn("Error: $errors wallet");
            }
            $this->line("Total selisih diperbaiki: Rp " . number_format($totalMismatch, 0, ',', '.'));

            // 5. Verify
            $this->newLine();
            $this->info('Verifikasi...');
            $totalBalance = Wallet::sum('balance');
            $totalCredit = WalletTransaction::where('type', 'credit')
                ->where(function($q) { $q->whereNull('voided')->orWhere('voided', 0); })
                ->sum('amount');
            $totalDebit = WalletTransaction::where('type', 'debit')
                ->where(function($q) { $q->whereNull('voided')->orWhere('voided', 0); })
                ->sum('amount');
            $expectedBalance = $totalCredit - $totalDebit;
            $finalDiff = $totalBalance - $expectedBalance;

            $this->line("Total balance DB: Rp " . number_format($totalBalance, 0, ',', '.'));
            $this->line("Total dari transaksi: Rp " . number_format($expectedBalance, 0, ',', '.'));
            
            if (abs($finalDiff) < 1) {
                $this->info("✓ Semua wallet sekarang konsisten!");
            } else {
                $this->warn("⚠ Masih ada selisih: Rp " . number_format(abs($finalDiff), 0, ',', '.'));
                $this->line("Mungkin ada wallet lain yang perlu di-fix.");
            }

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Fix gagal: ' . $e->getMessage());
            return 1;
        }
    }
}
