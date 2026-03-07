<?php

namespace App\Console\Commands;

use App\Models\Santri;
use App\Services\WaMessageService;
use Illuminate\Console\Command;

class SendRekapTunggakanWa extends Command
{
    protected $signature = 'wa:rekap-tunggakan
                            {--bulan= : Bulan acuan (1-12), default bulan ini}
                            {--tahun= : Tahun acuan, default tahun ini}
                            {--dry-run : Preview tanpa kirim}';

    protected $description = 'Kirim rekap tunggakan WA ke wali santri yang memiliki tagihan belum lunas dari bulan-bulan sebelumnya';

    public function handle(WaMessageService $waService): int
    {
        $bulan = (int) ($this->option('bulan') ?: now()->month);
        $tahun = (int) ($this->option('tahun') ?: now()->year);
        $dryRun = $this->option('dry-run');

        \Carbon\Carbon::setLocale('id');
        $bulanNama = \Carbon\Carbon::createFromDate($tahun, $bulan, 1)->translatedFormat('F');

        $santriList = Santri::where('status', 'aktif')->get();

        $this->info("Memeriksa tunggakan sebelum {$bulanNama} {$tahun} untuk {$santriList->count()} santri aktif.");

        if ($dryRun) {
            $this->warn('[DRY RUN] Tidak ada pesan yang dikirim.');
            return Command::SUCCESS;
        }

        $sent = 0;
        $skip = 0;

        foreach ($santriList as $santri) {
            try {
                $tunggakan = $waService->getTunggakanSebelumBulan($santri->id, $bulanNama, $tahun);

                if ($tunggakan->isEmpty()) {
                    $skip++;
                    continue;
                }

                $message = $waService->buildRekapTunggakanMessage($santri, $tunggakan);
                $waService->sendToSantriWali($santri, 'rekap_tunggakan', $message);
                $sent++;
            } catch (\Throwable $e) {
                $this->warn("Skip {$santri->nama_santri}: {$e->getMessage()}");
                $skip++;
            }
        }

        $this->info("Selesai: {$sent} antrian dibuat, {$skip} dilewati (tidak punya tunggakan / tidak ada HP).");
        return Command::SUCCESS;
    }
}
