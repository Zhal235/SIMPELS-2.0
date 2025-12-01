<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BankAccount;

class BankAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'bank_name' => 'BRI',
                'account_number' => '1234-5678-9012-3456',
                'account_name' => 'YAYASAN PESANTREN CONTOH',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'bank_name' => 'BCA',
                'account_number' => '9876-5432-1098',
                'account_name' => 'YAYASAN PESANTREN CONTOH',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'bank_name' => 'Mandiri',
                'account_number' => '1122-334455-6677',
                'account_name' => 'YAYASAN PESANTREN CONTOH',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($accounts as $account) {
            BankAccount::updateOrCreate(
                ['account_number' => $account['account_number']],
                $account
            );
        }

        $this->command->info('Bank accounts seeded successfully!');
    }
}
