<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Santri;
use App\Models\Wallet;

class SantriWalletTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function creating_a_santri_also_creates_a_wallet()
    {
        $santri = Santri::factory()->create();

        $this->assertDatabaseHas('wallets', ['santri_id' => $santri->id]);
        $wallet = Wallet::where('santri_id', $santri->id)->first();
        $this->assertNotNull($wallet);
        $this->assertEquals(0, (float) $wallet->balance);
    }
}
