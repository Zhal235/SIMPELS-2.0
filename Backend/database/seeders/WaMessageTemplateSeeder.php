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
        ];

        foreach ($templates as $data) {
            WaMessageTemplate::updateOrCreate(
                ['type' => $data['type']],
                $data
            );
        }
    }
}
