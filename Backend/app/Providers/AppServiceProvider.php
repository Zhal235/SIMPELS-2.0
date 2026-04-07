<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Santri;
use App\Models\WalletTransaction;
use App\Observers\SantriObserver;
use App\Observers\WalletTransactionObserver;
use App\Repositories\Contracts\WalletRepositoryInterface;
use App\Repositories\Contracts\WalletTransactionRepositoryInterface;
use App\Repositories\WalletRepository;
use App\Repositories\WalletTransactionRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind Repository Interfaces to Implementations
        $this->app->bind(WalletRepositoryInterface::class, WalletRepository::class);
        $this->app->bind(WalletTransactionRepositoryInterface::class, WalletTransactionRepository::class);
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
