<?php

namespace App\Console\Commands;

use App\Models\Santri;
use App\Models\Wallet;
use App\Models\WalletSettings;
use App\Services\WaMessageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendLowBalanceReminderWa extends Command
{
    protected $signature = 'wa:reminder-saldo-minimal {--dry-run : Preview tanpa kirim}';

    protected $description = 'Kirim notifikasi WA ke wali santri yang saldo nya di bawah minimal global';

    public function handle(WaMessageService $waService): int
    {
        $dryRun = $this->option('dry-run');

        // Get global minimum balance
        $settings = WalletSettings::first();
        $minBalance = $settings ? (float) $settings->global_minimum_balance : 10000;

        $this->info("Mengecek santri dengan saldo di bawah Rp " . number_format($minBalance, 0, ',', '.'));

        // Get all active santri with wallets
        $santriList = Santri::where('status', 'aktif')
            ->with('wallet')
            ->get();

        $needNotification = 0;
        $alreadyNotified = 0;
        $noWallet = 0;
        $sent = 0;
        $skip = 0;

        foreach ($santriList as $santri) {
            // Skip if no wallet
            if (!$santri->wallet) {
                $noWallet++;
                continue;
            }

            $wallet = $santri->wallet;
            $currentBalance = (float) $wallet->balance;

            // Skip if balance is above minimum
            if ($currentBalance >= $minBalance) {
                // Reset notification timestamp if balance is now above minimum
                // This allows re-notification if balance drops again
                if ($wallet->low_balance_notified_at !== null) {
                    if (!$dryRun) {
                        $wallet->update(['low_balance_notified_at' => null]);
                    }
                }
                continue;
            }

            // Balance is below minimum
            $needNotification++;

            // Check if already notified and balance hasn't been topped up
            if ($wallet->low_balance_notified_at !== null) {
                $alreadyNotified++;
                continue;
            }

            // Send notification
            try {
                $message = $waService->buildLowBalanceMessage($santri, $currentBalance, $minBalance);
                
                if ($dryRun) {
                    $this->line(">>> [DRY] {$santri->nama_santri} - Saldo: Rp " . number_format($currentBalance, 0, ',', '.'));
                } else {
                    $waService->sendToSantriWali($santri, 'reminder_saldo', $message);
                    $wallet->update(['low_balance_notified_at' => now()]);
                    $sent++;
                }
            } catch (\Throwable $e) {
                $this->warn("Skip {$santri->nama_santri}: {$e->getMessage()}");
                $skip++;
            }
        }

        $this->newLine();
        $this->info("=== SUMMARY ===");
        $this->line("Total santri aktif: {$santriList->count()}");
        $this->line("Saldo di bawah minimal: {$needNotification}");
        $this->line("Sudah dinotifikasi sebelumnya: {$alreadyNotified}");
        $this->line("Tanpa wallet: {$noWallet}");
        
        if ($dryRun) {
            $this->warn('[DRY RUN] Tidak ada pesan yang dikirim.');
        } else {
            $this->info("Antrian dibuat: {$sent}");
            if ($skip > 0) {
                $this->warn("Dilewati (error): {$skip}");
            }
        }

        return Command::SUCCESS;
    }
}
