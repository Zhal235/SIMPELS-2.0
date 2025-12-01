<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'priority',
        'target_type',
        'target_ids',
        'push_notification',
        'created_by',
    ];

    protected $casts = [
        'target_ids' => 'array',
        'push_notification' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke User yang membuat pengumuman
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi ke AnnouncementRead (many to many through pivot)
     */
    public function reads()
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    /**
     * Relasi ke Users yang sudah membaca
     */
    public function readByUsers()
    {
        return $this->belongsToMany(User::class, 'announcement_reads')
            ->withTimestamps()
            ->withPivot('read_at');
    }

    /**
     * Scope untuk filter announcements yang relevan untuk user tertentu
     */
    public function scopeForUser($query, $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('target_type', 'all')
                ->orWhere(function ($q) use ($user) {
                    // Jika target adalah kelas, cek apakah user punya santri di kelas tersebut
                    $q->where('target_type', 'class')
                        ->whereJsonContains('target_ids', function ($query) use ($user) {
                            // TODO: implementasi relasi user -> santri -> kelas
                        });
                })
                ->orWhere(function ($q) use ($user) {
                    // Jika target adalah santri tertentu, cek apakah user adalah wali santri tersebut
                    $q->where('target_type', 'santri')
                        ->whereJsonContains('target_ids', function ($query) use ($user) {
                            // TODO: implementasi relasi user -> santri
                        });
                });
        });
    }

    /**
     * Check apakah user sudah membaca announcement ini
     */
    public function isReadBy($userId)
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }
}
