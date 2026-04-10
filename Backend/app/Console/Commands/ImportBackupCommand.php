<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportBackupCommand extends Command
{
    protected $signature = 'db:import-backup {file}';
    protected $description = 'Import SQL backup file';

    public function handle()
    {
        $file = $this->argument('file');
        
        if (!File::exists($file)) {
            $this->error("File not found: {$file}");
            return 1;
        }

        $this->info("Reading backup file...");
        $sql = File::get($file);
        $fileSize = File::size($file) / 1024 / 1024;
        $this->info(sprintf("File size: %.2f MB", $fileSize));

        $this->info("Disabling foreign key checks...");
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $this->info("Importing data...");
        
        try {
            // Split SQL into individual statements
            $statements = array_filter(
                explode(";\n", $sql),
                function($stmt) {
                    $stmt = trim($stmt);
                    return !empty($stmt) && !str_starts_with($stmt, '--');
                }
            );

            $bar = $this->output->createProgressBar(count($statements));
            $bar->start();

            $success = 0;
            $failed = 0;

            foreach ($statements as $statement) {
                try {
                    DB::unprepared($statement . ';');
                    $success++;
                } catch (\Exception $e) {
                    // Skip duplicates silently
                    if (!str_contains($e->getMessage(), 'Duplicate entry')) {
                        $this->warn("Error: " . $e->getMessage());
                    }
                    $failed++;
                }
                $bar->advance();
            }

            $bar->finish();
            $this->newLine(2);

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $this->info("Import completed!");
            $this->table(['Status', 'Count'], [
                ['Success', $success],
                ['Failed/Skipped', $failed],
            ]);

            // Verify data
            $this->info("Verifying data...");
            $tables = ['users', 'santri', 'kelas', 'asramas', 'wallets', 'tagihan_santri', 'pembayaran'];
            $data = [];
            foreach ($tables as $table) {
                try {
                    $count = DB::table($table)->count();
                    $data[] = [$table, $count];
                } catch (\Exception $e) {
                    $data[] = [$table, 'N/A'];
                }
            }
            $this->table(['Table', 'Records'], $data);

            return 0;
        } catch (\Exception $e) {
            $this->error("Import failed: " . $e->getMessage());
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            return 1;
        }
    }
}
