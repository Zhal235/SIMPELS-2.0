<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Backup database every day at 02:00 WIB (UTC+7 = 19:00 UTC)
Schedule::command('db:backup')->dailyAt('19:00')->timezone('UTC');

// WA: Jalankan pengecekan jadwal setiap hari pukul 07:00 WIB (00:00 UTC)
Schedule::command('wa:run-scheduled')->dailyAt('00:00')->timezone('UTC');

