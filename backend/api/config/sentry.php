<?php

return [

    // DSN del proyecto Laravel en Sentry.
    // Configurar en .env: SENTRY_LARAVEL_DSN=https://...
    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    // Entorno (production, staging, local…)
    'environment' => env('APP_ENV', 'production'),

    // Release — útil para correlacionar errores con deploys.
    // Se puede inyectar desde el pipeline: SENTRY_RELEASE=v1.2.3
    'release' => env('SENTRY_RELEASE'),

    // Porcentaje de trazas de performance a capturar (0.0 - 1.0).
    // 0.1 = 10% de las peticiones. Subir en staging si se necesita más detalle.
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),

    // No enviar excepciones de estos tipos a Sentry.
    // ValidationException y AuthorizationException son ruido esperado.
    'ignore_exceptions' => [
        \Illuminate\Validation\ValidationException::class,
        \Illuminate\Auth\Access\AuthorizationException::class,
        \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException::class,
    ],

    // No enviar peticiones a estas rutas (health checks, etc.)
    'ignore_transactions' => [
        '/up',
        '/health',
    ],

    // Datos de contexto adicionales adjuntos a cada evento.
    'send_default_pii' => false,

];
