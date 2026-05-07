<?php

/**
 * Constantes de aplicación - Centralizar aquí evita magic numbers
 */

return [
    // ── Rate Limiting ─────────────────────────────────────────────────────
    'api_rate_limit_per_minute' => 60,
    'login_rate_limit_per_minute' => 10,
    'write_rate_limit_per_minute' => 30,

    // ── Paginación ─────────────────────────────────────────────────────────
    'default_per_page' => 20,
    'max_per_page' => 500,

    // ── Movimientos ────────────────────────────────────────────────────────
    'tipos_movimiento' => ['entrada', 'salida', 'traslado', 'ajuste'],
    'cantidad_minima_movimiento' => 0.01,

    // ── Alertas ────────────────────────────────────────────────────────────
    'tipos_alerta' => ['stock_bajo', 'mantenimiento', 'vencimiento'],
    'estados_alerta' => ['abierta', 'confirmada', 'resuelta'],
    'severidades_alerta' => ['baja', 'media', 'alta', 'critica'],

    // ── Validación ─────────────────────────────────────────────────────────
    'codigo_max_length' => 50,
    'nombre_max_length' => 255,
    'notas_max_length' => 1000,
    'cantidad_decimales' => 2,
];
