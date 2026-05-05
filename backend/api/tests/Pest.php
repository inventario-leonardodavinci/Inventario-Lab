<?php

/**
 * Configuración global de Pest.
 * Define el TestCase base para todos los tests de Feature y Unit.
 */

use Tests\TestCase;

uses(TestCase::class)->in('Feature', 'Unit');
