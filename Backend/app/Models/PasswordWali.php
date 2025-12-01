<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordWali extends Model
{
    protected $table = 'password_wali';

    protected $fillable = [
        'no_hp',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    public $timestamps = true;
}
