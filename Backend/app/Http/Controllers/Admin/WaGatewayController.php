<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\WaMessageLog;
use App\Services\WaGateway\WaGatewayService;
use App\Services\WaMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WaGatewayController extends Controller
{
    public function __construct(
        private readonly WaMessageService $waService,
        private readonly WaGatewayService $gatewayService
    ) {}

    public function status(): JsonResponse
    {
        return response()->json($this->gatewayService->getGatewayStatus());
    }

    public function qr(): JsonResponse
    {
        $result = $this->gatewayService->getQrCode();
        return response()->json($result, $result['status_code'] ?? 200);
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
            'judul' => 'required|string|max:200',
            'isi' => 'required|string',
            'target' => 'required|in:wali,pegawai,all',
        ]);

        $judul = $request->input('judul');
        $isi = $request->input('isi');
        $target = $request->input('target');
        $count = 0;

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
        return response()->json($this->gatewayService->getPhonebook($request));
    }

    public function updateHp(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'hp_ayah' => 'nullable|string|max:20|regex:/^[0-9+\-\s]*$/',
            'hp_ibu' => 'nullable|string|max:20|regex:/^[0-9+\-\s]*$/',
        ]);

        return response()->json($this->gatewayService->updatePhonebook($request, $id));
    }

    public function previewBlast(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:tagihan_detail,reminder,pengumuman,rekap_tunggakan',
            'bulan' => 'required_unless:type,pengumuman|integer|min:1|max:12',
            'tahun' => 'required_unless:type,pengumuman|integer|min:2020',
            'judul' => 'required_if:type,pengumuman|string|max:200',
            'isi' => 'required_if:type,pengumuman|string',
        ]);

        return response()->json($this->gatewayService->previewBlast($request));
    }

    public function getSchedules(): JsonResponse
    {
        return response()->json($this->gatewayService->getSchedules());
    }

    public function updateSchedule(Request $request, string $type): JsonResponse
    {
        if (!in_array($type, ['tagihan_detail', 'reminder', 'rekap_tunggakan'])) {
            return response()->json(['message' => 'Tipe tidak valid'], 422);
        }

        $request->validate([
            'enabled' => 'required|boolean',
            'jam' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'tanggal_kirim' => 'required|array|min:0|max:3',
            'tanggal_kirim.*' => 'integer|min:1|max:28',
        ]);

        return response()->json($this->gatewayService->updateSchedule($request, $type));
    }

    public function callback(Request $request): JsonResponse
    {
        $secret = $request->header('X-Secret-Key');
        if ($secret !== config('services.wa_gateway.secret')) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json(['ok' => true]);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|min:9|max:20',
            'message' => 'required|string|min:1',
        ]);

        return response()->json($this->gatewayService->sendTestMessage($request));
    }

    public function getTemplates(): JsonResponse
    {
        return response()->json($this->gatewayService->getTemplates());
    }

    public function updateTemplate(Request $request, string $type): JsonResponse
    {
        if (!in_array($type, ['tagihan_detail', 'reminder', 'rekap_tunggakan', 'pengumuman', 'kebutuhan_order'])) {
            return response()->json(['message' => 'Tipe tidak valid'], 422);
        }

        $request->validate(['body' => 'required|string|min:10']);

        return response()->json($this->gatewayService->updateTemplate($request, $type));
    }
}