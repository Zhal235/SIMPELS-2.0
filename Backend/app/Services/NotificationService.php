<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Send notification untuk pembayaran disetujui
     */
    public static function paymentApproved($santriId, $tagihanNames, $nominal)
    {
        return Notification::createNotification(
            $santriId,
            'wali',
            'payment_approved',
            'Pembayaran Disetujui ✅',
            "Pembayaran {$tagihanNames} sebesar Rp " . number_format($nominal, 0, ',', '.') . " telah disetujui.",
            ['nominal' => $nominal]
        );
    }

    /**
     * Send notification untuk pembayaran ditolak
     */
    public static function paymentRejected($santriId, $reason)
    {
        return Notification::createNotification(
            $santriId,
            'wali',
            'payment_rejected',
            'Pembayaran Ditolak ❌',
            "Bukti transfer ditolak. Alasan: {$reason}",
            ['reason' => $reason]
        );
    }

    /**
     * Send notification untuk tagihan baru
     */
    public static function newTagihan($santriId, $jenisTagihan, $nominal, $bulan = null)
    {
        $bulanText = $bulan ? " bulan {$bulan}" : '';
        return Notification::createNotification(
            $santriId,
            'wali',
            'new_tagihan',
            'Tagihan Baru 📋',
            "Tagihan {$jenisTagihan}{$bulanText} sebesar Rp " . number_format($nominal, 0, ',', '.') . " telah ditambahkan.",
            ['nominal' => $nominal]
        );
    }

    /**
     * Send notification untuk top-up disetujui
     */
    public static function topupApproved($santriId, $nominal)
    {
        return Notification::createNotification(
            $santriId,
            'wali',
            'topup_approved',
            'Top-up Disetujui ✅',
            "Top-up dompet sebesar Rp " . number_format($nominal, 0, ',', '.') . " telah disetujui dan masuk ke dompet santri.",
            ['nominal' => $nominal]
        );
    }

    /**
     * Send notification untuk reminder tagihan jatuh tempo
     */
    public static function tagihanReminder($santriId, $jenisTagihan, $nominal, $dueDate)
    {
        return Notification::createNotification(
            $santriId,
            'wali',
            'tagihan_reminder',
            'Reminder Tagihan ⏰',
            "Tagihan {$jenisTagihan} sebesar Rp " . number_format($nominal, 0, ',', '.') . " akan jatuh tempo pada {$dueDate}.",
            ['nominal' => $nominal, 'due_date' => $dueDate]
        );
    }
}
