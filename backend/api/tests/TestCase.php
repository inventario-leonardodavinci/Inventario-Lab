<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Establecer variable de sesión PostgreSQL para que fn_auditoria() no falle.
        // Sin esto, DELETE/INSERT en tablas auditadas dentro de DatabaseTransactions
        // puede dejar la transacción en estado 'aborted' (SQLSTATE 25P02).
        try {
            DB::statement('SET app.current_user_id = 0');
        } catch (\Throwable) {
            // Silencioso en SQLite u otros drivers que no soporten SET
        }
    }
}
