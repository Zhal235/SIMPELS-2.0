<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Santri;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class WalletTransactionAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_void_or_edit()
    {
        $user = User::factory()->create(['role' => 'user']);
        $santri = Santri::factory()->create();
        $wallet = Wallet::create(['santri_id' => $santri->id, 'balance' => 100000]);
        $txn = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50000,
            'balance_after' => 150000,
            'description' => 'seed',
            'reference' => 'TEST-1'
        ]);

        $this->actingAs($user, 'sanctum');
        $res = $this->deleteJson("/api/v1/wallets/transactions/{$txn->id}");
        $res->assertStatus(403);

        $res2 = $this->putJson("/api/v1/wallets/transactions/{$txn->id}", ['amount' => 20000]);
        $res2->assertStatus(403);
    }

    public function test_admin_can_void_transaction()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $santri = Santri::factory()->create();
        $wallet = Wallet::create(['santri_id' => $santri->id, 'balance' => 100000]);
        $txn = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50000,
            'balance_after' => 150000,
            'description' => 'seed',
            'reference' => 'TEST-2'
        ]);

        $this->actingAs($admin, 'sanctum');
        $res = $this->deleteJson("/api/v1/wallets/transactions/{$txn->id}");
        $res->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('wallet_transactions', ['id' => $txn->id, 'voided' => true]);
    }

    public function test_admin_can_update_transaction()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $santri = Santri::factory()->create();
        $wallet = Wallet::create(['santri_id' => $santri->id, 'balance' => 100000]);
        $txn = WalletTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => 50000,
            'balance_after' => 150000,
            'description' => 'seed',
            'reference' => 'TEST-3'
        ]);

        $this->actingAs($admin, 'sanctum');
        $res = $this->putJson("/api/v1/wallets/transactions/{$txn->id}", [
            'amount' => 20000,
            'description' => 'edited',
            'method' => 'cash'
        ]);

        $res->assertStatus(200)->assertJson(['success' => true]);

        // original should be voided
        $this->assertDatabaseHas('wallet_transactions', ['id' => $txn->id, 'voided' => true]);

        // new transaction exists
        $this->assertDatabaseHas('wallet_transactions', ['description' => 'edited', 'amount' => 20000]);
    }
}
