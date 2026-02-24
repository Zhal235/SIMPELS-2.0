<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--email= : Override recipient email}';
    protected $description = 'Backup database: upload to R2 and send via email';

    private const R2_BACKUP_DIR  = 'database-backups';
    private const MAX_BACKUPS    = 30;

    public function handle(): int
    {
        $this->info('Starting database backup...');

        try {
            $now      = Carbon::now('Asia/Jakarta');
            $filename = 'backup_' . $now->format('Ymd_His') . '.sql';
            $sql      = $this->generateSqlDump();
            $sizeKb   = round(strlen($sql) / 1024, 1);

            // ── 1. Upload to Cloudflare R2 ──────────────────────────────
            $r2Path = self::R2_BACKUP_DIR . '/' . $filename;
            try {
                Storage::disk('r2')->put($r2Path, $sql);
                $this->pruneOldBackups();
                $this->info("Uploaded to R2: {$r2Path} ({$sizeKb} KB)");
            } catch (\Exception $e) {
                \Log::warning('R2 backup upload failed: ' . $e->getMessage());
                $this->warn('R2 upload failed: ' . $e->getMessage());
            }

            // ── 2. Send email ───────────────────────────────────────────
            $recipient = $this->option('email') ?: config('app.backup_email');

            if ($recipient) {
                // Write temp file for email attachment
                $backupDir = storage_path('app' . DIRECTORY_SEPARATOR . 'backups');
                if (!is_dir($backupDir) && !@mkdir($backupDir, 0755, true)) {
                    $backupDir = sys_get_temp_dir();
                }
                $filePath = $backupDir . DIRECTORY_SEPARATOR . $filename;
                file_put_contents($filePath, $sql);

                try {
                    Mail::send([], [], function ($message) use ($recipient, $filePath, $filename, $sizeKb, $now) {
                        $appName = config('app.name', 'SIMPELS');
                        $time    = $now->format('d/m/Y H:i');

                        $message->to($recipient)
                            ->subject("[{$appName}] Backup Database – {$time}")
                            ->html(
                                "<h3>Backup Database {$appName}</h3>" .
                                "<p>Backup berhasil dibuat pada <strong>{$time} WIB</strong>.</p>" .
                                "<ul>" .
                                "<li>File: <code>{$filename}</code></li>" .
                                "<li>Ukuran: <strong>{$sizeKb} KB</strong></li>" .
                                "<li>Database: <strong>" . config('database.default') . "</strong></li>" .
                                "<li>Tersimpan di: <strong>Cloudflare R2 › " . self::R2_BACKUP_DIR . "/</strong></li>" .
                                "</ul>" .
                                "<p style='color:#666;font-size:12px'>Email ini dikirim otomatis oleh sistem {$appName}.</p>"
                            )
                            ->attach($filePath, ['as' => $filename, 'mime' => 'application/sql']);
                    });
                    $this->info("Email sent to {$recipient}");
                } catch (\Exception $e) {
                    \Log::warning('Backup email failed: ' . $e->getMessage());
                    $this->warn('Email failed: ' . $e->getMessage());
                } finally {
                    if (file_exists($filePath)) unlink($filePath);
                }
            } else {
                $this->warn('BACKUP_EMAIL not configured — skipping email.');
            }

            $this->info("Backup complete ({$sizeKb} KB)");
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Backup failed: ' . $e->getMessage());
            \Log::error('DB Backup failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    /** Delete oldest backups, keep only MAX_BACKUPS */
    private function pruneOldBackups(): void
    {
        try {
            $files = collect(Storage::disk('r2')->files(self::R2_BACKUP_DIR))
                ->sort()
                ->values();

            if ($files->count() > self::MAX_BACKUPS) {
                $toDelete = $files->slice(0, $files->count() - self::MAX_BACKUPS);
                foreach ($toDelete as $file) {
                    Storage::disk('r2')->delete($file);
                }
                $this->info('Pruned ' . $toDelete->count() . ' old backup(s) from R2.');
            }
        } catch (\Exception $e) {
            \Log::warning('Backup prune failed: ' . $e->getMessage());
        }
    }

    private function generateSqlDump(): string
    {
        $driver     = config('database.default');
        $connection = config("database.connections.{$driver}");

        $sql  = "-- SIMPELS Database Backup\n";
        $sql .= "-- Generated: " . Carbon::now('Asia/Jakarta')->toDateTimeString() . " WIB\n";
        $sql .= "-- Driver: {$driver}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tables = $this->getTables($driver);

        foreach ($tables as $table) {
            $sql .= $this->dumpTable($table, $driver, $connection);
        }

        $sql .= "\nSET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }

    private function getTables(string $driver): array
    {
        if ($driver === 'sqlite') {
            return array_column(
                DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"),
                'name'
            );
        }
        // MySQL / MariaDB — get table name from first column of SHOW TABLES
        $rows = DB::select('SHOW TABLES');
        if (empty($rows)) return [];
        $col = array_keys((array) $rows[0])[0];
        return array_column(array_map('get_object_vars', $rows), $col);
    }

    private function dumpTable(string $table, string $driver, array $connection): string
    {
        $sql = "-- Table: `{$table}`\n";

        // CREATE TABLE statement
        if ($driver === 'sqlite') {
            $create = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
            $sql   .= ($create[0]->sql ?? '') . ";\n\n";
        } else {
            $create = DB::select("SHOW CREATE TABLE `{$table}`");
            $sql   .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sql   .= ($create[0]->{'Create Table'} ?? '') . ";\n\n";
        }

        // INSERT rows
        $rows = DB::table($table)->get();
        if ($rows->isEmpty()) {
            $sql .= "-- (no rows)\n\n";
            return $sql;
        }

        $columns = array_keys((array) $rows[0]);
        $colList = implode(', ', array_map(fn($c) => "`{$c}`", $columns));

        foreach ($rows->chunk(500) as $chunk) {
            $values = $chunk->map(function ($row) {
                return '(' . implode(', ', array_map(function ($v) {
                    if ($v === null) return 'NULL';
                    if (is_numeric($v)) return $v;
                    return "'" . addslashes($v) . "'";
                }, (array) $row)) . ')';
            })->implode(",\n");

            $sql .= "INSERT INTO `{$table}` ({$colList}) VALUES\n{$values};\n\n";
        }

        return $sql;
    }
}
