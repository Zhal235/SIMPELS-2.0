$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$mysql = 'C:/xampp/mysql/bin/mysql.exe'
$sqlFile = Join-Path $root 'database-backups_backup_20260718_201449.sql'

if (-not (Test-Path $mysql)) {
  throw 'MySQL client tidak ditemukan di C:/xampp/mysql/bin/mysql.exe'
}

if (-not (Test-Path $sqlFile)) {
  throw "SQL file tidak ditemukan: $sqlFile"
}

& $mysql -u root -e "DROP DATABASE IF EXISTS simpels_local; CREATE DATABASE simpels_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SET GLOBAL sql_mode='';"

Get-Content $sqlFile | & $mysql --force --init-command="SET SESSION sql_mode=''" -u root simpels_local

Write-Host 'Menjalankan migration tambahan aplikasi...' -ForegroundColor Yellow
Push-Location "$root/Backend"
php artisan migrate --force
Pop-Location

Write-Host 'DB import selesai (mode force, duplicate akan di-skip, migration aplikasi sudah diterapkan).'
