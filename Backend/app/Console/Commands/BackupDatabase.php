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
    protected $description = 'Backup database and send via email';

    public function handle(): int
    {
        $this->info('Starting database backup...');

        try {
            $filename = 'backup_' . Carbon::now('Asia/Jakarta')->format('Ymd_His') . '.sql';
            $sql = $this->generateSqlDump();

            // Ensure backup directory exists
            $backupDir = storage_path('app' . DIRECTORY_SEPARATOR . 'backups');
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Store temporarily
            $filePath = $backupDir . DIRECTORY_SEPARATOR . $filename;
            file_put_contents($filePath, $sql);
            $sizeKb   = round(strlen($sql) / 1024, 1);

            $recipient = $this->option('email') ?: config('app.backup_email');

            if (!$recipient) {
                $this->warn('No BACKUP_EMAIL configured. File saved locally at: ' . $filePath);
                return self::SUCCESS;
            }

            // Send email with attachment
            Mail::send([], [], function ($message) use ($recipient, $filePath, $filename, $sizeKb) {
                $appName = config('app.name', 'SIMPELS');
                $now = Carbon::now('Asia/Jakarta')->format('d/m/Y H:i');

                $message->to($recipient)
                    ->subject("[{$appName}] Backup Database – {$now}")
                    ->html(
                        "<h3>Backup Database {$appName}</h3>" .
                        "<p>Backup otomatis berhasil dibuat pada <strong>{$now} WIB</strong>.</p>" .
                        "<ul>" .
                        "<li>File: <code>{$filename}</code></li>" .
                        "<li>Ukuran: <strong>{$sizeKb} KB</strong></li>" .
                        "<li>Database: <strong>" . config('database.default') . "</strong></li>" .
                        "</ul>" .
                        "<p style='color:#666;font-size:12px'>Email ini dikirim otomatis oleh sistem {$appName}.</p>"
                    )
                    ->attach($filePath, ['as' => $filename, 'mime' => 'application/sql']);
            });

            // Clean up temp file
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            $this->info("Backup sent to {$recipient} ({$sizeKb} KB)");
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Backup failed: ' . $e->getMessage());
            \Log::error('DB Backup failed: ' . $e->getMessage());
            return self::FAILURE;
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
        // MySQL / MariaDB
        return array_column(DB::select('SHOW TABLES'), array_keys((array) DB::select('SHOW TABLES')[0] ?? [])[0] ?? 'Tables_in_' . config('database.connections.' . $driver . '.database'));
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
