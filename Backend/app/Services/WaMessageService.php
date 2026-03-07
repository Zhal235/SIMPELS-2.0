<?php

namespace App\Services;

use App\Jobs\SendWaMessageJob;
use App\Models\Santri;
use App\Models\Pegawai;
use App\Models\TagihanSantri;
use App\Models\WaMessageLog;
use App\Models\WaMessageTemplate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class WaMessageService
{
    private array $templateCache = [];
    public function sendToSantriWali(Santri $santri, string $messageType, string $messageBody): WaMessageLog
    {
        $phone = $this->resolveWaliPhone($santri);

        $log = WaMessageLog::create([
            'recipient_type' => 'wali',
            'recipient_id'   => $santri->id,
            'phone'          => $phone,
            'message_type'   => $messageType,
            'message_body'   => $messageBody,
            'status'         => 'pending',
        ]);

        SendWaMessageJob::dispatch($log)->onQueue('default');

        return $log;
    }

    public function sendToPegawai(Pegawai $pegawai, string $messageType, string $messageBody): WaMessageLog
    {
        $phone = $this->normalizePhonenumber($pegawai->no_hp ?? '');

        $log = WaMessageLog::create([
            'recipient_type' => 'pegawai',
            'recipient_id'   => $pegawai->id,
            'phone'          => $phone,
            'message_type'   => $messageType,
            'message_body'   => $messageBody,
            'status'         => 'pending',
        ]);

        SendWaMessageJob::dispatch($log)->onQueue('default');

        return $log;
    }

    public function blastToAllWali(string $messageType, string $messageBody): Collection
    {
        $santriList = Santri::where('status', 'aktif')->get();
        $logs = collect();

        foreach ($santriList as $santri) {
            try {
                $logs->push($this->sendToSantriWali($santri, $messageType, $messageBody));
            } catch (\Throwable $e) {
                Log::error("[WA Blast] Skip santri {$santri->id}: {$e->getMessage()}");
            }
        }

        return $logs;
    }

    public function retryLog(WaMessageLog $log): void
    {
        $log->incrementRetry();
        SendWaMessageJob::dispatch($log)->onQueue('default');
    }

    public function buildReminderMessage(Santri $santri, string $bulanTahun, string $jatuhTempo): string
    {
        return $this->renderTemplate('reminder', [
            'nama_santri' => $santri->nama_santri,
            'bulan_tahun' => $bulanTahun,
            'jatuh_tempo' => $jatuhTempo,
        ]);
    }

    public function buildTagihanDetailMessage(Santri $santri, string $bulanTahun, Collection $tagihans, ?Collection $tunggakan = null): string
    {
        $daftarTagihan = $tagihans->map(fn($t) => "- {$t->jenisTagihan->nama_tagihan}: *Rp " . number_format($t->sisa, 0, ',', '.') . '*')->implode("\n");
        $total = $tagihans->sum('sisa');

        $bagianTunggakan = '';
        if ($tunggakan && $tunggakan->isNotEmpty()) {
            $grouped = $tunggakan->groupBy(fn($t) => "{$t->bulan} {$t->tahun}");
            $lines = $grouped->map(function ($items, $label) {
                $detail = $items->map(fn($t) => "  - {$t->jenisTagihan->nama_tagihan}: *Rp " . number_format($t->sisa, 0, ',', '.') . '*')->implode("\n");
                return "📅 *{$label}*:\n{$detail}";
            })->implode("\n");
            $total += $tunggakan->sum('sisa');
            $bagianTunggakan = "\n\n⚠️ *Tunggakan Belum Lunas:*\n{$lines}\n────────────────";
        }

        return $this->renderTemplate('tagihan_detail', [
            'nama_santri'      => $santri->nama_santri,
            'bulan_tahun'      => $bulanTahun,
            'daftar_tagihan'   => $daftarTagihan,
            'bagian_tunggakan' => $bagianTunggakan,
            'total'            => number_format($total, 0, ',', '.'),
        ]);
    }

    public function buildRekapTunggakanMessage(Santri $santri, Collection $tunggakan): string
    {
        $grouped = $tunggakan->groupBy(fn($t) => "{$t->bulan} {$t->tahun}");
        $daftarTunggakan = $grouped->map(function ($items, $label) {
            $detail = $items->map(fn($t) => "  - {$t->jenisTagihan->nama_tagihan}: *Rp " . number_format($t->sisa, 0, ',', '.') . '*')->implode("\n");
            return "📅 *{$label}*:\n{$detail}";
        })->implode("\n");

        return $this->renderTemplate('rekap_tunggakan', [
            'nama_santri'      => $santri->nama_santri,
            'daftar_tunggakan' => $daftarTunggakan,
            'total'            => number_format($tunggakan->sum('sisa'), 0, ',', '.'),
        ]);
    }

    public function getTunggakanSebelumBulan(string $santriId, string $bulanNamaSekarang, int $tahunSekarang): Collection
    {
        $bulanUrut = ['Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,'Mei'=>5,'Juni'=>6,
                      'Juli'=>7,'Agustus'=>8,'September'=>9,'Oktober'=>10,'November'=>11,'Desember'=>12];
        $bulanIntSekarang = $bulanUrut[$bulanNamaSekarang] ?? 0;

        return TagihanSantri::where('santri_id', $santriId)
            ->whereIn('status', ['belum_bayar', 'sebagian'])
            ->where(function ($q) use ($tahunSekarang, $bulanIntSekarang, $bulanUrut) {
                $q->where('tahun', '<', $tahunSekarang)
                  ->orWhere(function ($q2) use ($tahunSekarang, $bulanIntSekarang, $bulanUrut) {
                      $bulanLalu = collect($bulanUrut)->filter(fn($v) => $v < $bulanIntSekarang)->keys()->toArray();
                      if (!empty($bulanLalu)) {
                          $q2->where('tahun', $tahunSekarang)->whereIn('bulan', $bulanLalu);
                      } else {
                          $q2->whereRaw('1=0');
                      }
                  });
            })
            ->with('jenisTagihan')
            ->orderBy('tahun')
            ->get();
    }

    public function buildPengumumanMessage(string $judul, string $isi): string
    {
        return $this->renderTemplate('pengumuman', [
            'judul' => $judul,
            'isi'   => $isi,
        ]);
    }

    private function resolveWaliPhone(Santri $santri): string
    {
        $phone = $santri->hp_ayah ?: $santri->hp_ibu;

        if (empty($phone)) {
            throw new \RuntimeException("Santri {$santri->id} tidak memiliki nomor HP wali");
        }

        return $this->normalizePhonenumber($phone);
    }
    public function normalizePhone(string $phone): string
    {
        return $this->normalizePhonenumber($phone);
    }
    private function renderTemplate(string $type, array $vars): string
    {
        $body = $this->getTemplate($type);
        foreach ($vars as $key => $value) {
            $body = str_replace('{{' . $key . '}}', $value, $body);
        }
        return $body;
    }

    private function getTemplate(string $type): string
    {
        if (!isset($this->templateCache[$type])) {
            $body = WaMessageTemplate::where('type', $type)->value('body');
            $this->templateCache[$type] = $body ?? $this->defaultTemplate($type);
        }
        return $this->templateCache[$type];
    }

    private function defaultTemplate(string $type): string
    {
        return match ($type) {
            'tagihan_detail'  => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\nBerikut tagihan bulan *{{bulan_tahun}}*:\n{{daftar_tagihan}}\n────────────────{{bagian_tunggakan}}\n*Total Keseluruhan: Rp {{total}}*\n\nPembayaran dapat dilakukan melalui aplikasi SIMPELS atau transfer ke rekening pesantren.\n\nTerima kasih.\n_SIMPELS - Sistem Informasi Pesantren_",
            'reminder'        => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\nKami mengingatkan bahwa pembayaran SPP bulan *{{bulan_tahun}}* belum dilakukan. Mohon segera melakukan pembayaran paling lambat tanggal *{{jatuh_tempo}}*.\n\nTerima kasih atas perhatiannya.\n_SIMPELS - Sistem Informasi Pesantren_",
            'rekap_tunggakan' => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\n⚠️ *REKAP TUNGGAKAN BELUM LUNAS*\n\n{{daftar_tunggakan}}\n────────────────\n*Total Tunggakan: Rp {{total}}*\n\nMohon segera melunasi tagihan di atas melalui aplikasi SIMPELS atau transfer ke rekening pesantren.\n\nTerima kasih atas perhatiannya.\n_SIMPELS - Sistem Informasi Pesantren_",
            'pengumuman'      => "📢 *PENGUMUMAN*\n*{{judul}}*\n\n{{isi}}\n\n_SIMPELS - Sistem Informasi Pesantren_",
            default           => '',
        };
    }

    private function normalizePhonenumber(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        } elseif (!str_starts_with($digits, '62')) {
            $digits = '62' . $digits;
        }

        return $digits;
    }
}
