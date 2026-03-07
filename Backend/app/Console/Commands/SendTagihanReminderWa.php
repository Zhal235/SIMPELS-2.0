<?php

namespace App\Console\Commands;

use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Services\WaMessageService;
use Illuminate\Console\Command;

class SendTagihanReminderWa extends Command
{
    protected $signature = 'wa:reminder-tagihan
                            {--bulan= : Nomor bulan (1-12), default bulan ini}
                            {--tahun= : Tahun, default tahun ini}
                            {--dry-run : Preview tanpa kirim}';

    protected $description = 'Kirim reminder WA tagihan ke semua wali santri aktif (tanggal 5)';

    public function handle(WaMessageService $waService): int
    {
        $bulan = (int) ($this->option('bulan') ?: now()->month);
        $tahun = (int) ($this->option('tahun') ?: now()->year);
        $dryRun = $this->option('dry-run');

        \Carbon\Carbon::setLocale('id');
        $bulanNama = \Carbon\Carbon::createFromDate($tahun, $bulan, 1)->translatedFormat('F');
        $bulanTahun = "{$bulanNama} {$tahun}";
        $jatuhTempo = "10 {$bulanTahun}";

        $santriDenganTagihanBelumLunas = Santri::where('status', 'aktif')
            ->whereHas('tagihanSantri', function ($q) use ($bulanNama, $tahun) {
                $q->where('bulan', $bulanNama)
                  ->where('tahun', $tahun)
                  ->whereIn('status', ['belum_bayar', 'sebagian']);
            })
            ->get();

        $this->info("Ditemukan {$santriDenganTagihanBelumLunas->count()} santri dengan tagihan belum lunas bulan {$bulanTahun}.");

        if ($dryRun) {
            $this->warn('[DRY RUN] Tidak ada pesan yang dikirim.');
            return Command::SUCCESS;
        }

        $sent = 0;
        $skip = 0;

        foreach ($santriDenganTagihanBelumLunas as $santri) {
            try {
                $message = $waService->buildReminderMessage($santri, $bulanTahun, $jatuhTempo);
                $waService->sendToSantriWali($santri, 'reminder', $message);
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
