<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait ValidatesDeletion
{
    /**
     * Validasi apakah data bisa dihapus berdasarkan dependency
     * 
     * @param mixed $model Model yang akan dihapus
     * @param array $dependencies Array relasi yang harus dicek ['relation_name' => 'Display Name']
     * @return array ['can_delete' => bool, 'message' => string, 'dependencies' => array, 'instructions' => string]
     */
    protected function validateDeletion($model, array $dependencies)
    {
        $foundDependencies = [];
        $displayName = $this->getModelDisplayName($model);
        
        foreach ($dependencies as $relationName => $config) {
            // Support untuk nested relation (contoh: 'tagihanSantri.count')
            $relation = $relationName;
            $displayLabel = is_array($config) ? $config['label'] : $config;
            $action = is_array($config) ? ($config['action'] ?? null) : null;
            
            // Cek apakah relasi ada
            if (!method_exists($model, $relation)) {
                continue;
            }
            
            // Hitung jumlah data terkait
            $count = $model->{$relation}()->count();
            
            if ($count > 0) {
                $foundDependencies[] = [
                    'type' => $displayLabel,
                    'count' => $count,
                    'relation' => $relation,
                    'action' => $action ?? "Hapus atau pindahkan {$count} {$displayLabel}"
                ];
            }
        }
        
        if (empty($foundDependencies)) {
            return [
                'can_delete' => true,
                'message' => "{$displayName} berhasil dihapus",
                'dependencies' => [],
                'instructions' => null
            ];
        }
        
        // Generate instruksi yang detail
        $instructions = $this->generateInstructions($displayName, $foundDependencies);
        
        return [
            'can_delete' => false,
            'message' => "Tidak dapat menghapus {$displayName}",
            'reason' => 'Masih ada data terkait yang harus dihapus atau dipindahkan terlebih dahulu',
            'dependencies' => $foundDependencies,
            'instructions' => $instructions
        ];
    }
    
    /**
     * Generate instruksi langkah demi langkah untuk user
     */
    private function generateInstructions($displayName, $dependencies)
    {
        $instructions = "Langkah yang harus dilakukan sebelum menghapus {$displayName}:\n\n";
        
        foreach ($dependencies as $index => $dep) {
            $step = $index + 1;
            $instructions .= "{$step}. {$dep['action']}\n";
        }
        
        $instructions .= "\nSetelah semua data terkait dihapus atau dipindahkan, Anda dapat menghapus {$displayName}.";
        
        return $instructions;
    }
    
    /**
     * Get display name dari model
     */
    private function getModelDisplayName($model)
    {
        $className = class_basename($model);
        
        // Mapping nama model ke display name yang user-friendly
        $displayNames = [
            'JenisTagihan' => 'Jenis Tagihan',
            'TagihanSantri' => 'Tagihan Santri',
            'Santri' => 'Data Santri',
            'Kelas' => 'Kelas',
            'Asrama' => 'Asrama',
            'BukuKas' => 'Buku Kas',
            'Pembayaran' => 'Pembayaran',
            'TransaksiKas' => 'Transaksi Kas',
            'Wallet' => 'Dompet Digital',
            'WalletTransaction' => 'Transaksi Dompet',
            'RfidTag' => 'RFID Tag',
            'Pegawai' => 'Data Pegawai',
            'User' => 'User',
            'Role' => 'Role',
            'TahunAjaran' => 'Tahun Ajaran',
            'KategoriPengeluaran' => 'Kategori Pengeluaran',
        ];
        
        return $displayNames[$className] ?? $className;
    }
    
    /**
     * Return response untuk API berdasarkan hasil validasi
     */
    protected function deletionResponse($validation, $successCallback = null)
    {
        if (!$validation['can_delete']) {
            return response()->json([
                'success' => false,
                'message' => $validation['message'],
                'reason' => $validation['reason'],
                'dependencies' => $validation['dependencies'],
                'instructions' => $validation['instructions']
            ], 422); // 422 Unprocessable Entity
        }
        
        // Jika ada callback untuk success, jalankan
        if ($successCallback && is_callable($successCallback)) {
            $successCallback();
        }
        
        return response()->json([
            'success' => true,
            'message' => $validation['message']
        ], 200);
    }
}
