<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Santri;

class WalletTransactionAuthTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_topup_sets_created_by()
    {
        // create admin user
        $user = User::factory()->create();

        // create santri
        $santri = Santri::factory()->create();

        // act as user via sanctum
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson("/api/v1/wallets/{$santri->id}/topup", [
            'amount' => 50000,
            'description' => 'Test topup',
            'method' => 'cash'
        ]);

        $res->assertStatus(201);

        $this->assertDatabaseHas('wallet_transactions', [
            'created_by' => $user->id,
            'description' => 'Test topup'
        ]);
    }
}
