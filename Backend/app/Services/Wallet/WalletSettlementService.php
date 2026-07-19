<?php

namespace App\Services\Wallet;

use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletSettlementService
{
    private const EXIT_STATUSES = ['mutasi', 'mutasi_keluar', 'keluar', 'alumni', 'lulus'];

    public function __construct(protected WalletBalanceService $balanceService)
    {
    }

    public function preview(string $santriId): array
    {
        $santri = Santri::with(['kelas'])->find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Santri tidak ditemukan',
                'status_code' => 404,
            ];
        }

        if (!in_array((string) $santri->status, self::EXIT_STATUSES, true)) {
            return [
                'success' => false,
                'message' => 'Settlement hanya untuk santri status exit/nonaktif',
                'status_code' => 422,
            ];
        }

        $wallet = Wallet::where('santri_id', $santriId)->first();
        $walletBalance = (float) ($wallet?->balance ?? 0);
        $unpaidTagihan = $this->getUnpaidTagihan($santriId);

        $totalTunggakan = (float) $unpaidTagihan->sum('sisa');
        $offsetAmount = 0.0;
        $refundAmount = $walletBalance;
        $residualTunggakan = $totalTunggakan;

        return [
            'success' => true,
            'data' => [
                'santri' => [
                    'id' => $santri->id,
                    'nama_santri' => $santri->nama_santri,
                    'status' => $santri->status,
                    'kelas_nama' => $santri->kelas_nama,
                ],
                'wallet' => [
                    'id' => $wallet?->id,
                    'is_active' => (bool) ($wallet?->is_active ?? false),
                    'balance' => $walletBalance,
                ],
                'summary' => [
                    'total_tunggakan' => $totalTunggakan,
                    'offset_amount' => $offsetAmount,
                    'refund_amount' => $refundAmount,
                    'residual_tunggakan' => $residualTunggakan,
                    'tagihan_auto_paid_from_wallet' => false,
                ],
                'tagihan' => $unpaidTagihan->map(function (TagihanSantri $tagihan) {
                    return [
                        'id' => $tagihan->id,
                        'jenis_tagihan' => $tagihan->jenisTagihan?->nama_tagihan,
                        'bulan' => $tagihan->bulan,
                        'tahun' => $tagihan->tahun,
                        'nominal' => (float) $tagihan->nominal,
                        'dibayar' => (float) $tagihan->dibayar,
                        'sisa' => (float) $tagihan->sisa,
                        'planned_payment' => 0.0,
                    ];
                })->values(),
            ],
        ];
    }

    public function execute(string $santriId, array $payload, ?int $userId): array
    {
        $konfirmasi = (bool) ($payload['konfirmasi'] ?? false);
        if (!$konfirmasi) {
            return [
                'success' => false,
                'message' => 'Settlement dibatalkan karena konfirmasi tidak valid',
                'status_code' => 422,
            ];
        }

        return DB::transaction(function () use ($santriId, $payload, $userId) {
            $santri = Santri::where('id', $santriId)->lockForUpdate()->first();
            if (!$santri) {
                return [
                    'success' => false,
                    'message' => 'Santri tidak ditemukan',
                    'status_code' => 404,
                ];
            }

            if (!in_array((string) $santri->status, self::EXIT_STATUSES, true)) {
                return [
                    'success' => false,
                    'message' => 'Settlement hanya untuk santri status exit/nonaktif',
                    'status_code' => 422,
                ];
            }

            $wallet = Wallet::where('santri_id', $santriId)->lockForUpdate()->first();
            $walletBalance = (float) ($wallet?->balance ?? 0);
            $unpaidTagihan = $this->getUnpaidTagihan($santriId, true);

            $totalTunggakan = (float) $unpaidTagihan->sum('sisa');
            $offsetAmount = 0.0;
            $refundAmount = $walletBalance;
            $residualTunggakan = $totalTunggakan;

            $expectedWallet = isset($payload['expected_wallet_balance']) ? (float) $payload['expected_wallet_balance'] : null;
            $expectedTunggakan = isset($payload['expected_total_tunggakan']) ? (float) $payload['expected_total_tunggakan'] : null;

            if ($expectedWallet !== null && abs($expectedWallet - $walletBalance) > 0.0001) {
                return [
                    'success' => false,
                    'message' => 'Saldo dompet berubah. Muat ulang preview settlement lalu ulangi proses.',
                    'status_code' => 409,
                    'data' => [
                        'expected_wallet_balance' => $expectedWallet,
                        'current_wallet_balance' => $walletBalance,
                    ],
                ];
            }

            if ($expectedTunggakan !== null && abs($expectedTunggakan - $totalTunggakan) > 0.0001) {
                return [
                    'success' => false,
                    'message' => 'Total tunggakan berubah. Muat ulang preview settlement lalu ulangi proses.',
                    'status_code' => 409,
                    'data' => [
                        'expected_total_tunggakan' => $expectedTunggakan,
                        'current_total_tunggakan' => $totalTunggakan,
                    ],
                ];
            }

            if ($refundAmount <= 0) {
                return [
                    'success' => false,
                    'message' => 'Tidak ada saldo dompet untuk diselesaikan.',
                    'status_code' => 422,
                ];
            }

            $refundMethod = (string) ($payload['refund_method'] ?? 'cash');
            if ($refundAmount > 0 && !in_array($refundMethod, ['cash', 'transfer'], true)) {
                return [
                    'success' => false,
                    'message' => 'Metode refund harus cash atau transfer.',
                    'status_code' => 422,
                ];
            }

            if ($refundAmount > 0) {
                if ($refundMethod === 'cash') {
                    $availableCash = (float) $this->balanceService->calculateTotalCashBalance();
                    if ($availableCash < $refundAmount) {
                        return [
                            'success' => false,
                            'message' => 'Saldo kas tidak mencukupi untuk refund settlement.',
                            'status_code' => 422,
                            'data' => [
                                'available' => $availableCash,
                                'required' => $refundAmount,
                            ],
                        ];
                    }
                }

                if ($refundMethod === 'transfer') {
                    $availableBank = (float) $this->balanceService->calculateTotalBankBalance();
                    if ($availableBank < $refundAmount) {
                        return [
                            'success' => false,
                            'message' => 'Saldo bank/transfer tidak mencukupi untuk refund settlement.',
                            'status_code' => 422,
                            'data' => [
                                'available' => $availableBank,
                                'required' => $refundAmount,
                            ],
                        ];
                    }
                }
            }

            if ($wallet) {
                if ($refundAmount > 0) {
                    $wallet->balance -= $refundAmount;
                    $wallet->save();

                    WalletTransaction::create([
                        'wallet_id' => $wallet->id,
                        'type' => 'debit',
                        'amount' => $refundAmount,
                        'balance_after' => $wallet->balance,
                        'description' => 'Settlement: pengembalian saldo dompet santri status exit/nonaktif',
                        'reference' => 'STL-REF-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5)),
                        'method' => $refundMethod,
                        'created_by' => $userId,
                    ]);
                }

                if ((float) $wallet->balance <= 0.0001) {
                    $wallet->balance = 0;
                    $wallet->is_active = false;
                    $wallet->save();
                }
            }

            return [
                'success' => true,
                'message' => 'Settlement santri berhasil diproses',
                'data' => [
                    'santri_id' => $santri->id,
                    'offset_amount' => $offsetAmount,
                    'refund_amount' => $refundAmount,
                    'residual_tunggakan' => $residualTunggakan,
                    'refund_method' => $refundAmount > 0 ? $refundMethod : null,
                    'paid_items' => [],
                    'tagihan_auto_paid_from_wallet' => false,
                    'wallet_balance_after' => (float) ($wallet?->balance ?? 0),
                ],
            ];
        });
    }

    private function getUnpaidTagihan(string $santriId, bool $forUpdate = false)
    {
        $query = TagihanSantri::with('jenisTagihan')
            ->where('santri_id', $santriId)
            ->whereIn('status', ['belum_bayar', 'sebagian'])
            ->where('sisa', '>', 0)
            ->orderBy('tahun', 'asc')
            ->orderByRaw("CASE bulan
                WHEN 'Januari' THEN 1
                WHEN 'Februari' THEN 2
                WHEN 'Maret' THEN 3
                WHEN 'April' THEN 4
                WHEN 'Mei' THEN 5
                WHEN 'Juni' THEN 6
                WHEN 'Juli' THEN 7
                WHEN 'Agustus' THEN 8
                WHEN 'September' THEN 9
                WHEN 'Oktober' THEN 10
                WHEN 'November' THEN 11
                WHEN 'Desember' THEN 12
                ELSE 13
            END")
            ->orderBy('id', 'asc');

        if ($forUpdate) {
            $query->lockForUpdate();
        }

        return $query->get();
    }
}
