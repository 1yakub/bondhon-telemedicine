<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/';

    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Named limiters from the Laravel rate limiting docs. Each auth route gets a
     * per target limit (phone or email) and a per IP limit, so one attacker cannot
     * brute force a code, spam SMS to one number, or spray passwords.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // one code per phone every 30 seconds, and a small per IP budget
        RateLimiter::for('otp-send', function (Request $request) {
            return [
                Limit::perMinute(2)->by('phone:'.$request->input('phone')),
                Limit::perHour(5)->by('phone-hour:'.$request->input('phone')),
                Limit::perMinute(10)->by($request->ip()),
            ];
        });

        // a six digit code survives at most five guesses per phone
        RateLimiter::for('otp-verify', function (Request $request) {
            return [
                Limit::perMinutes(5, 5)->by('verify:'.$request->input('phone')),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by('login:'.strtolower((string) $request->input('email'))),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });
    }
}
