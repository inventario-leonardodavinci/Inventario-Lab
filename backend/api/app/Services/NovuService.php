<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NovuService
{
    public function triggerLoginEvent(string $authUserId, string $displayName): void
    {
        $apiKey = config('services.novu.api_key');
        $triggerIdentifier = config('services.novu.login_trigger', 'user-login');
        $apiUrl = rtrim((string) config('services.novu.api_url', 'https://api.novu.co'), '/');

        if (! $apiKey) {
            return;
        }

        try {
            $respuesta = Http::withToken($apiKey)
                ->timeout(5)
                ->post("{$apiUrl}/v1/events/trigger", [
                    'name' => $triggerIdentifier,
                    'to' => [
                        'subscriberId' => $authUserId,
                        'firstName' => $displayName,
                    ],
                    'payload' => [
                        'title' => 'Inicio de sesion',
                        'message' => 'Has iniciado sesion correctamente.',
                    ],
                ]);

            if ($respuesta->failed()) {
                Log::warning('NovuService: fallo al disparar evento de login.', [
                    'auth_user_id' => $authUserId,
                    'status'       => $respuesta->status(),
                    'body'         => $respuesta->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('NovuService: excepción al disparar evento de login.', [
                'auth_user_id' => $authUserId,
                'error'        => $e->getMessage(),
            ]);
        }
    }
}
