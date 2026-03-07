<?php

namespace App\Console\Commands;

use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Services\WaMessageService;
use Illuminate\Console\Command;

class SendTagihanDetailWa extends Command
{
    protected $signature = 'wa:detail-tagihan
                            {--bulan= : Nomor bulan (1-12), default bulan ini}
                            {--tahun= : Tahun, default tahun ini}
                            {--dry-run : Preview tanpa kirim}';

    protected $description = 'Kirim detail nominal tagihan WA ke semua wali santri aktif (tanggal 1)';

    public function handle(WaMessageService $waService): int
    {
        $bulan = (int) ($this->option('bulan') ?: now()->month);
        $tahun = (int) ($this->option('tahun') ?: now()->year);
        $dryRun = $this->option('dry-run');

        \Carbon\Carbon::setLocale('id');
        $bulanNama = \Carbon\Carbon::createFromDate($tahun, $bulan, 1)->translatedFormat('F');
        $bulanTahun = "{$bulanNama} {$tahun}";

        $santriList = Santri::where('status', 'aktif')->get();

        $this->info("Memproses {$santriList->count()} santri aktif untuk bulan {$bulanTahun}.");

        if ($dryRun) {
            $this->warn('[DRY RUN] Tidak ada pesan yang dikirim.');
            return Command::SUCCESS;
        }

        $sent = 0;
        $skip = 0;

        foreach ($santriList as $santri) {
            try {
                $tagihans = TagihanSantri::where('santri_id', $santri->id)
                    ->where('bulan', $bulanNama)
                    ->where('tahun', $tahun)
                    ->whereIn('status', ['belum_bayar', 'sebagian'])
                    ->with('jenisTagihan')
                    ->get();

                if ($tagihans->isEmpty()) {
                    $skip++;
                    continue;
                }

                $tunggakan = $waService->getTunggakanSebelumBulan($santri->id, $bulanNama, $tahun);
                $message = $waService->buildTagihanDetailMessage($santri, $bulanTahun, $tagihans, $tunggakan);
                $waService->sendToSantriWali($santri, 'tagihan_detail', $message);
                $sent++;
            } catch (\Throwable $e) {
                $this->warn("Skip {$santri->nama_santri}: {$e->getMessage()}");
                $skip++;
            }
        }

        $this->info("Selesai: {$sent} antrian dibuat, {$skip} dilewati.");
        return Command::SUCCESS;
    }
}
