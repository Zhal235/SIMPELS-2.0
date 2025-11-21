<?php

namespace App\Observers;

use App\Models\Santri;
use App\Models\Wallet;

class SantriObserver
{
    /**
     * Handle the Santri "created" event.
     */
    public function created(Santri $santri): void
    {
        // Ensure wallet exists for this santri (default balance 0)
        Wallet::firstOrCreate(['santri_id' => $santri->id], ['balance' => 0]);
    }
}
