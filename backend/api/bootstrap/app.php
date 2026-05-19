<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\AsignarRolUsuario::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'app.user'       => \App\Http\Middleware\ResolverUsuarioApp::class,
            'audit.write'    => \App\Http\Middleware\AuditarEscritura::class,
            'role'           => \App\Http\Middleware\AsegurarRol::class,
            'permiso'        => \App\Http\Middleware\AsegurarPermiso::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })->create();
