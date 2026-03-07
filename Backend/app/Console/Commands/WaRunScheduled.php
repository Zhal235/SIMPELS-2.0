<?php

namespace App\Console\Commands;

use App\Models\WaSchedule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class WaRunScheduled extends Command
{
    protected $signature = 'wa:run-scheduled {--force : Run regardless of date check}';
    protected $description = 'Run WA blasts that are scheduled for today';

    public function handle(): int
    {
        $force = $this->option('force');
        $today = now()->day;

        $types = ['tagihan_detail', 'reminder', 'rekap_tunggakan'];
        $ran = 0;

        foreach ($types as $type) {
            $schedule = WaSchedule::forType($type);

            if (!$force && !$schedule->shouldRunToday()) {
                $this->line("[wa:scheduled] Skip {$type} — not scheduled today (day={$today})");
                continue;
            }

            $this->info("[wa:scheduled] Running {$type} for day={$today}...");

            $commandMap = [
                'tagihan_detail'  => 'wa:detail-tagihan',
                'reminder'        => 'wa:reminder-tagihan',
                'rekap_tunggakan' => 'wa:rekap-tunggakan',
            ];
            $command = $commandMap[$type];
            Artisan::call($command, [], $this->output);

            $schedule->markRan();
            $ran++;
        }

        $this->info("[wa:scheduled] Done. {$ran} blast(s) triggered.");
        return Command::SUCCESS;
    }
}
