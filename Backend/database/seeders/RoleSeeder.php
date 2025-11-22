<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // default admin can access everything (menus empty == full access)
        Role::updateOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'menus' => null]);

        // add other roles with empty menus (admin will configure)
        Role::updateOrCreate(['slug' => 'keuangan'], ['name' => 'Keuangan', 'menus' => []]);
        Role::updateOrCreate(['slug' => 'akademik'], ['name' => 'Akademik', 'menus' => []]);
        Role::updateOrCreate(['slug' => 'operator'], ['name' => 'Operator', 'menus' => []]);
    }
}
