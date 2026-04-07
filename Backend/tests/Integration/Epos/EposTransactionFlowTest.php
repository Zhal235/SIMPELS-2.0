<?php

namespace Tests\Integration\Epos;

use Tests\TestCase;
use App\Models\Santri;
use App\Models\RfidTag;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * EPOS Integration Tests
 * 
 * These tests simulate complete EPOS transaction flows from start to finish.
 * Tests the integration between multiple components:
 * - RFID lookup
 * - Wallet balance checks
 * - Transaction processing
 * - Balance updates
 * - Limit enforcement
 * 
 * CRITICAL: These tests MUST pass to ensure EPOS terminals work correctly!
 */
class EposTransactionFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Complete successful transaction flow
     * Simulates: Santri taps RFID → Lookup → Make purchase → Balance updated
     */
    public function test_complete_successful_transaction_flow()
    {
        // Step 1: Setup - Create santri with RFID and wallet
        $santri = Santri::factory()->create([
            'nama' => 'Ahmad Test',
            'nis' => 'TEST001'
        ]);
        
        $rfid = RfidTag::factory()->create([
            'santri_id' => $santri->id,
            'uid' => 'FLOW_TEST_001'
        ]);
        
        $initialBalance = 100000;
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => $initialBalance,
            'bank_balance' => 50000,
            'daily_limit' => 50000
        ]);

        // Step 2: EPOS taps RFID card - Lookup santri
        $lookupResponse = $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");
        
        $lookupResponse->assertStatus(200);
        $this->assertEquals($santri->id, $lookupResponse->json('santri_id'));
        $this->assertEquals($initialBalance, $lookupResponse->json('wallet.cash_balance'));
        
        // Step 3: EPOS creates transaction (purchase)
        $purchaseAmount = 15000;
        $transactionData = [
            'santri_id' => $santri->id,
            'amount' => $purchaseAmount,
            'epos_txn_id' => 'FLOW-TEST-' . time(),
            'meta' => [
                'items' => [
                    ['name' => 'Nasi Goreng', 'quantity' => 1, 'price' => 10000],
                    ['name' => 'Es Teh', 'quantity' => 1, 'price' => 5000]
                ],
                'terminal_id' => 'TEST-TERMINAL-001',
                'cashier' => 'Test Cashier'
            ]
        ];
        
        $transactionResponse = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);
        
        $transactionResponse->assertStatus(201);
        $this->assertTrue($transactionResponse->json('success'));
        
        // Step 4: Verify balance was deducted
        $expectedNewBalance = $initialBalance - $purchaseAmount;
        $this->assertEquals($expectedNewBalance, $transactionResponse->json('data.wallet_balance'));
        
        // Step 5: Verify database was updated
        $wallet->refresh();
        $this->assertEquals($expectedNewBalance, $wallet->cash_balance);
        
        // Step 6: Verify transaction was recorded
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $purchaseAmount
        ]);
        
        // Step 7: Verify RFID lookup shows updated balance
        $verifyResponse = $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");
        $this->assertEquals($expectedNewBalance, $verifyResponse->json('wallet.cash_balance'));
    }

    /**
     * Test: Transaction rejected due to insufficient balance
     */
    public function test_transaction_rejected_insufficient_balance()
    {
        $santri = Santri::factory()->create();
        $rfid = RfidTag::factory()->create(['santri_id' => $santri->id, 'uid' => 'LOW_BALANCE']);
        
        $lowBalance = 5000;
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => $lowBalance,
            'bank_balance' => 0
        ]);

        // Try to purchase more than balance
        $transactionData = [
            'santri_id' => $santri->id,
            'amount' => 10000, // More than balance
            'epos_txn_id' => 'FAIL-TEST-' . time(),
            'meta' => ['terminal_id' => 'TEST']
        ];
        
        $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);
        
        // Should be rejected
        $response->assertStatus(400);
        $this->assertFalse($response->json('success'));
        
        // Balance should remain unchanged
        $wallet->refresh();
        $this->assertEquals($lowBalance, $wallet->cash_balance);
        
        // No transaction should be recorded
        $this->assertDatabaseMissing('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'amount' => 10000
        ]);
    }

    /**
     * Test: Transaction rejected due to daily limit exceeded
     */
    public function test_transaction_rejected_daily_limit_exceeded()
    {
        $santri = Santri::factory()->create();
        $rfid = RfidTag::factory()->create(['santri_id' => $santri->id, 'uid' => 'LIMIT_TEST']);
        
        $dailyLimit = 20000;
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => 100000, // Enough balance
            'bank_balance' => 0,
            'daily_limit' => $dailyLimit
        ]);

        // Create existing transaction today (15000)
        WalletTransaction::factory()->create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'method' => 'epos',
            'amount' => 15000,
            'created_at' => now()
        ]);

        // Try to spend 10000 more (total would be 25000, exceeds 20000 limit)
        $transactionData = [
            'santri_id' => $santri->id,
            'amount' => 10000,
            'epos_txn_id' => 'LIMIT-FAIL-' . time(),
            'meta' => ['terminal_id' => 'TEST']
        ];
        
        $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);
        
        // Should be rejected due to limit
        $response->assertStatus(400);
        $this->assertStringContainsString('limit', strtolower($response->json('message')));
    }

    /**
     * Test: Multiple transactions within limit
     */
    public function test_multiple_transactions_within_limit()
    {
        $santri = Santri::factory()->create();
        $rfid = RfidTag::factory()->create(['santri_id' => $santri->id, 'uid' => 'MULTI_TEST']);
        
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => 100000,
            'bank_balance' => 0,
            'daily_limit' => 50000
        ]);

        $transactions = [5000, 10000, 8000]; // Total: 23000 (within 50000 limit)
        $runningBalance = 100000;

        foreach ($transactions as $index => $amount) {
            $transactionData = [
                'santri_id' => $santri->id,
                'amount' => $amount,
                'epos_txn_id' => 'MULTI-' . time() . '-' . $index,
                'meta' => ['terminal_id' => 'TEST']
            ];
            
            $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);
            
            $response->assertStatus(201);
            $this->assertTrue($response->json('success'));
            
            $runningBalance -= $amount;
            $this->assertEquals($runningBalance, $response->json('data.wallet_balance'));
        }

        // Verify final balance
        $wallet->refresh();
        $this->assertEquals($runningBalance, $wallet->cash_balance);
    }

    /**
     * Test: RFID not found scenario
     */
    public function test_rfid_not_found()
    {
        $response = $this->get('/api/v1/wallets/rfid/uid/NONEXISTENT_UID');
        
        $response->assertStatus(404);
        $response->assertJsonStructure(['message']);
    }

    /**
     * Test: Withdrawal flow
     */
    public function test_withdrawal_creation_flow()
    {
        $santri = Santri::factory()->create();
        $rfid = RfidTag::factory()->create(['santri_id' => $santri->id, 'uid' => 'WD_TEST']);
        
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => 100000,
            'bank_balance' => 50000
        ]);

        // Step 1: EPOS creates withdrawal request
        $withdrawalData = [
            'santri_id' => $santri->id,
            'rfid_uid' => $rfid->uid,
            'amount' => 50000,
            'terminal_id' => 'EPOS-WD-001',
            'notes' => 'Test withdrawal'
        ];
        
        $createResponse = $this->postJson('/api/v1/wallets/epos/withdrawal', $withdrawalData);
        
        $createResponse->assertStatus(201);
        $this->assertStringStartsWith('WD', $createResponse->json('withdrawal_number'));
        $this->assertEquals('pending', $createResponse->json('status'));
        
        // Step 2: Check withdrawal status
        $withdrawalNumber = $createResponse->json('withdrawal_number');
        $statusResponse = $this->get("/api/v1/wallets/epos/withdrawal/{$withdrawalNumber}/status");
        
        $statusResponse->assertStatus(200);
        $this->assertEquals('pending', $statusResponse->json('status'));
        $this->assertEquals(50000, $statusResponse->json('amount'));
    }

    /**
     * Test: Health check endpoint
     */
    public function test_health_check_endpoint()
    {
        $response = $this->get('/api/epos/health');
        
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'version',
            'timestamp',
            'endpoints',
            'database'
        ]);
        
        $this->assertEquals('ok', $response->json('status'));
        $this->assertEquals('connected', $response->json('database'));
    }

    /**
     * Test: Response time is acceptable for EPOS
     * EPOS terminals need fast responses
     */
    public function test_transaction_response_time()
    {
        $santri = Santri::factory()->create();
        $wallet = Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => 100000
        ]);

        $transactionData = [
            'santri_id' => $santri->id,
            'amount' => 5000,
            'epos_txn_id' => 'SPEED-' . time(),
            'meta' => ['terminal_id' => 'TEST']
        ];

        $start = microtime(true);
        $response = $this->postJson('/api/v1/wallets/epos/transaction', $transactionData);
        $duration = (microtime(true) - $start) * 1000; // ms

        $response->assertStatus(201);
        $this->assertLessThan(500, $duration, "Transaction took {$duration}ms, should be < 500ms");
    }
}
