<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
        RateLimiter::for('api', function (Request $request): Limit {
            $identity = (string) $request->header('X-Auth-User-Id', $request->ip());
            return Limit::perMinute(config('constantes.api_rate_limit_per_minute'))->by($identity);
        });

        RateLimiter::for('login-evento', function (Request $request): Limit {
            $identity = (string) $request->header('X-Auth-User-Id', $request->ip());
            return Limit::perMinute(config('constantes.login_rate_limit_per_minute'))->by($identity);
        });

        RateLimiter::for('escritura', function (Request $request): Limit {
            $identity = (string) $request->header('X-Auth-User-Id', $request->ip());
            return Limit::perMinute(config('constantes.write_rate_limit_per_minute'))->by($identity);
        });
    }
}
