<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaSchedule extends Model
{
    protected $fillable = ['type', 'tanggal_kirim', 'jam', 'enabled', 'last_ran_date'];

    protected $casts = [
        'tanggal_kirim' => 'array',
        'enabled' => 'boolean',
        'last_ran_date' => 'date',
    ];

    public static function forType(string $type): self
    {
        return static::firstOrCreate(
            ['type' => $type],
            ['tanggal_kirim' => [], 'jam' => '07:00', 'enabled' => false]
        );
    }

    public function shouldRunToday(): bool
    {
        if (!$this->enabled) return false;
        $today = now()->day;
        if (!in_array($today, $this->tanggal_kirim ?? [])) return false;
        if ($this->last_ran_date && $this->last_ran_date->isToday()) return false;
        return true;
    }

    public function markRan(): void
    {
        $this->last_ran_date = now()->toDateString();
        $this->save();
    }
}
