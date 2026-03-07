<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaMessageTemplate extends Model
{
    protected $fillable = ['type', 'body', 'placeholders', 'updated_by'];

    protected $casts = [
        'placeholders' => 'array',
    ];
}
