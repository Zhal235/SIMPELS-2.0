<?php

namespace App\Services\WaGateway;

use App\Models\Pegawai;
use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\WaMessageLog;
use App\Models\WaMessageTemplate;
use App\Models\WaSchedule;
use App\Services\WaMessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WaGatewayService
{
    public function __construct(
        private readonly WaMessageService $waService
    ) {}

    public function getGatewayStatus(): array
    {
        $gatewayUrl = rtrim(config('services.wa_gateway.url', 'http://wa-gateway:3100'), '/');

        try {
            $response = Http::timeout(5)->get("{$gatewayUrl}/status");
            return $response->json();
        } catch (\Throwable $e) {
            return [
                'status' => 'unreachable',
                'phone' => null,
                'connected_at' => null,
            ];
        }
    }

    public function getQrCode(): array
    {
        $gatewayUrl = rtrim(config('services.wa_gateway.url', 'http://wa-gateway:3100'), '/');

        try {
            $response = Http::timeout(5)->get("{$gatewayUrl}/qr");

            if ($response->status() === 404) {
                return ['message' => 'No QR available', 'status_code' => 404];
            }

            return $response->json();
        } catch (\Throwable $e) {
            return ['message' => 'Gateway unreachable', 'status_code' => 503];
        }
    }

    public function getPhonebook(Request $request): array
    {
        $query = Santri::query()
            ->where('status', 'aktif')
            ->select('id', 'nis', 'nama_santri', 'nama_ayah', 'hp_ayah', 'nama_ibu', 'hp_ibu', 'kelas_nama');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_santri', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('nama_ayah', 'like', "%{$search}%")
                  ->orWhere('nama_ibu', 'like', "%{$search}%")
                  ->orWhere('hp_ayah', 'like', "%{$search}%")
                  ->orWhere('hp_ibu', 'like', "%{$search}%");
            });
        }

        if ($kelas = $request->input('kelas')) {
            $query->where('kelas_nama', $kelas);
        }

        if ($filter = $request->input('filter')) {
            if ($filter === 'no_hp_ayah') $query->whereNull('hp_ayah')->orWhere('hp_ayah', '');
            if ($filter === 'no_hp_ibu') $query->whereNull('hp_ibu')->orWhere('hp_ibu', '');
            if ($filter === 'has_hp') {
                $query->where(function ($q) {
                    $q->whereNotNull('hp_ayah')->where('hp_ayah', '!=', '')
                      ->orWhere(function ($q2) {
                          $q2->whereNotNull('hp_ibu')->where('hp_ibu', '!=', '');
                      });
                });
            }
        }

        $query->orderBy('kelas_nama')->orderBy('nama_santri');

        $perPage = min((int) $request->input('per_page', 25), 100);
        $data = $query->paginate($perPage);

        $daftarKelas = Santri::where('status', 'aktif')
            ->select('kelas_nama')
            ->distinct()
            ->orderBy('kelas_nama')
            ->pluck('kelas_nama')
            ->filter()
            ->values();

        return [
            'data' => $data,
            'kelas_list' => $daftarKelas,
        ];
    }

    public function updatePhonebook(Request $request, string $id): array
    {
        $santri = Santri::findOrFail($id);

        if ($request->has('hp_ayah')) {
            $santri->hp_ayah = $request->input('hp_ayah') ?: null;
        }
        if ($request->has('hp_ibu')) {
            $santri->hp_ibu = $request->input('hp_ibu') ?: null;
        }

        $santri->save();

        return [
            'message' => 'Nomor HP berhasil diperbarui',
            'santri' => $santri->only('id', 'nama_santri', 'hp_ayah', 'hp_ibu'),
        ];
    }

    public function previewBlast(Request $request): array
    {
        $type = $request->input('type');

        if ($type === 'pengumuman') {
            return $this->previewPengumuman($request);
        }

        $bulan = $request->integer('bulan');
        $tahun = $request->integer('tahun');
        \Carbon\Carbon::setLocale('id');
        $bulanNama = \Carbon\Carbon::createFromDate($tahun, $bulan, 1)->translatedFormat('F');

        $santriAktif = Santri::where('status', 'aktif')
            ->select('id', 'nama_santri', 'hp_ayah', 'hp_ibu', 'kelas_nama')
            ->get();

        $countPenerima = 0;
        $countSkip = 0;
        $countNoPhone = 0;
        $sampleEntry = null;

        foreach ($santriAktif as $santri) {
            if ($type === 'rekap_tunggakan') {
                $tunggakan = $this->waService->getTunggakanSebelumBulan($santri->id, $bulanNama, $tahun);
                if ($tunggakan->isEmpty()) { $countSkip++; continue; }
                if (!$santri->hp_ayah && !$santri->hp_ibu) { $countNoPhone++; continue; }
                $countPenerima++;
                if (!$sampleEntry) $sampleEntry = ['santri' => $santri, 'tunggakan' => $tunggakan];
            } else {
                $tagihans = TagihanSantri::where('santri_id', $santri->id)
                    ->where('bulan', $bulanNama)->where('tahun', $tahun)
                    ->whereIn('status', ['belum_bayar', 'sebagian'])
                    ->with('jenisTagihan')->get();
                if ($tagihans->isEmpty()) { $countSkip++; continue; }
                if (!$santri->hp_ayah && !$santri->hp_ibu) { $countNoPhone++; continue; }
                $countPenerima++;
                if (!$sampleEntry) $sampleEntry = ['santri' => $santri, 'tagihans' => $tagihans];
            }
        }

        $sampleMessage = null;
        if ($sampleEntry) {
            if ($type === 'tagihan_detail') {
                $tunggakan = $this->waService->getTunggakanSebelumBulan($sampleEntry['santri']->id, $bulanNama, $tahun);
                $sampleMessage = $this->waService->buildTagihanDetailMessage(
                    $sampleEntry['santri'], "{$bulanNama} {$tahun}", $sampleEntry['tagihans'], $tunggakan
                );
            } elseif ($type === 'reminder') {
                $sampleMessage = $this->waService->buildReminderMessage(
                    $sampleEntry['santri'], "{$bulanNama} {$tahun}", "10 {$bulanNama} {$tahun}"
                );
            } elseif ($type === 'rekap_tunggakan') {
                $sampleMessage = $this->waService->buildRekapTunggakanMessage(
                    $sampleEntry['santri'], $sampleEntry['tunggakan']
                );
            }
        }

        return [
            'sample_message' => $sampleMessage,
            'bulan_nama' => $bulanNama,
            'recipient_count' => $countPenerima,
            'no_phone_count' => $countNoPhone,
            'lunas_count' => $countSkip,
        ];
    }

    public function getSchedules(): array
    {
        return [
            'tagihan_detail' => WaSchedule::forType('tagihan_detail'),
            'reminder' => WaSchedule::forType('reminder'),
            'rekap_tunggakan' => WaSchedule::forType('rekap_tunggakan'),
        ];
    }

    public function updateSchedule(Request $request, string $type): array
    {
        $tanggal = collect($request->input('tanggal_kirim'))
            ->unique()->sort()->values()->toArray();

        $schedule = WaSchedule::forType($type);
        $schedule->update([
            'enabled' => $request->boolean('enabled'),
            'jam' => $request->input('jam'),
            'tanggal_kirim' => $tanggal,
        ]);

        return ['message' => 'Jadwal berhasil disimpan', 'schedule' => $schedule];
    }

    public function getTemplates(): array
    {
        return WaMessageTemplate::all()->toArray();
    }

    public function updateTemplate(Request $request, string $type): array
    {
        $template = WaMessageTemplate::where('type', $type)->firstOrFail();
        $template->update([
            'body' => $request->input('body'),
            'updated_by' => auth()->user()?->name ?? 'admin',
        ]);

        return $template->fresh()->toArray();
    }

    public function sendTestMessage(Request $request): array
    {
        $phone = $this->waService->normalizePhone($request->input('phone'));

        $log = WaMessageLog::create([
            'recipient_type' => 'wali',
            'recipient_id' => null,
            'phone' => $phone,
            'message_type' => 'custom',
            'message_body' => $request->input('message'),
            'status' => 'pending',
        ]);

        \App\Jobs\SendWaMessageJob::dispatch($log)->onQueue('default');

        return ['message' => 'Pesan test diantrekan ke ' . $phone];
    }

    private function previewPengumuman(Request $request): array
    {
        $message = $this->waService->buildPengumumanMessage(
            $request->input('judul', ''),
            $request->input('isi', '')
        );

        $pegawaiCount = Pegawai::whereNotNull('no_hp')->count();
        $waliCount = Santri::where('status', 'aktif')
            ->where(fn($q) => $q->whereNotNull('hp_ayah')->orWhereNotNull('hp_ibu'))
            ->count();

        return [
            'sample_message' => $message,
            'recipient_count' => $waliCount + $pegawaiCount,
            'no_phone_count' => 0,
            'lunas_count' => 0,
        ];
    }
}
