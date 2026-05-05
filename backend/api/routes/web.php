<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Healthcheck para Railway
Route::get('/up', function () {
    return response()->json(['status' => 'ok'], 200);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy'], 200);
});
