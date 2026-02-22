<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Santri;
use App\Models\WalletTransaction;
use App\Observers\SantriObserver;
use App\Observers\WalletTransactionObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register model observers
        // Santri::observe(SantriObserver::class);
        // WalletTransaction::observe(WalletTransactionObserver::class);
    }
}
