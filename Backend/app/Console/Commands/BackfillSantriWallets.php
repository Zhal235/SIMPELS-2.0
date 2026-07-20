<?php

namespace App\Console\Commands;

use App\Models\Santri;
use App\Models\Wallet;
use Illuminate\Console\Command;

class BackfillSantriWallets extends Command
{
    protected $signature = 'wallet:backfill-santri {--dry-run : Preview without creating wallets}';
    protected $description = 'Create missing wallets for existing santri records';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $query = Santri::query()
            ->select('id', 'nama_santri', 'nis')
            ->whereDoesntHave('wallet');

        $totalMissing = (clone $query)->count();

        if ($totalMissing === 0) {
            $this->info('Semua santri sudah memiliki dompet.');
            return self::SUCCESS;
        }

        $this->info('Santri tanpa dompet: ' . $totalMissing);

        if ($dryRun) {
            $this->warn('Mode dry-run: tidak ada data yang dibuat.');
            return self::SUCCESS;
        }

        $created = 0;

        $query->orderBy('nama_santri')->chunkById(200, function ($santriList) use (&$created) {
            foreach ($santriList as $santri) {
                Wallet::firstOrCreate(
                    ['santri_id' => $santri->id],
                    ['balance' => 0]
                );
                $created++;
                $this->line("✓ Dompet dibuat untuk {$santri->nama_santri} ({$santri->nis})");
            }
        });

        $this->info('Selesai. Dompet dibuat: ' . $created);

        return self::SUCCESS;
    }
}