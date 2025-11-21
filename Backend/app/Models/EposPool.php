<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EposPool extends Model
{
    use HasFactory;

    protected $table = 'epos_pools';

    protected $fillable = [
        'name', 'balance'
    ];
}
