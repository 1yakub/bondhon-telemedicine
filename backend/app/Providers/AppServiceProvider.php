<?php

namespace App\Providers;

use App\Services\SslCommerz;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // gateway credentials come from config, so the container needs to be told how to build it
        $this->app->bind(SslCommerz::class, fn () => SslCommerz::fromConfig());

        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
