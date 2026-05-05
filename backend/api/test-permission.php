<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $p = Spatie\Permission\Models\Permission::firstOrCreate(
        ['name' => 'test', 'guard_name' => 'api']
    );
    echo "Permiso creado: " . $p->name . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
