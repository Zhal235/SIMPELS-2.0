<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordWali extends Model
{
    protected $table = 'password_wali';

    protected $fillable = [
        'no_hp',
        'password',
        'last_mobile_login_at',
        'mobile_login_count',
        'last_mobile_device',
    ];

    protected $hidden = [
        'password',
    ];

    public $timestamps = true;
}
