<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Services\WalletService;
use Illuminate\Http\Request;

class WalletController extends BaseController
{
    protected $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Get total cash and bank balances
     * GET /api/v1/wallets/balances
     */
    public function getBalances()
    {
        $cashBalance = $this->walletService->calculateTotalCashBalance();
        $bankBalance = $this->walletService->calculateTotalBankBalance();
        
        return $this->sendResponse([
            'cash' => (int) $cashBalance,
            'bank' => (int) $bankBalance,
            'total' => (int) ($cashBalance + $bankBalance)
        ], 'Berhasil mengambil data saldo keuangan');
    }

    // Other methods would be refactored similarly...
}
