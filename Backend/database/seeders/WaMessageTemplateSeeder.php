<?php

namespace Database\Seeders;

use App\Models\WaMessageTemplate;
use Illuminate\Database\Seeder;

class WaMessageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'type' => 'tagihan_detail',
                'body' => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\nBerikut tagihan bulan *{{bulan_tahun}}*:\n{{daftar_tagihan}}\n────────────────{{bagian_tunggakan}}\n*Total Keseluruhan: Rp {{total}}*\n\nPembayaran dapat dilakukan melalui aplikasi SIMPELS atau transfer ke rekening pesantren.\n\nTerima kasih.\n_SIMPELS - Sistem Informasi Pesantren_",
                'placeholders' => [
                    ['key' => 'nama_santri',      'desc' => 'Nama santri',                                          'required' => true],
                    ['key' => 'bulan_tahun',       'desc' => 'Contoh: Maret 2026',                                  'required' => true],
                    ['key' => 'daftar_tagihan',    'desc' => 'Daftar item tagihan bulan berjalan',                  'required' => true],
                    ['key' => 'bagian_tunggakan',  'desc' => 'Bagian tunggakan lalu (kosong jika tidak ada)',       'required' => false],
                    ['key' => 'total',             'desc' => 'Total nominal semua tagihan + tunggakan',             'required' => true],
                ],
            ],
            [
                'type' => 'reminder',
                'body' => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\nKami mengingatkan bahwa pembayaran SPP bulan *{{bulan_tahun}}* belum dilakukan. Mohon segera melakukan pembayaran paling lambat tanggal *{{jatuh_tempo}}*.\n\nTerima kasih atas perhatiannya.\n_SIMPELS - Sistem Informasi Pesantren_",
                'placeholders' => [
                    ['key' => 'nama_santri',  'desc' => 'Nama santri',                              'required' => true],
                    ['key' => 'bulan_tahun',  'desc' => 'Contoh: Maret 2026',                       'required' => true],
                    ['key' => 'jatuh_tempo',  'desc' => 'Contoh: 10 Maret 2026',                    'required' => true],
                ],
            ],
            [
                'type' => 'rekap_tunggakan',
                'body' => "Assalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\n⚠️ *REKAP TUNGGAKAN BELUM LUNAS*\n\n{{daftar_tunggakan}}\n────────────────\n*Total Tunggakan: Rp {{total}}*\n\nMohon segera melunasi tagihan di atas melalui aplikasi SIMPELS atau transfer ke rekening pesantren.\n\nTerima kasih atas perhatiannya.\n_SIMPELS - Sistem Informasi Pesantren_",
                'placeholders' => [
                    ['key' => 'nama_santri',     'desc' => 'Nama santri',                         'required' => true],
                    ['key' => 'daftar_tunggakan', 'desc' => 'Daftar tunggakan dikelompokkan per bulan', 'required' => true],
                    ['key' => 'total',            'desc' => 'Total semua tunggakan',               'required' => true],
                ],
            ],
            [
                'type' => 'pengumuman',
                'body' => "📢 *PENGUMUMAN*\n*{{judul}}*\n\n{{isi}}\n\n_SIMPELS - Sistem Informasi Pesantren_",
                'placeholders' => [
                    ['key' => 'judul', 'desc' => 'Judul pengumuman', 'required' => true],
                    ['key' => 'isi',   'desc' => 'Isi pengumuman',   'required' => true],
                ],
            ],
            [
                'type' => 'kebutuhan_order',
                'body' => "*🛒 PESANAN KEBUTUHAN SANTRI*\n\nAssalamu'alaikum Bapak/Ibu Wali Santri,\n\nSantri *{{nama_santri}}* telah memesan kebutuhan sebanyak *{{jumlah_item}} item* senilai *{{total}}*\n\n📦 *Daftar Barang:*\n{{daftar_barang}}\n\n🔖 *Nomor Pesanan:*\n{{nomor_pesanan}}\n\n⏰ *Batas Konfirmasi:*\n{{batas_konfirmasi}} WIB\n\n✅ Pesanan akan *otomatis dikonfirmasi* dalam 24 jam jika tidak ada penolakan.\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📱 *CARA MENOLAK PESANAN:*\n\n1️⃣ Buka aplikasi SIMPELS Mobile:\n    👉 {{link_pwa}}\n\n2️⃣ Login dengan nomor HP Anda\n\n3️⃣ Pilih menu *\"Pesanan Kebutuhan\"*\n\n4️⃣ Cari pesanan {{nomor_pesanan}}\n\n5️⃣ Klik *Tolak* jika tidak setuju\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n💡 *Catatan:* \n• Saldo akan dipotong otomatis setelah 24 jam\n• Pastikan saldo santri mencukupi\n\nJazakumullahu khairan 🤲",
                'placeholders' => [
                    ['key' => 'nama_santri',      'desc' => 'Nama santri yang pesan',                    'required' => true],
                    ['key' => 'jumlah_item',      'desc' => 'Jumlah item dalam pesanan',                'required' => true],
                    ['key' => 'total',            'desc' => 'Total harga (contoh: Rp 85.000)',          'required' => true],
                    ['key' => 'daftar_barang',    'desc' => 'Nama-nama barang yang dipesan',            'required' => true],
                    ['key' => 'nomor_pesanan',    'desc' => 'Nomor pesanan (contoh: #456)',             'required' => true],
                    ['key' => 'batas_konfirmasi', 'desc' => 'Tanggal & waktu batas (contoh: 31 Mar 2026 14:30)', 'required' => true],
                    ['key' => 'link_pwa',         'desc' => 'URL aplikasi mobile PWA',                  'required' => true],
                ],
            ],
            [
                'type' => 'reminder_saldo',
                'body' => "⚠️ *NOTIFIKASI SALDO RENDAH*\n\nAssalamu'alaikum Wr. Wb.\nYth. Wali Santri *{{nama_santri}}*\n\nKami informasikan bahwa saldo santri saat ini berada di bawah batas minimal yang ditentukan:\n\n💰 *Saldo saat ini:* Rp {{saldo_sekarang}}\n📊 *Batas minimal:* Rp {{saldo_minimal}}\n\nMohon segera melakukan top-up saldo agar santri dapat melakukan transaksi dengan lancar.\n\nPembayaran dapat dilakukan melalui aplikasi SIMPELS atau transfer ke rekening pesantren.\n\nTerima kasih atas perhatiannya.\n_SIMPELS - Sistem Informasi Pesantren_",
                'placeholders' => [
                    ['key' => 'nama_santri',    'desc' => 'Nama santri',                              'required' => true],
                    ['key' => 'saldo_sekarang', 'desc' => 'Saldo saat ini (contoh: 5.000)',          'required' => true],
                    ['key' => 'saldo_minimal',  'desc' => 'Batas minimal saldo (contoh: 10.000)',    'required' => true],
                ],
            ],
        ];

        foreach ($templates as $data) {
            WaMessageTemplate::updateOrCreate(
                ['type' => $data['type']],
                $data
            );
        }
    }
}
