<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RfidTag extends Model
{
    use HasFactory;

    protected $table = 'rfid_tags';

    protected $fillable = [
        'uid', 'santri_id', 'label', 'active'
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }
}
