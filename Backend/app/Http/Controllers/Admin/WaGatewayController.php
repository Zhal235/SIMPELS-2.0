<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Pegawai;
use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\WaMessageLog;
use App\Models\WaMessageTemplate;
use App\Models\WaSchedule;
use App\Services\WaMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WaGatewayController extends Controller
{
    public function __construct(private readonly WaMessageService $waService) {}

    public function status(): JsonResponse
    {
        $gatewayUrl = rtrim(config('services.wa_gateway.url', 'http://wa-gateway:3100'), '/');

        try {
            $response = Http::timeout(5)->get("{$gatewayUrl}/status");
            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'unreachable',
                'phone' => null,
                'connected_at' => null,
            ]);
        }
    }

    public function qr(): JsonResponse
    {
        $gatewayUrl = rtrim(config('services.wa_gateway.url', 'http://wa-gateway:3100'), '/');

        try {
            $response = Http::timeout(5)->get("{$gatewayUrl}/qr");

            if ($response->status() === 404) {
                return response()->json(['message' => 'No QR available'], 404);
            }

            return response()->json($response->json());
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gateway unreachable'], 503);
        }
    }

    public function logs(Request $request): JsonResponse
    {
        $query = WaMessageLog::orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('message_type')) {
            $query->where('message_type', $request->input('message_type'));
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }

    public function retry(int $id): JsonResponse
    {
        $log = WaMessageLog::findOrFail($id);

        if ($log->status !== 'failed') {
            return response()->json(['message' => 'Hanya log dengan status failed yang bisa diretry'], 422);
        }

        $this->waService->retryLog($log);

        return response()->json(['message' => 'Job retry berhasil dijadwalkan']);
    }

    public function blastPengumuman(Request $request): JsonResponse
    {
        $request->validate([
            'judul'   => 'required|string|max:200',
            'isi'     => 'required|string',
            'target'  => 'required|in:wali,pegawai,all',
        ]);

        $judul  = $request->input('judul');
        $isi    = $request->input('isi');
        $target = $request->input('target');
        $count  = 0;

        if (in_array($target, ['wali', 'all'])) {
            $logs = $this->waService->blastPengumumanToAllWali($judul, $isi);
            $count += $logs->count();
        }

        if (in_array($target, ['pegawai', 'all'])) {
            $pegawaiList = Pegawai::whereNotNull('no_hp')->get();
            foreach ($pegawaiList as $pegawai) {
                try {
                    $message = $this->waService->buildPengumumanMessageForPegawai($pegawai, $judul, $isi);
                    $this->waService->sendToPegawai($pegawai, 'pengumuman', $message);
                    $count++;
                } catch (\Throwable $e) {
                    Log::warning("[WA Blast Pegawai] Skip {$pegawai->id}: {$e->getMessage()}");
                }
            }
        }

        return response()->json(['message' => "{$count} antrian pesan dibuat"]);
    }

    public function blastTagihanDetail(Request $request): JsonResponse
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020',
        ]);

        \Artisan::call('wa:detail-tagihan', [
            '--bulan' => $request->integer('bulan'),
            '--tahun' => $request->integer('tahun'),
        ]);

        return response()->json(['message' => 'Blast tagihan detail dijadwalkan']);
    }

    public function blastReminder(Request $request): JsonResponse
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020',
        ]);

        \Artisan::call('wa:reminder-tagihan', [
            '--bulan' => $request->integer('bulan'),
            '--tahun' => $request->integer('tahun'),
        ]);

        return response()->json(['message' => 'Blast reminder tagihan dijadwalkan']);
    }

    public function blastRekapTunggakan(Request $request): JsonResponse
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020',
        ]);

        \Artisan::call('wa:rekap-tunggakan', [
            '--bulan' => $request->integer('bulan'),
            '--tahun' => $request->integer('tahun'),
        ]);

        return response()->json(['message' => 'Blast rekap tunggakan dijadwalkan']);
    }

    public function phonebook(Request $request): JsonResponse
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

        return response()->json([
            'data' => $data,
            'kelas_list' => $daftarKelas,
        ]);
    }

    public function updateHp(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'hp_ayah' => 'nullable|string|max:20|regex:/^[0-9+\-\s]*$/',
            'hp_ibu'  => 'nullable|string|max:20|regex:/^[0-9+\-\s]*$/',
        ]);

        $santri = Santri::findOrFail($id);

        if ($request->has('hp_ayah')) {
            $santri->hp_ayah = $request->input('hp_ayah') ?: null;
        }
        if ($request->has('hp_ibu')) {
            $santri->hp_ibu = $request->input('hp_ibu') ?: null;
        }

        $santri->save();

        return response()->json([
            'message' => 'Nomor HP berhasil diperbarui',
            'santri'  => $santri->only('id', 'nama_santri', 'hp_ayah', 'hp_ibu'),
        ]);
    }

    public function previewBlast(Request $request): JsonResponse
    {
        $request->validate([
            'type'  => 'required|in:tagihan_detail,reminder,pengumuman,rekap_tunggakan',
            'bulan' => 'required_unless:type,pengumuman|integer|min:1|max:12',
            'tahun' => 'required_unless:type,pengumuman|integer|min:2020',
            'judul' => 'required_if:type,pengumuman|string|max:200',
            'isi'   => 'required_if:type,pengumuman|string',
        ]);

        $type = $request->input('type');

        if ($type === 'pengumuman') {
            $message = $this->waService->buildPengumumanMessage(
                $request->input('judul', ''),
                $request->input('isi', '')
            );
            $pegawaiCount = Pegawai::whereNotNull('no_hp')->count();
            $waliCount = Santri::where('status', 'aktif')
                ->where(fn($q) => $q->whereNotNull('hp_ayah')->orWhereNotNull('hp_ibu'))
                ->count();
            return response()->json([
                'sample_message'   => $message,
                'recipient_count'  => $waliCount + $pegawaiCount,
                'no_phone_count'   => 0,
                'lunas_count'      => 0,
            ]);
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

        return response()->json([
            'sample_message'  => $sampleMessage,
            'bulan_nama'      => $bulanNama,
            'recipient_count' => $countPenerima,
            'no_phone_count'  => $countNoPhone,
            'lunas_count'     => $countSkip,
        ]);
    }

    public function getSchedules(): JsonResponse
    {
        $schedules = [
            'tagihan_detail'  => WaSchedule::forType('tagihan_detail'),
            'reminder'        => WaSchedule::forType('reminder'),
            'rekap_tunggakan' => WaSchedule::forType('rekap_tunggakan'),
        ];
        return response()->json($schedules);
    }

    public function updateSchedule(Request $request, string $type): JsonResponse
    {
        if (!in_array($type, ['tagihan_detail', 'reminder', 'rekap_tunggakan'])) {
            return response()->json(['message' => 'Tipe tidak valid'], 422);
        }

        $request->validate([
            'enabled'       => 'required|boolean',
            'jam'           => 'required|string|regex:/^\d{2}:\d{2}$/',
            'tanggal_kirim' => 'required|array|min:0|max:3',
            'tanggal_kirim.*' => 'integer|min:1|max:28',
        ]);

        $tanggal = collect($request->input('tanggal_kirim'))
            ->unique()->sort()->values()->toArray();

        $schedule = WaSchedule::forType($type);
        $schedule->update([
            'enabled'       => $request->boolean('enabled'),
            'jam'           => $request->input('jam'),
            'tanggal_kirim' => $tanggal,
        ]);

        return response()->json(['message' => 'Jadwal berhasil disimpan', 'schedule' => $schedule]);
    }

    public function callback(Request $request): JsonResponse
    {
        $secret = config('services.wa_gateway.secret', '');
        if ($secret && $request->header('X-WA-Secret') !== $secret) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'log_id'       => 'required|integer',
            'status'       => 'required|in:sent,failed',
            'error_reason' => 'nullable|string',
            'sent_at'      => 'nullable|date',
        ]);

        $log = WaMessageLog::find($request->integer('log_id'));
        if (!$log) {
            return response()->json(['message' => 'Log not found'], 404);
        }

        if ($request->input('status') === 'sent') {
            $log->markSent();
        } else {
            $log->markFailed($request->input('error_reason', 'Unknown'));
        }

        return response()->json(['ok' => true]);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $request->validate([
            'phone'   => 'required|string|min:9|max:20',
            'message' => 'required|string|min:1',
        ]);

        $phone = $this->waService->normalizePhone($request->input('phone'));

        $log = WaMessageLog::create([
            'recipient_type' => 'wali',
            'recipient_id'   => null,
            'phone'          => $phone,
            'message_type'   => 'custom',
            'message_body'   => $request->input('message'),
            'status'         => 'pending',
        ]);

        \App\Jobs\SendWaMessageJob::dispatch($log)->onQueue('default');

        return response()->json(['message' => 'Pesan test diantrekan ke ' . $phone]);
    }

    public function getTemplates(): JsonResponse
    {
        return response()->json(WaMessageTemplate::all());
    }

    public function updateTemplate(Request $request, string $type): JsonResponse
    {
        if (!in_array($type, ['tagihan_detail', 'reminder', 'rekap_tunggakan', 'pengumuman'])) {
            return response()->json(['message' => 'Tipe tidak valid'], 422);
        }

        $request->validate(['body' => 'required|string|min:10']);

        $template = WaMessageTemplate::where('type', $type)->firstOrFail();
        $template->update([
            'body'       => $request->input('body'),
            'updated_by' => auth()->user()?->name ?? 'admin',
        ]);

        return response()->json($template->fresh());
    }
}
