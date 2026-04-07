<?php

namespace Tests\Feature\Epos;

use Tests\TestCase;
use App\Models\Santri;
use App\Models\RfidTag;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * EPOS API Contract Tests
 * 
 * These tests ensure that the EPOS integration endpoints maintain
 * their contract (response structure, status codes, field names).
 * 
 * CRITICAL: These tests MUST pass before deploying any refactor!
 * If any test fails, the refactor has broken the EPOS integration.
 */
class EposApiContractTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test health check endpoint (ping)
     * Endpoint: GET /api/v1/wallets/ping
     */
    public function test_ping_endpoint_returns_ok_status()
    {
        $response = $this->get('/api/v1/wallets/ping');

        $response->assertStatus(200);
        // Ping might return simple response, just check it's successful
        $this->assertTrue($response->isSuccessful());
    }

    /**
     * Test RFID lookup endpoint (CRITICAL!)
     * Endpoint: GET /api/v1/wallets/rfid/uid/{uid}
     * 
     * This is the MOST CRITICAL endpoint for EPOS.
     * Response structure MUST NOT change!
     */
    public function test_rfid_lookup_returns_correct_structure()
    {
        // Arrange
        $santri = Santri::factory()->create([
            'nama_santri' => 'Test Santri',
            'nis' => 'TEST001'
        ]);
        
        $rfid = RfidTag::create([
            'santri_id' => $santri->id,
            'uid' => 'TEST123456789',
            'status' => 'active'
        ]);
        
        $wallet = Wallet::create([
            'santri_id' => $santri->id,
            'cash_balance' => 50000,
            'bank_balance' => 100000,
            'is_active' => true
        ]);

        // Act
        $response = $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");

        // Assert - STRUCTURE MUST NOT CHANGE!
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'rfid_uid',
            'santri_id',
            'santri' => [
                'id',
                'nis',
                'nama',
            ],
            'wallet' => [
                'cash_balance',
                'bank_balance',
                'total_balance',
                'daily_limit',
                'today_spending',
                'remaining_limit'
            ]
        ]);

        // Verify field names are exact
        $data = $response->json();
        $this->assertArrayHasKey('rfid_uid', $data);
        $this->assertArrayHasKey('santri_id', $data);
        $this->assertArrayHasKey('santri', $data);
        $this->assertArrayHasKey('wallet', $data);
        
        // Verify data types
        $this->assertIsString($data['rfid_uid']);
        $this->assertIsString($data['santri_id']);
        $this->assertIsArray($data['santri']);
        $this->assertIsArray($data['wallet']);
        
        // Verify wallet numeric fields
        $this->assertIsNumeric($data['wallet']['cash_balance']);
        $this->assertIsNumeric($data['wallet']['bank_balance']);
        $this->assertIsNumeric($data['wallet']['total_balance']);
    }

    /**
     * Test RFID lookup with non-existent UID
     * Must return 404 status
     */
    public function test_rfid_lookup_returns_404_for_nonexistent_uid()
    {
        $response = $this->get('/api/v1/wallets/rfid/uid/NONEXISTENT');

        $response->assertStatus(404);
        $response->assertJsonStructure(['message']);
    }

    /**
     * Test EPOS transaction endpoint (CRITICAL!)
     * Endpoint: POST /api/v1/wallets/epos/transaction
     * 
     * This endpoint processes all EPOS purchases.
     * Response structure MUST NOT change!
     */
    public function test_epos_transaction_success_response_structure()
    {
        // Arrange
        $santri = Santri::factory()->create();
        
        $rfid = RfidTag::factory()->create([
            'santri_id' => $santri->id,
            'uid' => 'TESTUID123'
        ]);
        
        $wallet = Wallet:create([
            'santri_id' => $santri->id,
            'uid' => 'TESTUID123',
            'status' => 'active'
        ]);
        
        $wallet = Wallet::create([
            'santri_id' => $santri->id,
            'cash_balance' => 50000,
            'bank_balance' => 100000,
            'is_active' => true
            'epos_txn_id' => 'EPOS-TEST-' . time(),
            'meta' => [
                'items' => [
                    ['name' => 'Nasi Goreng', 'quantity' => 1, 'price' => 10000]
                ],
                'terminal_id' => 'TEST-001'
            ]
        ];

        // Act
        $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);

        // Assert - STRUCTURE MUST NOT CHANGE!
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'transaction',
                'wallet_balance',
                'remaining_limit',
                'spent_today',
                'limit_harian'
            ]
        ]);

        // Verify success flag
        $this->assertTrue($response->json('success'));
        
        // Verify data types
        $data = $response->json('data');
        $this->assertIsArray($data['transaction']);
        $this->assertIsNumeric($data['wallet_balance']);
        $this->assertIsNumeric($data['remaining_limit']);
    }

    /**
     * Test EPOS transaction with insufficient balance
     * Must return 400 status with error message
     */
    public function test_epos_transaction_insufficient_balance_error()
    {
        // Arrange
        $santri = Santri::create([
            'santri_id' => $santri->id,
            'cash_balance' => 5000, // Low balance
            'bank_balance' => 0,
            'is_active' => truetri->id,
            'cash_balance' => 5000, // Low balance
            'bank_balance' => 0
        ]);

        $transactionData = [
            'santri_id' => $santri->id,
            'amount' => 10000, // More than balance
            'epos_txn_id' => 'EPOS-TEST-FAIL-' . time(),
            'meta' => ['terminal_id' => 'TEST-001']
        ];

        // Act
        $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);

        // Assert
        $response->assertStatus(400);
        $response->assertJsonStructure(['success', 'message']);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('balance', strtolower($response->json('message')));
    }

    /**
     * Test wallet settings endpoint
     * Endpoint: GET /api/v1/epos/wallet-settings
     */
    public function test_wallet_settings_returns_correct_structure()
    {
        $response = $this->get('/api/v1/epos/wallet-settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'global_minimum_balance',
                'min_balance_jajan'
            ]
        ]);

        // Verify data types
        $data = $response->json('data');
        $this->assertIsNumeric($data['global_minimum_balance']);
        $this->assertIsNumeric($data['min_balance_jajan']);
    }

    /**
     * Test EPOS withdrawal creation
     * Endpoint: POST /api/v1/wallets/epos/withdrawal
     */
    public function test_epos_withdrawal_creation_structure()
    {
        // Arrangecreate([
            'santri_id' => $santri->id,
            'cash_balance' => 100000,
            'bank_balance' => 50000,
            'is_active' => true->create([
            'santri_id' => $santri->id,
            'cash_balance' => 100000,
            'bank_balance' => 50000
        ]);

        $withdrawalData = [
            'santri_id' => $santri->id,
            'rfid_uid' => 'TEST123',
            'amount' => 50000,
            'terminal_id' => 'EPOS-001',
            'notes' => 'Test withdrawal'
        ];

        // Act
        $response = $this->postJson('/api/v1/wallets/epos/withdrawal', $withdrawalData);

        // Assert
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'withdrawal_number',
            'message',
            'santri',
            'amount',
            'status',
            'created_at'
        ]);

        // Verify withdrawal number format
        $this->assertStringStartsWith('WD', $response->json('withdrawal_number'));
        $this->assertEquals('pending', $response->json('status'));
    }

    /**
     * Test that HTTP methods are correct
     * This prevents accidental method changes that would break EPOS
     */
    public function test_epos_endpoints_http_methods()
    {
        // GET endpoints should not accept POST
        $this->post('/api/v1/wallets/ping')->assertStatus(405);
        
        // POST endpoints should not accept GET
        $this->get('/api/v1/wallets/epos/transaction')->assertStatus(405);
    }

    /**
     * Test response time is acceptable
     * EPOS terminals need fast responses (< 500ms)
     */
    public function test_rfid_lookup_response_time()
    {create([
            'santri_id' => $santri->id,
            'uid' => 'SPEED_TEST',
            'status' => 'active'
        ]);
        Wallet::create([
            'santri_id' => $santri->id,
            'cash_balance' => 50000,
            'bank_balance' => 50000,
            'is_active' => true
        
        ]);
        Wallet::factory()->create(['santri_id' => $santri->id]);

        $start = microtime(true);
        $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");
        $duration = (microtime(true) - $start) * 1000; // Convert to ms

        $this->assertLessThan(500, $duration, "RFID lookup took {$duration}ms, should be < 500ms");
    }
}
