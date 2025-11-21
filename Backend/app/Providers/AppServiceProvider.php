<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Santri;
use App\Observers\SantriObserver;

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
        Santri::observe(SantriObserver::class);
    }
}
