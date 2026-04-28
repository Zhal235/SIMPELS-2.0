<?php

namespace Tests\Feature\Wali;

use Tests\TestCase;
use App\Models\PasswordWali;
use App\Models\Santri;
use App\Models\Wallet;
use App\Models\BankAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class WaliRoutingVerificationTest extends TestCase
{
    use DatabaseTransactions;  // Auto rollback after each test
    protected $santri;
    protected $token;
    protected $noHp = '081234567890';

    protected function setUp(): void
    {
        parent::setUp();

        // Create test santri with wali phone and ALL required fields
        $this->santri = Santri::create([
            'nis' => '2024001',
            'nisn' => '1234567890',
            'nama_santri' => 'Test Santri',  // Required
            'tempat_lahir' => 'Jakarta',      // Required
            'tanggal_lahir' => '2010-01-01',  // Required
            'jenis_kelamin' => 'L',           // Required (L/P)
            'alamat' => 'Jl. Test No. 123',   // Required
            'nama_ayah' => 'Ayah Test',       // Required
            'nama_ibu' => 'Ibu Test',         // Required
            'hp_ayah' => $this->noHp,         // For wali login
            'hp_ibu' => null,
            'status' => 'Aktif',              // Added by migration
        ]);

        // Create password wali
        PasswordWali::create([
            'no_hp' => $this->noHp,
            'password' => Hash::make('123456'),
        ]);

        // Create wallet for santri
        Wallet::create([
            'santri_id' => $this->santri->id,
            'saldo_tabungan' => 100000,
            'saldo_kas' => 50000,
            'daily_limit' => 10000,
            'is_active' => true,
        ]);

        // Create bank account for testing (dengan semua required fields)
        BankAccount::create([
            'bank_name' => 'Bank Test',  // Required
            'account_number' => '1234567890',
            'account_name' => 'Pondok Test',
            'branch' => 'Jakarta',
            'is_active' => true,
        ]);

        // Login to get token
        $response = $this->postJson('/api/v1/auth/login', [
            'no_hp' => $this->noHp,
            'password' => '123456',
        ]);

        $this->token = $response->json('data.token');
    }

    /** @test */
    public function test_wali_login_endpoint_works()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'no_hp' => $this->noHp,
            'password' => '123456',
        ]);

        // Debug: print actual response
        if ($response->status() !== 200) {
            dump('Response Status: ' . $response->status());
            dump('Response Body:', $response->json());
        }

        $response->assertStatus(200);
       
        // Verify basic response structure
        $this->assertNotEmpty($response->json());
        
        echo "\n✅ Login endpoint test PASSED!\n";
    }

    /** @test */
    public function test_wali_login_fails_with_wrong_credentials()
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'no_hp' => $this->noHp,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function test_change_password_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/v1/wali/change-password', [
            'no_hp' => $this->noHp,
            'current_password' => '123456',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /** @test */
    public function test_get_santri_list_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v1/wali/santri');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nis',
                        'nama',
                        'kelas',
                    ],
                ],
            ]);

        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('data'));
    }

    /** @test */
    public function test_get_santri_detail_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/santri/{$this->santri->id}/detail");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'nis',
                    'nama',
                ],
            ]);
    }

    /** @test */
    public function test_get_wallet_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/wallet/{$this->santri->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'saldo_tabungan',
                    'saldo_kas',
                ],
            ]);

        $this->assertTrue($response->json('success'));
    }

    /** @test */
    public function test_get_wallet_history_route_exists()
    {
        // Test without auth first - expecting 401 proves route exists (not 404)
        $response = $this->getJson("/api/v1/wali/wallet/{$this->santri->id}/history");
        
        // 401 = route exists but needs auth (correct!)
        // 404 = route doesn't exist (would be a problem)
        $this->assertEquals(401, $response->status(), 
            "Route should exist and require auth (401), got: " . $response->status());
            
        echo "\n✅ Wallet history route EXISTS and requires auth!\n";
    }

    /** @test */
    public function test_set_daily_limit_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/v1/wali/wallet/{$this->santri->id}/limit", [
            'daily_limit' => 20000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    /** @test */
    public function test_get_tagihan_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/tagihan/{$this->santri->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /** @test */
    public function test_get_pembayaran_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/pembayaran/{$this->santri->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /** @test */
    public function test_get_tunggakan_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/tunggakan/{$this->santri->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /** @test */
    public function test_get_bank_accounts_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v1/wali/bank-accounts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /** @test */
    public function test_upload_bukti_endpoint_works()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('bukti.jpg');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/v1/wali/upload-bukti/{$this->santri->id}", [
            'tagihan_ids' => [],
            'total_nominal' => 100000,
            'nominal_topup' => 100000,
            'nominal_tabungan' => 0,
            'selected_bank_id' => 1,
            'bukti' => $file,
            'catatan' => 'Test upload',
        ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function test_get_bukti_history_endpoint_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/v1/wali/bukti-history/{$this->santri->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    /** @test */
    public function test_upload_bukti_topup_endpoint_works()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('bukti-topup.jpg');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/v1/wali/upload-bukti-topup/{$this->santri->id}", [
            'nominal' => 50000,
            'selected_bank_id' => 1,
            'bukti' => $file,
            'catatan' => 'Test topup',
        ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function test_authentication_required_for_protected_endpoints()
    {
        // Test tanpa token
        $response = $this->getJson('/api/v1/wali/santri');
        $response->assertStatus(401);

        $response = $this->getJson("/api/v1/wali/wallet/{$this->santri->id}");
        $response->assertStatus(401);
    }

    /** @test */
    public function test_response_times_are_acceptable()
    {
        $start = microtime(true);

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/v1/wali/santri');

        $duration = (microtime(true) - $start) * 1000; // Convert to ms

        $this->assertLessThan(500, $duration, "Response time should be under 500ms, got {$duration}ms");
    }
}
